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
import { emitStatusChange } from "../socket/trackingSocket.js";
import { bookingLookup, buildPointLocation, publicLocation } from "../utils/location.js";
import { invalidateCatalogCache } from "./catalogRoutes.js";

const router = express.Router();
const providerIdentityCache = new Map();
const providerDashboardProfileCache = new Map();
const providerIdentityCacheTtlMs = Number(process.env.PROVIDER_IDENTITY_CACHE_TTL_MS || 60_000);

const rememberProviderIdentity = (provider) => {
  if (!provider?.owner || !provider?._id) return;
  providerIdentityCache.set(String(provider.owner), {
    provider: {
      _id: provider._id,
      owner: provider.owner,
      name: provider.name,
      category: provider.category,
    },
    expiresAt: Date.now() + providerIdentityCacheTtlMs,
  });
};

const getProviderIdentity = async (ownerId) => {
  const cacheKey = String(ownerId);
  const cached = providerIdentityCache.get(cacheKey);
  if (cached?.expiresAt > Date.now()) return cached.provider;
  if (cached) providerIdentityCache.delete(cacheKey);

  const provider = await Provider.findOne({ owner: ownerId })
    .select("_id owner name category")
    .lean();
  rememberProviderIdentity(provider);
  return provider;
};

const forgetProviderCaches = (ownerId) => {
  const cacheKey = String(ownerId);
  providerIdentityCache.delete(cacheKey);
  providerDashboardProfileCache.delete(cacheKey);
};

