import express from "express";

import requireAuth from "../middleware/requireAuth.js";
import Booking from "../models/Booking.js";
import Provider from "../models/Provider.js";
import User from "../models/User.js";
import {
  sendProviderCancellationEmail,
  sendProviderAcceptedEmail,
  sendServiceCompletedEmail,
  sendProviderRequestRejectedEmail,
} from "../services/mailService.js";
import {
  sendBookingAcceptedWhatsApp,
  sendCancellationWhatsApp,
  sendServiceCompletedWhatsApp,
  sendProviderRequestRejectedWhatsApp,
} from "../services/whatsappNotificationService.js";
import { buildStatusUpdateOperation } from "../services/bookingTrackingService.js";
import { emitStatusChange } from "../socket/trackingSocket.js";
import { bookingLookup, buildPointLocation, publicLocation } from "../utils/location.js";
import { invalidateCatalogCache } from "./catalogRoutes.js";

const router = express.Router();

const requireProvider = (req, res, next) => {
  if (req.user.role !== "provider") {
    return res.status(403).json({ message: "Provider access required." });
  }

  next();
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildAvailableBookingFilter = (provider) => ({
  $or: [{ assignedProvider: null }, { assignedProvider: { $exists: false } }],
  $and: [
    {
      $or: [
        { requestedProvider: provider._id },
        {
          $or: [{ requestedProvider: null }, { requestedProvider: { $exists: false } }],
          service: new RegExp(`^${escapeRegex(provider.category.trim())}$`, "i"),
        },
      ],
    },
  ],
  status: { $in: ["pending", "accepted"] },
  rejectedByProviders: { $ne: provider._id },
  ...(provider.owner ? { user: { $ne: provider.owner } } : {}),
});

const hideClientContactUntilAccepted = (booking) => {
  const safeBooking = booking.toObject ? booking.toObject() : { ...booking };
  return {
    ...safeBooking,
    name: "Client details hidden",
    phone: "",
    contactLocked: true,
    contactLockedMessage: "Client name and phone number will be visible after you accept this request.",
  };
};

router.get("/dashboard", requireAuth, requireProvider, async (req, res) => {
  try {
    const provider = await Provider.findOne({ owner: req.user._id });

    if (!provider) {
      return res.status(404).json({ message: "Provider profile not found." });
    }

    if (provider.approvalStatus !== "approved") {
      return res.json({
        provider,
        bookings: [],
        availableRequests: [],
        dashboardLocked: true,
        message:
          provider.approvalStatus === "rejected"
            ? "Provider profile was not approved by admin."
            : "Provider profile is waiting for admin approval.",
      });
    }

    const [bookings, availableRequests] = await Promise.all([
      Booking.find({
        $or: [
          { assignedProvider: provider._id },
          { requestedProvider: provider._id, status: { $in: ["cancelled", "rejected"] } },
        ],
      }).sort({ createdAt: -1 }),
      provider.isActive
        ? Booking.find(buildAvailableBookingFilter(provider)).sort({ createdAt: -1 })
        : Promise.resolve([]),
    ]);

    res.json({
      provider,
      bookings,
      availableRequests: availableRequests.map(hideClientContactUntilAccepted),
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

router.get("/availability", requireAuth, requireProvider, async (req, res) => {
  try {
    const provider = await Provider.findOne({ owner: req.user._id });

    if (!provider) {
      return res.status(404).json({ message: "Provider profile not found." });
    }

    res.json({ isActive: provider.isActive, approvalStatus: provider.approvalStatus });
  } catch (error) {
    res.status(500).json({ message: "Provider status could not be loaded." });
  }
});

router.patch("/availability", requireAuth, requireProvider, async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({ message: "Availability status must be a boolean." });
    }

    const provider = await Provider.findOne({ owner: req.user._id });

    if (!provider) {
      return res.status(404).json({ message: "Provider profile not found." });
    }

    if (provider.approvalStatus !== "approved") {
      return res.status(403).json({ message: "Availability status can only be updated for approved profiles." });
    }

    provider.isActive = isActive;
    await provider.save();
    invalidateCatalogCache();

    res.json({
      message: `Availability status updated to ${isActive ? "Active" : "Inactive"}.`,
      provider,
    });
  } catch (error) {
    res.status(500).json({ message: "Provider status could not be updated." });
  }
});

router.patch("/profile", requireAuth, requireProvider, async (req, res) => {
  try {
    const {
      name,
      category,
      customCategory = "",
      location,
      phone,
      email,
      price,
      responseTime,
      description,
      about,
      features = "",
      bankDetails = {},
    } = req.body;

    const normalizedCategory = String(category || "").trim();
    const normalizedCustomCategory = String(customCategory || "").trim();
    const providerCategory = normalizedCategory === "Other" ? normalizedCustomCategory : normalizedCategory;

    if (!name || !providerCategory || !location || !phone || !email || !price || !description) {
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
    provider.category = providerCategory;
    provider.customCategory = normalizedCategory === "Other" ? providerCategory : "";
    provider.location = location.trim();
    provider.phone = phone.trim();
    provider.email = normalizedEmail;
    provider.price = price.trim();
    provider.responseTime = responseTime?.trim() || provider.responseTime || "";
    provider.description = description.trim();
    provider.about = about?.trim() || description.trim();
    provider.features = Array.isArray(features)
      ? features.map((feature) => String(feature).trim()).filter(Boolean)
      : String(features).split(",").map((feature) => feature.trim()).filter(Boolean);

    provider.bankDetails = {
      accountHolder: String(bankDetails.accountHolder || provider.bankDetails?.accountHolder || "").trim(),
      bankName: String(bankDetails.bankName || provider.bankDetails?.bankName || "").trim(),
      accountNumber: String(bankDetails.accountNumber || provider.bankDetails?.accountNumber || "").replace(/\s+/g, ""),
      ifscCode: String(bankDetails.ifscCode || provider.bankDetails?.ifscCode || "").trim().toUpperCase(),
    };

    await provider.save();
    invalidateCatalogCache();

    await User.findByIdAndUpdate(req.user._id, {
      name: provider.name,
      email: normalizedEmail,
      phone: provider.phone,
    });

    res.json({ message: "Provider profile updated successfully.", provider });
  } catch (error) {
    res.status(500).json({ message: "Provider profile could not be updated." });
  }
});

router.patch("/bookings/:bookingId/accept", requireAuth, requireProvider, async (req, res) => {
  try {
    const provider = await Provider.findOne({ owner: req.user._id });

    if (!provider) {
      return res.status(404).json({ message: "Provider profile not found." });
    }

    if (provider.approvalStatus !== "approved") {
      return res.status(403).json({ message: "Provider profile is waiting for admin approval." });
    }

    if (!provider.isActive) {
      return res.status(400).json({ message: "Provider must be active to accept booking requests." });
    }

    const booking = await Booking.findOneAndUpdate(
      {
        _id: req.params.bookingId,
        ...buildAvailableBookingFilter(provider),
      },
      {
        assignedProvider: provider._id,
        assignedProviderName: provider.name,
        status: "accepted",
        acceptedAt: new Date(),
        assignedAt: new Date(),
        trackingEvents: [{ status: "accepted", updatedAt: new Date() }],
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
    sendBookingAcceptedWhatsApp({
      to: client?.phone || booking.phone,
      name: client?.name || booking.name,
      booking,
      provider,
    }).catch(() => {});

    emitStatusChange(req.app.get("io"), booking);

    res.json({ booking });
  } catch (error) {
    res.status(500).json({ message: "Booking request could not be accepted." });
  }
});

router.patch("/bookings/:bookingId/reject", requireAuth, requireProvider, async (req, res) => {
  try {
    const { reason = "" } = req.body || {};

    const provider = await Provider.findOne({ owner: req.user._id });

    if (!provider) {
      return res.status(404).json({ message: "Provider profile not found." });
    }

    if (provider.approvalStatus !== "approved") {
      return res.status(403).json({ message: "Provider profile is waiting for admin approval." });
    }

    const existingBooking = await Booking.findOne({
      _id: req.params.bookingId,
      ...buildAvailableBookingFilter(provider),
    });

    if (!existingBooking) {
      return res.status(404).json({ message: "Booking request is no longer available." });
    }

    const isDirectRequest = String(existingBooking.requestedProvider || "") === String(provider._id);

    let booking;

    if (isDirectRequest) {
      // Client requested this specific provider. Since no one else can take it,
      // the booking itself is marked rejected so the client is notified clearly.
      booking = await Booking.findOneAndUpdate(
        {
          _id: req.params.bookingId,
          requestedProvider: provider._id,
          assignedProvider: null,
        },
        {
          status: "rejected",
          rejectedAt: new Date(),
          rejectionReason: reason.trim(),
          $addToSet: { rejectedByProviders: provider._id },
        },
        { new: true }
      );
    } else {
      // General request visible to multiple providers in this category.
      // Only hide it from this provider; other providers should still see it.
      booking = await Booking.findOneAndUpdate(
        {
          _id: req.params.bookingId,
          assignedProvider: null,
        },
        {
          $addToSet: { rejectedByProviders: provider._id },
        },
        { new: true }
      );
    }

    if (!booking) {
      return res.status(404).json({ message: "Booking request is no longer available." });
    }

    if (isDirectRequest) {
      const client = await User.findById(booking.user);
      sendProviderRequestRejectedEmail({
        to: client?.email,
        booking,
        reason: booking.rejectionReason,
      }).catch((error) => console.warn(`Reject email failed: ${error.message}`));
      sendProviderRequestRejectedWhatsApp({
        to: client?.phone || booking.phone,
        name: client?.name || booking.name,
        booking,
        providerName: provider.name,
        reason: booking.rejectionReason,
      }).catch(() => {});

      emitStatusChange(req.app.get("io"), booking);
    }

    res.json({ message: "Booking request rejected.", booking });
  } catch (error) {
    res.status(500).json({ message: "Booking request could not be rejected." });
  }
});


router.get("/bookings/:bookingId/tracking", requireAuth, requireProvider, async (req, res) => {
  try {
    const provider = await Provider.findOne({ owner: req.user._id });

    if (!provider) {
      return res.status(404).json({ message: "Provider profile not found." });
    }

    const booking = await Booking.findOne({
      ...bookingLookup(req.params.bookingId),
      assignedProvider: provider._id,
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found for this provider." });
    }

    res.json({
      bookingId: booking.bookingId || booking._id,
      databaseId: booking._id,
      status: booking.status,
      eta: booking.eta ?? null,
      clientName: booking.name,
      clientPhone: booking.phone,
      clientLocation: publicLocation(booking.clientLocation),
      providerLocation: publicLocation(booking.providerLocation),
      address: booking.address,
      trackingEvents: booking.trackingEvents || [],
      updatedAt: booking.updatedAt,
    });
  } catch (error) {
    res.status(500).json({ message: "Provider tracking details could not be loaded." });
  }
});
router.patch("/bookings/:bookingId/location", requireAuth, requireProvider, async (req, res) => {
  try {
    const provider = await Provider.findOne({ owner: req.user._id });

    if (!provider) {
      return res.status(404).json({ message: "Provider profile not found." });
    }

    const providerLocation = buildPointLocation(req.body || {}, "updatedAt");

    if (!providerLocation) {
      return res.status(400).json({ message: "Valid provider latitude and longitude are required." });
    }

    const booking = await Booking.findOneAndUpdate(
      {
        ...bookingLookup(req.params.bookingId),
        assignedProvider: provider._id,
        status: { $nin: ["completed", "cancelled"] },
      },
      { providerLocation },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ message: "Active booking not found for this provider." });
    }

    req.app.get("io")?.to(booking.bookingId || String(booking._id)).emit("location:update", {
      bookingId: booking.bookingId || String(booking._id),
      lat: providerLocation.latitude,
      lng: providerLocation.longitude,
      heading: null,
      speed: null,
      eta: booking.eta ?? null,
      providerLocation: publicLocation(providerLocation),
      timestamp: providerLocation.updatedAt,
    });

    res.json({ message: "Provider location updated.", booking });
  } catch (error) {
    res.status(500).json({ message: "Provider location could not be updated." });
  }
});
router.patch("/bookings/:bookingId/status", requireAuth, requireProvider, async (req, res) => {
  try {
    const { status, workImage = "", cancellationReason = "" } = req.body;
    const allowedStatuses = ["accepted", "confirmed", "assigned", "on_the_way", "en_route", "arrived", "job_started", "completed", "cancelled"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid booking status." });
    }

    const provider = await Provider.findOne({ owner: req.user._id });

    if (!provider) {
      return res.status(404).json({ message: "Provider profile not found." });
    }

    const update = {};

    if (status === "completed") {
      if (workImage) {
        update.workImage = workImage;
      }
      update.completedAt = new Date();
    } else if (status === "cancelled") {
      if (!cancellationReason.trim()) {
        return res.status(400).json({ message: "Please describe why this booking is being cancelled." });
      }
      update.cancelledBy = "provider";
      update.cancelledAt = new Date();
      update.cancellationReason = cancellationReason.trim();
    }

    const existingBooking = await Booking.findOne({
      ...bookingLookup(req.params.bookingId),
      assignedProvider: provider._id,
    });

    if (!existingBooking) {
      return res.status(404).json({ message: "Booking not found for this provider." });
    }

    if (status === "job_started") {
      if (existingBooking.status !== "arrived") {
        return res.status(400).json({ message: "Mark arrived before starting the job." });
      }

      if (!existingBooking.finalEstimateAmount && !["submitted", "accepted"].includes(existingBooking.estimateStatus)) {
        return res.status(400).json({ message: "Send the final estimate before starting the job." });
      }
    }

    if (status === "completed") {
      if (existingBooking.status !== "job_started") {
        return res.status(400).json({ message: "Start the job before marking the work completed." });
      }

      if (existingBooking.paymentStatus !== "paid") {
        return res.status(400).json({ message: "Before completing the work, the client must pay the money." });
      }
    }

    const updateOperation = buildStatusUpdateOperation({
      booking: existingBooking,
      status,
      set: update,
    });

    const booking = await Booking.findOneAndUpdate(
      { ...bookingLookup(req.params.bookingId), assignedProvider: provider._id },
      updateOperation,
      { new: true }
    );

    if (status === "completed") {
      const client = await User.findById(booking.user);
      await sendServiceCompletedEmail({
        to: client?.email,
        name: client?.name || booking.name,
        booking,
        providerName: provider.name,
      });
      sendServiceCompletedWhatsApp({
        to: client?.phone || booking.phone,
        name: client?.name || booking.name,
        booking,
        providerName: provider.name,
      }).catch(() => {});
    } else if (status === "cancelled") {
      const client = await User.findById(booking.user);
      await sendProviderCancellationEmail({
        to: client?.email,
        booking,
        reason: booking.cancellationReason,
      });
      sendCancellationWhatsApp({
        to: client?.phone || booking.phone,
        booking,
        reason: booking.cancellationReason,
        cancelledBy: "provider",
      }).catch(() => {});
    }

    emitStatusChange(req.app.get("io"), booking);

    res.json({ booking });
  } catch (error) {
    if (/booking status|completed bookings|cannot move/i.test(error.message)) {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Booking status could not be updated." });
  }
});

export default router;
