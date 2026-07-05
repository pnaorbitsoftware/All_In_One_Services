import express from "express";

import requireAuth from "../middleware/requireAuth.js";
import Booking from "../models/Booking.js";
import Provider from "../models/Provider.js";
import {
  sendBookingEmail,
  sendProviderRequestEmail,
} from "../services/mailService.js";
import { buildServiceRegexes, isAllowedServiceName, normalizeServiceName } from "../utils/serviceMatching.js";
import { allowedTrackingStatuses, buildTrackingEvent, ensureTrackingHistory, normalizeTrackingStatus } from "../utils/tracking.js";
import { applyPaymentSplit } from "../utils/paymentSummary.js";

const router = express.Router();

const durationCostMap = {
  "30 minutes": 199,
  "1 hour": 299,
  "2 hours": 549,
  "3 hours": 799,
  "Half day": 1499,
  "Full day": 2499,
  "Based on Work Time": 0,
};

const clientCancelWindowMs = 10 * 60 * 1000;

const bookableAvailabilityStatuses = ["active", "available"];

const isProviderBookable = (provider) =>
  Boolean(
    provider &&
      provider.isActive &&
      provider.approvalStatus === "approved" &&
      bookableAvailabilityStatuses.includes(provider.availabilityStatus || "available")
  );

const parseBookingDate = (value) => {
  if (typeof value !== "string") return new Date(value);

  const ddMmYyyy = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (ddMmYyyy) {
    const [, day, month, year] = ddMmYyyy;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  return new Date(value);
};

const startOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};


async function getProviderForUser(userId) {
  return Provider.findOne({ owner: userId });
}

function objectIdString(value) {
  return String(value?._id || value || "");
}

async function canViewBookingTracking(req, booking) {
  if (!booking) return false;
  if (req.user.role === "admin") return true;
  if (String(booking.user) === String(req.user._id)) return true;

  if (req.user.role === "provider") {
    const provider = await getProviderForUser(req.user._id);
    return Boolean(
      provider &&
        (objectIdString(booking.assignedProvider) === String(provider._id) ||
          objectIdString(booking.requestedProvider) === String(provider._id))
    );
  }

  return false;
}

async function getTrackingUpdateActor(req, booking) {
  if (req.user.role === "admin") return { allowed: true, updatedBy: "admin", provider: null };
  if (req.user.role !== "provider") return { allowed: false, updatedBy: "client", provider: null };

  const provider = await getProviderForUser(req.user._id);
  const ownsBooking = provider && objectIdString(booking.assignedProvider) === String(provider._id);
  return { allowed: Boolean(ownsBooking), updatedBy: "provider", provider };
}

function buildTrackingResponse(booking) {
  const provider = booking.assignedProvider || booking.requestedProvider || null;
  return {
    bookingId: booking._id,
    serviceName: booking.service,
    providerName: booking.assignedProviderName || booking.requestedProviderName || provider?.name || "Provider not assigned",
    bookingDate: booking.preferredDate,
    bookingTime: booking.preferredTime,
    currentStatus: normalizeTrackingStatus(booking.status),
    trackingHistory: ensureTrackingHistory(booking),
    clientLocation: booking.addressLocation || null,
    clientAddress: booking.address || "",
    providerLocation: provider?.currentLocation || null,
    providerAddress: provider?.currentLocation?.address || provider?.location || "",
  };
}
const canClientCancelBooking = (booking) => {
  const normalizedStatus = normalizeTrackingStatus(booking.status).toLowerCase();
  if (["completed", "cancelled"].includes(normalizedStatus)) return false;
  if (!booking.acceptedAt) return true;

  return Date.now() - new Date(booking.acceptedAt).getTime() <= clientCancelWindowMs;
};

