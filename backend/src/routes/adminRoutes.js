import express from "express";

import requireAuth from "../middleware/requireAuth.js";
import Booking from "../models/Booking.js";
import Provider from "../models/Provider.js";
import User from "../models/User.js";

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
      Booking.find().sort({ createdAt: -1 }),
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
        pendingWork: bookings.filter((booking) => booking.status !== "completed").length,
        completedWork: bookings.filter((booking) => booking.status === "completed").length,
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

export default router;
