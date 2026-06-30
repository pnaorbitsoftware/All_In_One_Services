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
import { buildServiceRegexes, normalizeServiceName } from "../utils/serviceMatching.js";
import { buildProviderPaymentSummary, DEFAULT_PROVIDER_SHARE_PERCENT } from "../utils/paymentSummary.js";
import { buildTrackingEvent, ensureTrackingHistory, normalizeTrackingStatus } from "../utils/tracking.js";
import { sendPushNotification } from "../utils/pushNotifications.js";

const router = express.Router();
const providerIdentityCache = new Map();
const providerDashboardProfileCache = new Map();
const providerIdentityCacheTtlMs = Number(process.env.PROVIDER_IDENTITY_CACHE_TTL_MS || 60_000);
const identityDocumentPattern = /^data:(?:image\/(?:png|jpe?g|webp)|application\/pdf);base64,[a-z0-9+/=\s]+$/i;
const maxIdentityDocumentLength = 3_000_000;
const isValidIdentityDocument = (value) =>
  identityDocumentPattern.test(value) && value.length <= maxIdentityDocumentLength;

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

const isProviderApproved = (provider) => provider?.approvalStatus === "approved";
const isProviderBookable = (provider) =>
  Boolean(provider?.isActive && isProviderApproved(provider) && ["active", "available"].includes(provider.availabilityStatus || "available"));

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

