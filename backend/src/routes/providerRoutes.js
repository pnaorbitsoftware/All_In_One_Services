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

    if (!provider.isActive || provider.approvalStatus !== "approved") {
      return res.status(403).json({ message: "Provider profile is waiting for admin approval." });
    }

    const [bookings, availableRequests] = await Promise.all([
      Booking.find({
        $or: [
          { assignedProvider: provider._id },
          { requestedProvider: provider._id, status: "cancelled" },
        ],
      }).sort({ createdAt: -1 }),
      Booking.find(buildAvailableBookingFilter(provider)).sort({ createdAt: -1 }),
    ]);

    res.json({
      provider,
      bookings,
      availableRequests,
      paymentSummary: buildProviderPaymentSummary(bookings),
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

router.patch("/bookings/:bookingId/accept", requireAuth, requireProvider, async (req, res) => {
  try {
    const provider = await Provider.findOne({ owner: req.user._id });

    if (!provider) {
      return res.status(404).json({ message: "Provider profile not found." });
    }

    if (!provider.isActive || provider.approvalStatus !== "approved") {
      return res.status(403).json({ message: "Provider profile is waiting for admin approval." });
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
