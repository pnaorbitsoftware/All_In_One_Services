import express from "express";

import requireAuth from "../middleware/requireAuth.js";
import Booking from "../models/Booking.js";
import Provider from "../models/Provider.js";
import User from "../models/User.js";
import {
  sendProviderAcceptedEmail,
  sendServiceCompletedEmail,
} from "../services/mailService.js";
import { buildServiceRegexes, normalizeServiceName } from "../utils/serviceMatching.js";
import { buildProviderPaymentSummary, DEFAULT_PROVIDER_SHARE_PERCENT } from "../utils/paymentSummary.js";
import { buildTrackingEvent, ensureTrackingHistory, normalizeTrackingStatus } from "../utils/tracking.js";
import { sendPushNotification } from "../utils/pushNotifications.js";

const router = express.Router();
const availabilityStatuses = ["active", "inactive", "absent", "available"];
const bookableAvailabilityStatuses = ["active", "available"];

const isProviderApproved = (provider) => provider?.approvalStatus === "approved";
const isProviderBookable = (provider) =>
  Boolean(provider?.isActive && isProviderApproved(provider) && bookableAvailabilityStatuses.includes(provider.availabilityStatus || "available"));

const lockedDashboardPayload = (provider) => ({
  provider,
  bookings: [],
  availableRequests: [],
  dashboardLocked: true,
  message:
    provider.approvalStatus === "rejected"
      ? provider.rejectionReason || "Provider profile was not approved by admin. Edit your profile and resubmit it."
      : "Provider profile is waiting for admin approval.",
});

const unavailableProviderResponse = (res, provider) =>
  res.status(403).json({
    dashboardLocked: true,
    provider,
    message: "Provider is currently unavailable.",
  });

const normalizeLocationPayload = (body = {}) => ({
  latitude: Number.isFinite(Number(body.latitude)) ? Number(body.latitude) : null,
  longitude: Number.isFinite(Number(body.longitude)) ? Number(body.longitude) : null,
  address: String(body.address || "").trim(),
  timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
});

const requireProvider = (req, res, next) => {
  if (req.user.role !== "provider") {
    return res.status(403).json({ message: "Provider access required." });
  }

  next();
};

const buildAvailableBookingFilter = (provider) => ({
  $or: [{ assignedProvider: null }, { assignedProvider: { $exists: false } }],
  $and: [
    {
      $or: [
        { requestedProvider: provider._id },
        {
          $or: [{ requestedProvider: null }, { requestedProvider: { $exists: false } }],
          service: { $in: buildServiceRegexes(provider.category) },
        },
      ],
    },
  ],
  status: { $in: ["pending", "accepted", "confirmed", "Confirmed"] },
});

router.get("/dashboard", requireAuth, requireProvider, async (req, res) => {
  try {
    const provider = await Provider.findOne({ owner: req.user._id });

    if (!provider) {
      return res.status(404).json({ message: "Provider profile not found." });
    }

    if (!isProviderApproved(provider)) {
      return res.json(lockedDashboardPayload(provider));
    }

    const [bookings, availableRequests] = await Promise.all([
      Booking.find({
        $or: [
          { assignedProvider: provider._id },
          { requestedProvider: provider._id, status: "cancelled" },
        ],
      }).sort({ createdAt: -1 }),
      isProviderBookable(provider)
        ? Booking.find(buildAvailableBookingFilter(provider)).sort({ createdAt: -1 })
        : [],
    ]);

    res.json({
      provider,
      bookings,
      availableRequests,
      paymentSummary: buildProviderPaymentSummary(bookings),
      availabilityMessage: isProviderBookable(provider) ? "" : "Provider is currently unavailable.",
    });
  } catch (error) {
    res.status(500).json({ message: "Provider dashboard could not be loaded." });
  }
});

router.get("/profile", requireAuth, requireProvider, async (req, res) => {
  try {
    const provider = await Provider.findOne({ owner: req.user._id });

    if (!provider) {
      return res.status(404).json({ message: "Provider profile not found." });
    }

    res.json({ provider });
  } catch (error) {
    res.status(500).json({ message: "Provider profile could not be loaded." });
  }
});

