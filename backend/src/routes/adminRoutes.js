import express from "express";

import requireAuth from "../middleware/requireAuth.js";
import Booking from "../models/Booking.js";
import Provider from "../models/Provider.js";
import User from "../models/User.js";
import {
  sendProviderAcceptedEmail,
  sendProviderRequestEmail,
  sendServiceCompletedEmail,
} from "../services/mailService.js";

const router = express.Router();

const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Superadmin access required." });
  }

  next();
};

router.get("/dashboard", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const [users, providers, bookings] = await Promise.all([
      User.find({ role: { $ne: "admin" } }).select("-password").sort({ createdAt: -1 }),
      Provider.find().sort({ createdAt: -1 }),
      Booking.find()
        .populate("user", "name email phone role")
        .populate("assignedProvider")
        .populate("requestedProvider")
        .sort({ createdAt: -1 }),
    ]);

    const totalCostEstimate = bookings.reduce(
      (total, booking) => total + (booking.costEstimate || 0),
      0
    );

    res.json({
      stats: {
        totalUsers: users.filter((user) => user.role === "user").length,
        totalProviders: providers.length,
        totalBookings: bookings.length,
        pendingWork: bookings.filter((booking) => booking.status !== "completed" && !(booking.status === "cancelled" && booking.cancelledBy === "client")).length,
        completedWork: bookings.filter((booking) => booking.status === "completed" || (booking.status === "cancelled" && booking.cancelledBy === "client")).length,
        totalCostEstimate,
      },
      users,
      providers,
      bookings,
    });
  } catch (error) {
    res.status(500).json({ message: "Admin dashboard could not be loaded." });
  }
});

router.patch("/providers/:providerId/approval", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { approvalStatus } = req.body;

    if (!["approved", "rejected"].includes(approvalStatus)) {
      return res.status(400).json({ message: "Invalid provider approval status." });
    }

    const provider = await Provider.findByIdAndUpdate(
      req.params.providerId,
      {
        approvalStatus,
        isActive: approvalStatus === "approved",
        approvedAt: approvalStatus === "approved" ? new Date() : null,
      },
      { new: true }
    );

    if (!provider) {
      return res.status(404).json({ message: "Provider not found." });
    }

    res.json({ provider });
  } catch (error) {
    res.status(500).json({ message: "Provider approval could not be updated." });
  }
});

router.patch("/bookings/:bookingId", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status, providerId } = req.body;
    const allowedStatuses = ["pending", "accepted", "assigned", "confirmed", "completed", "cancelled"];
    const update = {};

    if (status) {
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid booking status." });
      }

      update.status = status;

      if (status === "accepted") {
        update.acceptedAt = new Date();
      } else if (status === "cancelled") {
        update.cancelledBy = "admin";
        update.cancelledAt = new Date();
      }
    }

    if (providerId) {
      const provider = await Provider.findOne({
        _id: providerId,
        isActive: true,
        approvalStatus: "approved",
      });

      if (!provider) {
        return res.status(400).json({ message: "Choose an approved active provider." });
      }

      update.assignedProvider = provider._id;
      update.assignedProviderName = provider.name;
      update.assignedAt = new Date();
      update.status = "assigned";
      update.cancelledBy = "";
      update.cancelledAt = null;
      update.cancellationReason = "";
    }

    const booking = await Booking.findByIdAndUpdate(req.params.bookingId, update, {
      new: true,
    })
      .populate("user", "name email phone role")
      .populate("assignedProvider")
      .populate("requestedProvider");

    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }
    const client = await User.findById(booking.user);

    if (providerId && booking.assignedProvider) {
      await sendProviderAcceptedEmail({
        to: client?.email,
        name: client?.name || booking.name,
        booking,
        provider: booking.assignedProvider,
      });

      if (booking.assignedProvider.email) {
        await sendProviderRequestEmail({
          to: booking.assignedProvider.email,
          providerName: booking.assignedProvider.name,
          booking,
        });
      }
    }

    if (status === "completed") {
      await sendServiceCompletedEmail({
        to: client?.email,
        name: client?.name || booking.name,
        booking,
        providerName: booking.assignedProviderName,
      });
    }

    res.json({ booking });
  } catch (error) {
    res.status(500).json({ message: "Booking could not be updated." });
  }
});

export default router;
