import express from "express";

import requireAuth from "../middleware/requireAuth.js";
import Booking from "../models/Booking.js";
import Provider from "../models/Provider.js";
import {
  sendBookingEmail,
  sendProviderRequestEmail,
} from "../services/mailService.js";
import { buildServiceRegexes } from "../utils/serviceMatching.js";

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

const canClientCancelBooking = (booking) => {
  if (["completed", "cancelled"].includes(booking.status)) return false;
  if (!booking.acceptedAt) return true;

  return Date.now() - new Date(booking.acceptedAt).getTime() <= clientCancelWindowMs;
};

router.post("/", requireAuth, async (req, res) => {
  try {
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
      service: selectedProvider?.category || service.trim(),
      address,
      problemDescription,
      preferredDate,
      preferredTime: time,
      serviceDuration: duration,
      costEstimate: durationCostMap[duration] || 299,
      requestedProvider: requestedProvider?._id || null,
      requestedProviderName: requestedProvider?.name || "",
    });

    const matchingProviders = requestedProvider
      ? [requestedProvider]
      : await Provider.find({
          owner: { $ne: null },
          isActive: true,
          approvalStatus: "approved",
          category: { $in: buildServiceRegexes(selectedProvider?.category || service) },
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
    const { paymentReference = "", receiptUrl = "" } = req.body;
    const booking = await Booking.findOne({ _id: req.params.bookingId, user: req.user._id });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    if (!paymentReference) {
      return res.status(400).json({ message: "Payment reference is required after gateway confirmation." });
    }

    booking.clientPaymentStatus = "paid";
    booking.clientPaidAt = new Date();
    booking.paymentReference = paymentReference;
    booking.receiptUrl = receiptUrl;
    await booking.save();

    res.json({ message: "Payment confirmed.", booking });
  } catch (error) {
    res.status(500).json({ message: "Payment confirmation could not be saved." });
  }
});
export default router;