router.patch("/profile", requireAuth, requireProvider, async (req, res) => {
  try {
    const {
      name,
      category,
      location,
      phone,
      email,
      price,
      responseTime,
      description,
      about,
      image = "",
      aadhaarCardImage,
      aadhaarFrontUrl,
      aadhaarDocumentUrl,
      aadhaarNumber,
      features = "",
      availabilityStatus,
    } = req.body;

    if (!name || !category || !location || !phone || !email || !price || !responseTime || !description) {
      return res.status(400).json({ message: "Please fill all required provider profile fields." });
    }

    const normalizedCategory = normalizeServiceName(category);
    if (normalizedCategory.trim().length < 2) {
      return res.status(400).json({ message: "Please enter a valid ServiceHub service category." });
    }

    const provider = await Provider.findOne({ owner: req.user._id });

    if (!provider) {
      return res.status(404).json({ message: "Provider profile not found." });
    }

    const submittedAadhaarImage = aadhaarCardImage || aadhaarFrontUrl || aadhaarDocumentUrl;
    const nextAadhaarImage = typeof submittedAadhaarImage === "string" && submittedAadhaarImage.trim()
      ? submittedAadhaarImage.trim()
      : provider.aadhaarCardImage;
    const nextAadhaarNumber = aadhaarNumber === undefined
      ? provider.aadhaarNumber
      : String(aadhaarNumber || "").replace(/\D/g, "");

    if (provider.approvalStatus !== "approved" && (!nextAadhaarImage || String(nextAadhaarNumber || "").length !== 12)) {
      return res.status(400).json({ message: "A 12-digit Aadhaar number and Aadhaar card image are required." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail, _id: { $ne: req.user._id } });

    if (existingUser) {
      return res.status(409).json({ message: "This email is already used by another account." });
    }

    provider.name = name.trim();
    provider.category = normalizedCategory;
    provider.location = location.trim();
    provider.phone = phone.trim();
    provider.email = normalizedEmail;
    provider.price = price.trim();
    provider.responseTime = responseTime.trim();
    provider.description = description.trim();
    provider.about = about?.trim() || description.trim();
    provider.image = typeof image === "string" ? image : "";
    provider.aadhaarCardImage = nextAadhaarImage;
    provider.aadhaarNumber = nextAadhaarNumber;
    if (availabilityStatus && availabilityStatuses.includes(availabilityStatus)) {
      provider.availabilityStatus = availabilityStatus;
      provider.isActive = availabilityStatus !== "inactive";
    }

    provider.features = Array.isArray(features)
      ? features.map((feature) => String(feature).trim()).filter(Boolean)
      : String(features).split(",").map((feature) => feature.trim()).filter(Boolean);

    if (provider.approvalStatus === "rejected") {
      provider.approvalStatus = "pending";
      provider.isActive = false;
      provider.rejectionReason = "";
      provider.rejectedAt = null;
      provider.approvedAt = null;
      provider.resubmittedAt = new Date();
    }

    await provider.save();

    await User.findByIdAndUpdate(req.user._id, {
      name: provider.name,
      email: normalizedEmail,
      phone: provider.phone,
      avatar: provider.image,
    });

    res.json({ message: "Provider profile updated successfully.", provider });
  } catch (error) {
    res.status(500).json({ message: "Provider profile could not be updated." });
  }
});


router.patch("/availability", requireAuth, requireProvider, async (req, res) => {
  try {
    const { availabilityStatus } = req.body;

    if (!availabilityStatuses.includes(availabilityStatus)) {
      return res.status(400).json({ message: "Invalid provider availability status." });
    }

    const provider = await Provider.findOne({ owner: req.user._id });

    if (!provider) {
      return res.status(404).json({ message: "Provider profile not found." });
    }

    if (!isProviderApproved(provider)) {
      return res.status(403).json(lockedDashboardPayload(provider));
    }

    provider.availabilityStatus = availabilityStatus;
    provider.isActive = availabilityStatus !== "inactive";
    await provider.save();

    res.json({ provider, message: "Provider availability updated." });
  } catch (error) {
    res.status(500).json({ message: "Provider availability could not be updated." });
  }
});

router.post("/tracking/start", requireAuth, requireProvider, async (req, res) => {
  try {
    const provider = await Provider.findOne({ owner: req.user._id });

    if (!provider) {
      return res.status(404).json({ message: "Provider profile not found." });
    }

    if (!isProviderApproved(provider)) {
      return res.status(403).json(lockedDashboardPayload(provider));
    }

    provider.trackingConsent = true;
    provider.trackingActive = true;
    provider.currentLocation = normalizeLocationPayload(req.body);
    await provider.save();

    res.json({ provider, message: "Tracking started." });
  } catch (error) {
    res.status(500).json({ message: "Tracking could not be started." });
  }
});

router.post("/tracking/stop", requireAuth, requireProvider, async (req, res) => {
  try {
    const provider = await Provider.findOne({ owner: req.user._id });

    if (!provider) {
      return res.status(404).json({ message: "Provider profile not found." });
    }

    provider.trackingActive = false;
    await provider.save();

    res.json({ provider, message: "Tracking stopped." });
  } catch (error) {
    res.status(500).json({ message: "Tracking could not be stopped." });
  }
});

router.patch("/tracking/location", requireAuth, requireProvider, async (req, res) => {
  try {
    const provider = await Provider.findOne({ owner: req.user._id });

    if (!provider) {
      return res.status(404).json({ message: "Provider profile not found." });
    }

    if (!provider.trackingConsent || !provider.trackingActive) {
      return res.status(403).json({ message: "Start tracking with consent before sending location updates." });
    }

    provider.currentLocation = normalizeLocationPayload(req.body);
    await provider.save();

    res.json({ provider, message: "Location updated." });
  } catch (error) {
    res.status(500).json({ message: "Location could not be updated." });
  }
});
router.patch("/bookings/:bookingId/accept", requireAuth, requireProvider, async (req, res) => {
  try {
    const provider = await Provider.findOne({ owner: req.user._id });

    if (!provider) {
      return res.status(404).json({ message: "Provider profile not found." });
    }

    if (!isProviderApproved(provider)) {
      return res.json(lockedDashboardPayload(provider));
    }

    if (!isProviderBookable(provider)) {
      return unavailableProviderResponse(res, provider);
    }

        const booking = await Booking.findOne({
      _id: req.params.bookingId,
      ...buildAvailableBookingFilter(provider),
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking request is no longer available." });
    }

    booking.assignedProvider = provider._id;
    booking.assignedProviderName = provider.name;
    booking.status = "Provider Assigned";
    booking.acceptedAt = booking.acceptedAt || new Date();
    booking.assignedAt = booking.assignedAt || new Date();
    ensureTrackingHistory(booking);
    if (normalizeTrackingStatus(booking.trackingHistory.at(-1)?.status) !== "Provider Assigned") {
      booking.trackingHistory.push(buildTrackingEvent("Provider Assigned", { updatedBy: "provider" }));
    }
    await booking.save();
    const client = await User.findById(booking.user);
    await sendProviderAcceptedEmail({
      to: client?.email,
      name: client?.name || booking.name,
      booking,
      provider,
    });


      sendPushNotification({
        tokens: client?.expoPushTokens || [],
        title: "Provider assigned",
        body: `${provider.name} accepted your ${booking.service} booking.`,
        data: {
          type: "booking",
          bookingId: String(booking._id),
          status: "Provider Assigned",
        },
      });

    res.json({ booking });
  } catch (error) {
    res.status(500).json({ message: "Booking request could not be accepted." });
  }
});

router.patch("/bookings/:bookingId/status", requireAuth, requireProvider, async (req, res) => {
  try {
    const { status, workImage = "", cancellationReason = "" } = req.body;
    const allowedStatuses = ["confirmed", "completed", "cancelled", "Confirmed", "Provider Assigned", "On The Way", "Arrived", "Service Started", "Completed", "Cancelled"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid booking status." });
    }

    const provider = await Provider.findOne({ owner: req.user._id });

    if (!provider) {
      return res.status(404).json({ message: "Provider profile not found." });
    }

    if (!isProviderApproved(provider)) {
      return res.status(403).json(lockedDashboardPayload(provider));
    }

    if (!isProviderBookable(provider)) {
      return unavailableProviderResponse(res, provider);
    }

    const normalizedStatus = normalizeTrackingStatus(status);
    const update = { status: normalizedStatus };
    const booking = await Booking.findOne({ _id: req.params.bookingId, assignedProvider: provider._id });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found for this provider." });
    }

    const currentStatus = normalizeTrackingStatus(booking.status);
    const isPaymentComplete = booking.paymentStatus === "paid" || booking.clientPaymentStatus === "paid";
    const allowedPreviousStatuses = {
      "Provider Assigned": ["Confirmed"],
      "On The Way": ["Provider Assigned"],
      Arrived: ["On The Way"],
      "Service Started": ["Arrived"],
      Completed: ["Service Started"],
    };

    if (
      allowedPreviousStatuses[normalizedStatus] &&
      !allowedPreviousStatuses[normalizedStatus].includes(currentStatus)
    ) {
      return res.status(400).json({ message: `Cannot change booking from ${currentStatus} to ${normalizedStatus}. Follow the provider workflow steps.` });
    }

    if (normalizedStatus === "Service Started") {
      if (booking.estimateStatus !== "accepted" || !isPaymentComplete) {
        return res.status(400).json({ message: "Submit estimate and wait for client payment before starting work." });
      }
    }

    if (normalizedStatus === "Completed") {
      if (workImage) {
        booking.workImage = workImage;
      }
      booking.completedAt = new Date();
      booking.providerSharePercent = DEFAULT_PROVIDER_SHARE_PERCENT;
      booking.adminPayoutStatus = "pending";
    } else if (normalizedStatus === "Cancelled") {
      if (!cancellationReason.trim()) {
        return res.status(400).json({ message: "Please describe why this booking is being cancelled." });
      }
      booking.cancelledBy = "provider";
      booking.cancelledAt = new Date();
      booking.cancellationReason = cancellationReason.trim();
      booking.adminPayoutStatus = "not_ready";
    }

    booking.status = update.status;
    ensureTrackingHistory(booking);
    if (normalizeTrackingStatus(booking.trackingHistory.at(-1)?.status) !== normalizedStatus) {
      booking.trackingHistory.push(buildTrackingEvent(normalizedStatus, { updatedBy: "provider" }));
      await booking.save();
    }

    if (normalizedStatus === "Completed") {
      const client = await User.findById(booking.user);
      await sendServiceCompletedEmail({
        to: client?.email,
        name: client?.name || booking.name,
        booking,
        providerName: provider.name,
      });
    }

    res.json({ booking });
  } catch (error) {
    res.status(500).json({ message: "Booking status could not be updated." });
  }
});

router.patch("/bookings/:bookingId/location", requireAuth, requireProvider, async (req, res) => {
  try {
    const provider = await Provider.findOne({ owner: req.user._id });

    if (!provider) {
      return res.status(404).json({ message: "Provider profile not found." });
    }

    const booking = await Booking.findOne({ _id: req.params.bookingId, assignedProvider: provider._id });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found for this provider." });
    }

    provider.currentLocation = normalizeLocationPayload(req.body);
    provider.trackingConsent = true;
    provider.trackingActive = true;
    await provider.save();

    res.json({ message: "Provider location updated.", provider, booking });
  } catch (error) {
    res.status(500).json({ message: "Provider location could not be updated." });
  }
});

router.get("/bookings/:bookingId/tracking", requireAuth, requireProvider, async (req, res) => {
  try {
    const provider = await Provider.findOne({ owner: req.user._id });

    if (!provider) {
      return res.status(404).json({ message: "Provider profile not found." });
    }

    const booking = await Booking.findOne({ _id: req.params.bookingId, assignedProvider: provider._id });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found for this provider." });
    }

    ensureTrackingHistory(booking);
    await booking.save();

    res.json({
      booking,
      tracking: {
        bookingId: booking._id,
        serviceName: booking.service,
        providerName: provider.name,
        currentStatus: normalizeTrackingStatus(booking.status),
        trackingHistory: booking.trackingHistory,
        providerLocation: provider.currentLocation || null,
        clientLocation: booking.addressLocation || null,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Provider booking tracking could not be loaded." });
  }
});

export default router;
