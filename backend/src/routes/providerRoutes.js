import express from "express";

import requireAuth from "../middleware/requireAuth.js";
import Booking from "../models/Booking.js";
import Provider from "../models/Provider.js";
import User from "../models/User.js";
import {
  sendProviderAcceptedEmail,
  sendServiceCompletedEmail,
} from "../services/mailService.js";
import { buildServiceRegexes } from "../utils/serviceMatching.js";
import { buildProviderPaymentSummary, DEFAULT_PROVIDER_SHARE_PERCENT } from "../utils/paymentSummary.js";

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
      ? "Provider profile was not approved by admin."
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
  status: { $in: ["pending", "accepted"] },
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
      features = "",
    } = req.body;

    if (!name || !category || !location || !phone || !email || !price || !responseTime || !description) {
      return res.status(400).json({ message: "Please fill all required provider profile fields." });
    }

    const provider = await Provider.findOne({ owner: req.user._id });

    if (!provider) {
      return res.status(404).json({ message: "Provider profile not found." });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail, _id: { $ne: req.user._id } });

    if (existingUser) {
      return res.status(409).json({ message: "This email is already used by another account." });
    }

    provider.name = name.trim();
    provider.category = category.trim();
    provider.location = location.trim();
    provider.phone = phone.trim();
    provider.email = normalizedEmail;
    provider.price = price.trim();
    provider.responseTime = responseTime.trim();
    provider.description = description.trim();
    provider.about = about?.trim() || description.trim();
    provider.image = typeof image === "string" ? image : "";
    if (availabilityStatus && availabilityStatuses.includes(availabilityStatus)) {
      provider.availabilityStatus = availabilityStatus;
      provider.isActive = availabilityStatus !== "inactive";
    }

    provider.features = Array.isArray(features)
      ? features.map((feature) => String(feature).trim()).filter(Boolean)
      : String(features).split(",").map((feature) => feature.trim()).filter(Boolean);

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

    const booking = await Booking.findOneAndUpdate(
      {
        _id: req.params.bookingId,
        ...buildAvailableBookingFilter(provider),
      },
      {
        assignedProvider: provider._id,
        assignedProviderName: provider.name,
        status: "confirmed",
        acceptedAt: new Date(),
        assignedAt: new Date(),
      },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ message: "Booking request is no longer available." });
    }
    const client = await User.findById(booking.user);
    await sendProviderAcceptedEmail({
      to: client?.email,
      name: client?.name || booking.name,
      booking,
      provider,
    });

    res.json({ booking });
  } catch (error) {
    res.status(500).json({ message: "Booking request could not be accepted." });
  }
});

router.patch("/bookings/:bookingId/status", requireAuth, requireProvider, async (req, res) => {
  try {
    const { status, workImage = "", cancellationReason = "" } = req.body;
    const allowedStatuses = ["confirmed", "completed", "cancelled"];

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

    const update = { status };

    if (status === "completed") {
      if (workImage) {
        update.workImage = workImage;
      }
      update.completedAt = new Date();
      update.providerSharePercent = DEFAULT_PROVIDER_SHARE_PERCENT;
      update.adminPayoutStatus = "pending";
    } else if (status === "cancelled") {
      if (!cancellationReason.trim()) {
        return res.status(400).json({ message: "Please describe why this booking is being cancelled." });
      }
      update.cancelledBy = "provider";
      update.cancelledAt = new Date();
      update.cancellationReason = cancellationReason.trim();
      update.adminPayoutStatus = "not_ready";
    }

    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.bookingId, assignedProvider: provider._id },
      update,
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ message: "Booking not found for this provider." });
    }

    if (status === "completed") {
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

export default router;