router.post("/", requireAuth, async (req, res) => {
  console.log("=== POST /api/bookings req.body ===");
  console.log(JSON.stringify(req.body, null, 2));

  const debugService = req.body?.service || "";
  const debugProviderId = req.body?.providerId || "";
  const debugNormalized = normalizeServiceName(debugService);
  const debugAllowed = isAllowedServiceName(debugNormalized);

  console.log(`providerId: "${debugProviderId}"`);
  console.log(`service: "${debugService}"`);
  console.log(`normalizedService: "${debugNormalized}"`);
  console.log(`isAllowedServiceName(normalizedService): ${debugAllowed}`);
  console.log("=====================================");

  try {
    if (req.user.role !== "user" || !req.user.profileComplete) {
      return res.status(403).json({ message: "Complete your client profile before booking a service.", profileIncomplete: true });
    }

    const { name, phone, service, address, addressLocation = null, problemDescription, date, time, duration, providerId = "" } = req.body;

    if (!name || !phone || !service || !address || !problemDescription || !date || !time || !duration) {
      return res.status(400).json({ message: "All booking fields are required." });
    }

    const preferredDate = parseBookingDate(date);
    if (Number.isNaN(preferredDate.getTime())) {
      return res.status(400).json({ message: "Please select a valid booking date." });
    }

    if (preferredDate < startOfToday()) {
      return res.status(400).json({ message: "Booking date cannot be before today." });
    }

    const selectedProvider = providerId
      ? await Provider.findOne({
          _id: providerId,
          isActive: true,
          approvalStatus: "approved",
        })
      : null;
    const normalizedService = normalizeServiceName(selectedProvider?.category || service);

    if (!isAllowedServiceName(normalizedService)) {
      return res.status(400).json({ message: "Please select a valid ServiceHub service." });
    }
    const requestedProvider = selectedProvider?.owner ? selectedProvider : null;

    if (providerId && !selectedProvider) {
      return res.status(400).json({ message: "Selected provider is not available." });
    }

    const booking = await Booking.create({
      user: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      name,
      phone,
      service: selectedProvider?.category || normalizedService,
      address,
      addressLocation: addressLocation && typeof addressLocation === "object" ? addressLocation : {},
      problemDescription,
      preferredDate,
      preferredTime: time,
      serviceDuration: duration,
      costEstimate: durationCostMap[duration] || 299,
      requestedProvider: requestedProvider?._id || null,
      requestedProviderName: requestedProvider?.name || "",
      status: "Confirmed",
      trackingHistory: [buildTrackingEvent("Confirmed")],
    });

    const matchingProviders = requestedProvider
      ? [requestedProvider]
      : await Provider.find({
          owner: { $ne: null },
          isActive: true,
          approvalStatus: "approved",
          category: { $in: buildServiceRegexes(normalizedService) },
          email: { $ne: "" },
        });

    await sendBookingEmail({
      to: req.user.email,
      name: req.user.name,
      booking,
      provider: selectedProvider,
    });

    await Promise.allSettled(
      matchingProviders
        .filter((provider) => provider.email)
        .map((provider) =>
          sendProviderRequestEmail({
            to: provider.email,
            providerName: provider.name,
            booking,
          })
        )
    );

    res.status(201).json({
      message: "Booking saved successfully.",
      booking,
    });
  } catch (error) {
    res.status(500).json({ message: "Booking failed. Please try again." });
  }
});

router.get("/my", requireAuth, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("assignedProvider", "name category location phone price responseTime rating reviews isActive availabilityStatus approvalStatus currentLocation")
      .populate("requestedProvider", "name category location phone price responseTime rating reviews isActive availabilityStatus approvalStatus currentLocation")
      .sort({ createdAt: -1 });
    res.json({ bookings });
  } catch (error) {
    res.status(500).json({ message: "Could not load bookings." });
  }
});


router.get("/:bookingId/tracking", requireAuth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate("assignedProvider", "name category location phone currentLocation")
      .populate("requestedProvider", "name category location phone currentLocation");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    if (!(await canViewBookingTracking(req, booking))) {
      return res.status(403).json({ message: "You cannot view tracking for this booking." });
    }

    ensureTrackingHistory(booking);
    await booking.save();

    res.json(buildTrackingResponse(booking));
  } catch (error) {
    res.status(500).json({ message: "Tracking could not be loaded." });
  }
});