const notifyClientInBackground = ({ booking, providerName, action }) => {
  void User.findById(booking.user)
    .select("name email phone")
    .lean()
    .then(async (client) => {
      if (action === "completed") {
        await sendServiceCompletedEmail({
          to: client?.email,
          name: client?.name || booking.name,
          booking,
          providerName,
        });
        await sendServiceCompletedWhatsApp({
          to: client?.phone || booking.phone,
          name: client?.name || booking.name,
          booking,
          providerName,
        });
      } else if (action === "cancelled") {
        await sendProviderCancellationEmail({
          to: client?.email,
          booking,
          reason: booking.cancellationReason,
        });
        await sendCancellationWhatsApp({
          to: client?.phone || booking.phone,
          booking,
          reason: booking.cancellationReason,
          cancelledBy: "provider",
        });
      } else if (action === "accepted") {
        await sendProviderAcceptedEmail({
          to: client?.email,
          name: client?.name || booking.name,
          booking,
          provider: { name: providerName },
        });
        await sendBookingAcceptedWhatsApp({
          to: client?.phone || booking.phone,
          name: client?.name || booking.name,
          booking,
          provider: { name: providerName },
        });
      }
    })
    .catch((error) => console.warn(`Provider notification failed: ${error.message}`));
};

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
    const cacheKey = String(req.user._id);
    const cachedProfile = providerDashboardProfileCache.get(cacheKey);
    let provider = cachedProfile?.expiresAt > Date.now() ? cachedProfile.provider : null;
    if (!provider) {
      if (cachedProfile) providerDashboardProfileCache.delete(cacheKey);
      provider = await Provider.findOne({ owner: req.user._id })
        .select("-aadhaarFrontUrl -aadhaarBackUrl")
        .lean();
      if (provider) {
        providerDashboardProfileCache.set(cacheKey, {
          provider,
          expiresAt: Date.now() + providerIdentityCacheTtlMs,
        });
      }
    }

    if (!provider) {
      return res.status(404).json({ message: "Provider profile not found." });
    }

    rememberProviderIdentity(provider);

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
      }).select("-workImage").sort({ createdAt: -1 }).lean(),
      provider.isActive
        ? Booking.find(buildAvailableBookingFilter(provider)).select("-workImage").sort({ createdAt: -1 }).lean()
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
    const provider = await Provider.findOne({ owner: req.user._id })
      .select("-aadhaarFrontUrl -aadhaarBackUrl")
      .lean();

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
    forgetProviderCaches(req.user._id);
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
    forgetProviderCaches(req.user._id);
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
    const provider = await Provider.findOne({ owner: req.user._id })
      .select("_id owner name category approvalStatus isActive")
      .lean();

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
    emitStatusChange(req.app.get("io"), booking);
    res.json({ booking });
    notifyClientInBackground({ booking: booking.toObject(), providerName: provider.name, action: "accepted" });
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
    const provider = await getProviderIdentity(req.user._id);

    if (!provider) {
      return res.status(404).json({ message: "Provider profile not found." });
    }

    const booking = await Booking.findOne({
      ...bookingLookup(req.params.bookingId),
      assignedProvider: provider._id,
    })
      .select("bookingId status eta name phone clientLocation providerLocation address trackingEvents updatedAt")
      .lean();

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
    const provider = await getProviderIdentity(req.user._id);

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
    ).select("-workImage").lean();

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

    const provider = await getProviderIdentity(req.user._id);

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

    const normalizedStatus = status === "confirmed" || status === "assigned"
      ? "accepted"
      : status === "on_the_way" ? "en_route" : status;
    const allowedCurrentStatuses = {
      accepted: ["pending", "accepted", "confirmed", "assigned"],
      en_route: ["pending", "accepted", "confirmed", "assigned", "on_the_way", "en_route"],
      arrived: ["pending", "accepted", "confirmed", "assigned", "on_the_way", "en_route", "arrived"],
      job_started: ["arrived", "job_started"],
      completed: ["job_started", "completed"],
      cancelled: ["pending", "accepted", "confirmed", "assigned", "on_the_way", "en_route", "arrived", "job_started", "cancelled"],
    };
    const bookingFilter = {
      ...bookingLookup(req.params.bookingId),
      assignedProvider: provider._id,
      status: { $in: allowedCurrentStatuses[normalizedStatus] || [] },
    };
    if (normalizedStatus === "job_started") {
      bookingFilter.$or = [
        { finalEstimateAmount: { $gt: 0 } },
        { estimateStatus: { $in: ["submitted", "accepted"] } },
      ];
    }
    if (normalizedStatus === "completed") bookingFilter.paymentStatus = "paid";

    const updateOperation = {
      $set: { ...update, status: normalizedStatus },
      $push: { trackingEvents: { status: normalizedStatus, updatedAt: new Date() } },
    };

    const booking = await Booking.findOneAndUpdate(
      bookingFilter,
      updateOperation,
      { new: true }
    ).lean();

    if (!booking) {
      const existingBooking = await Booking.findOne({
        ...bookingLookup(req.params.bookingId),
        assignedProvider: provider._id,
      }).select("status finalEstimateAmount estimateStatus paymentStatus").lean();
      if (!existingBooking) return res.status(404).json({ message: "Booking not found for this provider." });
      if (normalizedStatus === "job_started" && existingBooking.status !== "arrived") {
        return res.status(400).json({ message: "Mark arrived before starting the job." });
      }
      if (normalizedStatus === "job_started") {
        return res.status(400).json({ message: "Send the final estimate before starting the job." });
      }
      if (normalizedStatus === "completed" && existingBooking.status !== "job_started") {
        return res.status(400).json({ message: "Start the job before marking the work completed." });
      }
      if (normalizedStatus === "completed") {
        return res.status(400).json({ message: "Before completing the work, the client must pay the money." });
      }
      return res.status(400).json({ message: "Booking status cannot move backward." });
    }

    emitStatusChange(req.app.get("io"), booking);
    res.json({ booking });
    if (["completed", "cancelled"].includes(normalizedStatus)) {
      notifyClientInBackground({ booking, providerName: provider.name, action: normalizedStatus });
    }
  } catch (error) {
    if (/booking status|completed bookings|cannot move/i.test(error.message)) {
      return res.status(400).json({ message: error.message });
    }

    res.status(500).json({ message: "Booking status could not be updated." });
  }
});

export default router;