const isValidAadhaarDocument = (value) => {
  if (!value) return false;
  return /^data:(image\/(png|jpe?g|webp)|application\/pdf);base64,[a-z0-9+/=\s]+$/i.test(value);
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
      image = "",
      aadhaarCardImage,
      availabilityStatus,
      features = "",
      bankDetails = {},
      aadhaarNumber,
      aadhaarFrontUrl,
      aadhaarBackUrl,
      aadhaarDocumentUrl,
      aadhaarDocumentName,
      aadhaarBackDocumentName,
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

    const submittedFront = aadhaarFrontUrl || aadhaarDocumentUrl || "";
    const submittedBack = aadhaarBackUrl || "";

    const nextAadhaarImage = typeof aadhaarCardImage === "string" && aadhaarCardImage.trim()
      ? aadhaarCardImage.trim()
      : provider.aadhaarCardImage;
    const nextAadhaarNumber = aadhaarNumber === undefined
      ? provider.aadhaarNumber
      : String(aadhaarNumber || "").replace(/\D/g, "");

    if (submittedFront && !isValidIdentityDocument(submittedFront)) {
      return res.status(400).json({ message: "Aadhaar front document must be a PNG, JPG, WEBP, or PDF smaller than 2 MB." });
    }
    if (submittedBack && !isValidIdentityDocument(submittedBack)) {
      return res.status(400).json({ message: "Aadhaar back document must be a PNG, JPG, WEBP, or PDF smaller than 2 MB." });
    }
    if (aadhaarNumber !== undefined && nextAadhaarNumber.length !== 12) {
      return res.status(400).json({ message: "Valid 12-digit Aadhaar number is required." });
    }

    if (provider.approvalStatus !== "approved") {
      const hasSingleCard = Boolean(nextAadhaarImage);
      const hasFrontBack = (submittedFront || provider.aadhaarFrontUrl) && (submittedBack || provider.aadhaarBackUrl);

      if (!hasSingleCard && !hasFrontBack) {
        return res.status(400).json({ message: "Aadhaar card image or documents are required for verification." });
      }
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
    provider.image = typeof image === "string" ? image : provider.image || "";
    provider.aadhaarCardImage = nextAadhaarImage;
    provider.aadhaarNumber = nextAadhaarNumber;

    if (submittedFront) {
      provider.aadhaarFrontUrl = submittedFront;
      provider.aadhaarFrontUploadedAt = new Date();
    }
    if (submittedBack) {
      provider.aadhaarBackUrl = submittedBack;
      provider.aadhaarBackUploadedAt = new Date();
    }
    if (nextAadhaarNumber.length === 12) {
      provider.aadhaarNumberMasked = `XXXX XXXX ${nextAadhaarNumber.slice(-4)}`;
    }
    if (aadhaarDocumentName) provider.aadhaarDocumentName = String(aadhaarDocumentName).trim();
    if (aadhaarBackDocumentName) provider.aadhaarBackDocumentName = String(aadhaarBackDocumentName).trim();

    if (submittedFront || submittedBack || (aadhaarCardImage && provider.approvalStatus !== "approved")) {
      provider.verificationStatus = "pending";
      provider.approvalStatus = "pending";
      provider.isActive = false;
      provider.verificationRejectedReason = "";
      provider.requestedAt = new Date();
    }

    if (availabilityStatus && ["active", "inactive", "absent", "available"].includes(availabilityStatus)) {
      provider.availabilityStatus = availabilityStatus;
      provider.isActive = availabilityStatus !== "inactive";
    }
    }
    provider.features = Array.isArray(features)
      ? features.map((feature) => String(feature).trim()).filter(Boolean)
      : String(features).split(",").map((feature) => feature.trim()).filter(Boolean);

    provider.bankDetails = {
      accountHolder: String(bankDetails.accountHolder || provider.bankDetails?.accountHolder || "").trim(),
      bankName: String(bankDetails.bankName || provider.bankDetails?.bankName || "").trim(),
      accountNumber: String(bankDetails.accountNumber || provider.bankDetails?.accountNumber || "").replace(/\s+/g, ""),
      ifscCode: String(bankDetails.ifscCode || provider.bankDetails?.ifscCode || "").trim().toUpperCase(),
    };

    if (provider.approvalStatus === "rejected") {
      provider.approvalStatus = "pending";
      provider.isActive = false;
      provider.rejectionReason = "";
      provider.rejectedAt = null;
      provider.approvedAt = null;
      provider.resubmittedAt = new Date();
    }

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

// Lets a provider whose registration was rejected by admin fix the missing/incorrect
// details (most commonly a missing Aadhaar upload) and send the profile back for
// admin review, without having to create a brand new account.
router.post("/resubmit-verification", requireAuth, requireProvider, async (req, res) => {
  try {
    const provider = await Provider.findOne({ owner: req.user._id });

    if (!provider) {
      return res.status(404).json({ message: "Provider profile not found." });
    }

    if (provider.approvalStatus !== "rejected") {
      return res.status(400).json({
        message: "Resubmission is only available for registrations rejected by admin.",
      });
    }

    const {
      name,
      category,
      customCategory = "",
      location,
      preferredWorkLocation,
      phone,
      price,
      aadhaarNumber,
      aadhaarFrontUrl,
      aadhaarBackUrl,
      aadhaarDocumentName = "",
      aadhaarBackDocumentName = "",
    } = req.body;

    const normalizedCategory = String(category || provider.category || "").trim();
    const normalizedCustomCategory = String(customCategory || "").trim();
    const providerCategory =
      normalizedCategory === "Other" ? normalizedCustomCategory : normalizedCategory;

    if (!providerCategory) {
      return res.status(400).json({ message: "Service category is required." });
    }

    const aadhaarDigits = String(aadhaarNumber || "").replace(/\D/g, "");
    if (aadhaarDigits.length !== 12) {
      return res.status(400).json({
        message: "Valid 12-digit Aadhaar number is required to resubmit your registration.",
      });
    }

    const normalizedAadhaarFrontUrl = String(aadhaarFrontUrl || "").trim();
    if (!isValidAadhaarDocument(normalizedAadhaarFrontUrl)) {
      return res.status(400).json({
        message: "Aadhaar front image or PDF upload is required to resubmit your registration.",
      });
    }

    const normalizedAadhaarBackUrl = String(aadhaarBackUrl || "").trim();
    if (normalizedAadhaarBackUrl && !isValidAadhaarDocument(normalizedAadhaarBackUrl)) {
      return res.status(400).json({ message: "Aadhaar back upload must be a PNG, JPG, WEBP, or PDF." });
    }

    if (name) provider.name = String(name).trim();
    provider.category = providerCategory;
    provider.customCategory = normalizedCategory === "Other" ? providerCategory : "";
    if (location) provider.location = String(location).trim();
    if (preferredWorkLocation) provider.preferredWorkLocation = String(preferredWorkLocation).trim();
    if (phone) provider.phone = String(phone).trim();
    if (price) provider.price = String(price).trim();

    provider.aadhaarNumberMasked = `XXXX XXXX ${aadhaarDigits.slice(-4)}`;
    provider.aadhaarFrontUrl = normalizedAadhaarFrontUrl;
    provider.aadhaarBackUrl = normalizedAadhaarBackUrl;
    provider.aadhaarDocumentName = String(aadhaarDocumentName || "").trim();
    provider.aadhaarBackDocumentName = String(aadhaarBackDocumentName || "").trim();

    // Send the profile back to admin for a fresh review.
    provider.approvalStatus = "pending";
    provider.verificationStatus = "pending";
    provider.verificationRejectedReason = "";
    provider.isActive = false;
    provider.rejectedAt = null;
    provider.suspendedAt = null;
    provider.requestedAt = new Date();

    await provider.save();
    invalidateCatalogCache();

    res.json({
      message: "Your registration has been resubmitted and is now waiting for admin review.",
      provider,
    });
  } catch (error) {
    res.status(500).json({ message: "Registration could not be resubmitted. Please try again." });
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
