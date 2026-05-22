import express from "express";

import requireAuth from "../middleware/requireAuth.js";
import Booking from "../models/Booking.js";
import Provider from "../models/Provider.js";

const router = express.Router();

const requireProvider = (req, res, next) => {
  if (req.user.role !== "provider") {
    return res.status(403).json({ message: "Provider access required." });
  }

  next();
};

router.get("/dashboard", requireAuth, requireProvider, async (req, res) => {
  try {
    const provider = await Provider.findOne({ owner: req.user._id });

    if (!provider) {
      return res.status(404).json({ message: "Provider profile not found." });
    }

    const bookings = await Booking.find({ service: provider.category }).sort({ createdAt: -1 });

    res.json({ provider, bookings });
  } catch (error) {
    res.status(500).json({ message: "Provider dashboard could not be loaded." });
  }
});

router.patch("/bookings/:bookingId/status", requireAuth, requireProvider, async (req, res) => {
  try {
    const { status, workImage = "" } = req.body;
    const allowedStatuses = ["pending", "confirmed", "completed", "cancelled"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid booking status." });
    }

    const provider = await Provider.findOne({ owner: req.user._id });

    if (!provider) {
      return res.status(404).json({ message: "Provider profile not found." });
    }

    const update = { status };

    if (status === "completed") {
      if (!workImage) {
        return res.status(400).json({ message: "Upload a work image before marking work completed." });
      }

      update.workImage = workImage;
      update.completedAt = new Date();
    }

    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.bookingId, service: provider.category },
      update,
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ message: "Booking not found for this provider." });
    }

    res.json({ booking });
  } catch (error) {
    res.status(500).json({ message: "Booking status could not be updated." });
  }
});

export default router;