router.patch("/:bookingId/tracking", requireAuth, async (req, res) => {
  try {
    const { status, description = "" } = req.body;
    const normalizedStatus = normalizeTrackingStatus(status);

    if (!allowedTrackingStatuses.includes(normalizedStatus)) {
      return res.status(400).json({ message: "Invalid tracking status." });
    }

    const booking = await Booking.findById(req.params.bookingId);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    const actor = await getTrackingUpdateActor(req, booking);
    if (!actor.allowed) {
      return res.status(403).json({ message: "Only the assigned provider or admin can update tracking." });
    }

    ensureTrackingHistory(booking);
    const alreadyLatest = normalizeTrackingStatus(booking.trackingHistory.at(-1)?.status) === normalizedStatus;
    booking.status = normalizedStatus;

    if (normalizedStatus === "Provider Assigned" && actor.provider) {
      booking.assignedProvider = actor.provider._id;
      booking.assignedProviderName = actor.provider.name;
      booking.assignedAt = booking.assignedAt || new Date();
      booking.acceptedAt = booking.acceptedAt || new Date();
    }

    if (normalizedStatus === "Completed") {
      booking.completedAt = booking.completedAt || new Date();
    }

    if (normalizedStatus === "Cancelled") {
      booking.cancelledBy = actor.updatedBy === "provider" ? "provider" : "admin";
      booking.cancelledAt = booking.cancelledAt || new Date();
    }

    if (!alreadyLatest) {
      booking.trackingHistory.push(buildTrackingEvent(normalizedStatus, { description, updatedBy: actor.updatedBy }));
    }

    await booking.save();

    res.json({ message: "Tracking updated.", booking, tracking: buildTrackingResponse(booking) });
  } catch (error) {
    res.status(500).json({ message: "Tracking could not be updated." });
  }
});

router.patch("/:bookingId/client-location", requireAuth, async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.bookingId, user: req.user._id });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    const location = req.body && typeof req.body === "object" ? req.body : {};
    booking.addressLocation = {
      latitude: Number.isFinite(Number(location.latitude)) ? Number(location.latitude) : null,
      longitude: Number.isFinite(Number(location.longitude)) ? Number(location.longitude) : null,
      address: String(location.address || booking.address || "").trim(),
      timestamp: location.timestamp ? new Date(location.timestamp) : new Date(),
    };
    booking.clientLocationUpdatedAt = new Date();
    await booking.save();

    res.json({ message: "Client location updated.", booking, tracking: buildTrackingResponse(booking) });
  } catch (error) {
    res.status(500).json({ message: "Client location could not be updated." });
  }
});

router.patch("/:bookingId/review", requireAuth, async (req, res) => {
  try {
    const rating = Number(req.body.rating);
    const review = String(req.body.review || req.body.comment || "").trim();

    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Select a rating between 1 and 5." });
    }

    const booking = await Booking.findOne({ _id: req.params.bookingId, user: req.user._id });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    if (normalizeTrackingStatus(booking.status) !== "Completed") {
      return res.status(400).json({ message: "Review is available after service completion." });
    }

    booking.clientRating = rating;
    booking.clientReview = review;
    booking.reviewedAt = new Date();
    await booking.save();

    res.json({ message: "Review saved successfully.", booking });
  } catch (error) {
    res.status(500).json({ message: "Review could not be saved." });
  }
});

router.patch("/:bookingId/cancel", requireAuth, async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.bookingId, user: req.user._id });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    if (!canClientCancelBooking(booking)) {
      return res.status(403).json({ message: "Cancellation is allowed only within 10 minutes after provider acceptance." });
    }

    booking.status = "cancelled";
    booking.cancelledBy = "client";
    booking.cancelledAt = new Date();
    booking.cancellationReason = "";
    await booking.save();

    res.json({ message: "Booking cancelled successfully.", booking });
  } catch (error) {
    res.status(500).json({ message: "Booking could not be cancelled." });
  }
});


router.patch("/:bookingId/payment-confirmation", requireAuth, async (req, res) => {
  try {
    if (process.env.NODE_ENV === "production" || process.env.ALLOW_MANUAL_PAYMENT_CONFIRMATION !== "true") {
      return res.status(403).json({ message: "Manual payment confirmation is disabled. Use the verified payment endpoint." });
    }

    const { paymentReference = "", receiptUrl = "" } = req.body;
    const booking = await Booking.findOne({ _id: req.params.bookingId, user: req.user._id });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    if (booking.estimateStatus !== "accepted") {
      return res.status(400).json({ message: "Accept the provider final estimate before payment." });
    }

    if (!paymentReference) {
      return res.status(400).json({ message: "Payment reference is required after gateway confirmation." });
    }

    booking.paymentStatus = "paid";
    booking.clientPaymentStatus = "paid";
    booking.clientPaidAt = new Date();
    booking.paymentReference = paymentReference;
    booking.receiptUrl = receiptUrl;
    booking.paymentGateway = booking.paymentGateway || "external";
    booking.adminPayoutStatus = "pending";
    applyPaymentSplit(booking);
    await booking.save();

    res.json({ message: "Payment confirmed. Amount received by admin and provider payout is pending admin release.", booking });
  } catch (error) {
    res.status(500).json({ message: "Payment confirmation could not be saved." });
  }
});
export default router;
