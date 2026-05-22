import express from "express";

import requireAuth from "../middleware/requireAuth.js";
import Booking from "../models/Booking.js";

const router = express.Router();

const durationCostMap = {
  "30 minutes": 199,
  "1 hour": 299,
  "2 hours": 549,
  "3 hours": 799,
  "Half day": 1499,
  "Full day": 2499,
};

router.post("/", requireAuth, async (req, res) => {
  try {
    const { name, phone, service, address, date, time, duration } = req.body;

    if (!name || !phone || !service || !address || !date || !time || !duration) {
      return res.status(400).json({ message: "All booking fields are required." });
    }

    const booking = await Booking.create({
      user: req.user._id,
      userName: req.user.name,
      userEmail: req.user.email,
      name,
      phone,
      service,
      address,
      preferredDate: date,
      preferredTime: time,
      serviceDuration: duration,
      costEstimate: durationCostMap[duration] || 299,
    });

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
    const bookings = await Booking.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ bookings });
  } catch (error) {
    res.status(500).json({ message: "Could not load bookings." });
  }
});

export default router;
