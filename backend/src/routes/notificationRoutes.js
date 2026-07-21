import express from "express";

import requireAuth from "../middleware/requireAuth.js";
import Booking from "../models/Booking.js";
import Provider from "../models/Provider.js";
import { buildServiceRegexes } from "../utils/serviceMatching.js";
import { normalizeTrackingStatus } from "../utils/tracking.js";

const router = express.Router();

const formatNotificationTime = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "ServiceHub";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const notificationFromBooking = (booking, type = "booking") => {
  const status = normalizeTrackingStatus(booking.status);
  const providerName = booking.assignedProviderName || booking.requestedProviderName || "Provider";
  const isPaymentDone = booking.clientPaymentStatus === "paid" || booking.paymentStatus === "paid";

  if (type === "payment") {
    return {
      id: `payment-${booking._id}`,
      type: "payment",
      title: isPaymentDone ? "Payment completed" : "Payment pending",
      message: isPaymentDone
        ? `Payment received for ${booking.service}.`
        : `Complete payment for ${booking.service} when the final estimate is accepted.`,
      time: formatNotificationTime(booking.clientPaidAt || booking.updatedAt),
      read: false,
      bookingId: booking._id,
    };
  }

  return {
    id: `booking-${booking._id}`,
    type: "booking",
    title: `${booking.service} is ${status}`,
    message:
      status === "Provider Assigned"
        ? `${providerName} accepted your booking.`
        : `Your ${booking.service} booking status is ${status}.`,
    time: formatNotificationTime(booking.updatedAt || booking.createdAt),
    read: false,
    bookingId: booking._id,
  };
};

async function getClientNotifications(userId) {
  const bookings = await Booking.find({ user: userId })
    .select("-workImage")
    .sort({ updatedAt: -1 })
    .limit(25)
    .lean();
  return bookings.flatMap((booking) => {
    const items = [notificationFromBooking(booking, "booking")];
    if (booking.estimateStatus === "accepted" || booking.paymentStatus === "paid" || booking.clientPaymentStatus === "paid") {
      items.push(notificationFromBooking(booking, "payment"));
    }
    if (booking.locationRequested) {
      items.push({
        id: `loc-req-${booking._id}`,
        type: "location_request",
        title: "Location Request",
        message: "The service provider has requested your current GPS location for navigation.",
        time: formatNotificationTime(booking.updatedAt),
        read: false,
        bookingId: booking._id,
      });
    }
    return items;
  });
}

async function getProviderNotifications(userId) {
  const provider = await Provider.findOne({ owner: userId }).lean();
  if (!provider) return [];

  const [assignedBookings, availableRequests] = await Promise.all([
    Booking.find({ assignedProvider: provider._id })
      .select("-workImage")
      .sort({ updatedAt: -1 })
      .limit(20)
      .lean(),
    Booking.find({
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
      status: { $in: ["pending", "accepted", "confirmed", "Confirmed"] },
    })
      .select("-workImage")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
  ]);

  const assigned = assignedBookings.map((booking) => ({
    id: `provider-booking-${booking._id}`,
    type: "booking",
    title: `${booking.service} job update`,
    message: `${booking.name}'s booking is ${normalizeTrackingStatus(booking.status)}.`,
    time: formatNotificationTime(booking.updatedAt || booking.createdAt),
    read: false,
    bookingId: booking._id,
  }));

  const requests = availableRequests.map((booking) => ({
    id: `provider-request-${booking._id}`,
    type: "provider",
    title: "New service request",
    message: `${booking.name} requested ${booking.service} in ${booking.address}.`,
    time: formatNotificationTime(booking.createdAt),
    read: false,
    bookingId: booking._id,
  }));

  return [...requests, ...assigned].sort((a, b) => String(b.time).localeCompare(String(a.time)));
}


router.post("/push-token", requireAuth, async (req, res) => {
  try {
    const token = String(req.body.expoPushToken || "").trim();

    if (!token || !token.startsWith("ExponentPushToken[")) {
      return res.status(400).json({ message: "Valid Expo push token is required." });
    }

    req.user.expoPushTokens = Array.from(new Set([...(req.user.expoPushTokens || []), token])).slice(-5);
    await req.user.save();

    res.json({ message: "Push token saved.", pushTokenSaved: true });
  } catch (error) {
    res.status(500).json({ message: "Push token could not be saved." });
  }
});

router.get("/", requireAuth, async (req, res) => {
  try {
    const notifications =
      req.user.role === "provider"
        ? await getProviderNotifications(req.user._id)
        : await getClientNotifications(req.user._id);

    res.json({ notifications });
  } catch (error) {
    res.status(500).json({ message: "Notifications could not be loaded." });
  }
});

router.patch("/read-all", requireAuth, (_req, res) => {
  res.json({ message: "Notifications marked as read.", updated: true });
});

router.patch("/:notificationId/read", requireAuth, (req, res) => {
  res.json({
    message: "Notification marked as read.",
    notificationId: req.params.notificationId,
    updated: true,
  });
});

export default router;
