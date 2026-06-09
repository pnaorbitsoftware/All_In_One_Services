import express from "express";

import requireAuth from "../middleware/requireAuth.js";
import Booking from "../models/Booking.js";
import { bookingLookup, buildPointLocation, publicLocation } from "../utils/location.js";
import { getJson } from "../utils/redis.js";

const router = express.Router();

const geocodeWithNominatim = async (address) => {
  if (!address?.trim()) return null;

  const params = new URLSearchParams({
    q: address.trim(),
    format: "json",
    limit: "1",
  });

  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      headers: {
        "User-Agent": "ServiceHubTracking/1.0",
      },
    });
    if (!response.ok) return null;

    const [result] = await response.json();
    if (!result) return null;

    return buildPointLocation(
      {
        latitude: result.lat,
        longitude: result.lon,
        address,
      },
      "capturedAt"
    );
  } catch {
    return null;
  }
};

router.post("/client", requireAuth, async (req, res) => {
  try {
    const {
      bookingId,
      lat,
      lng,
      latitude,
      longitude,
      accuracy,
      address = "",
    } = req.body || {};
    const trimmedAddress = String(address || "").trim();

    if (!bookingId) {
      return res.status(400).json({ message: "Booking ID is required." });
    }

    let clientLocation = buildPointLocation(
      {
        latitude: latitude ?? lat,
        longitude: longitude ?? lng,
        accuracy,
        address: trimmedAddress,
      },
      "capturedAt"
    );

    if (!clientLocation && trimmedAddress) {
      clientLocation = await geocodeWithNominatim(trimmedAddress);
    }

    if (!clientLocation && !trimmedAddress) {
      return res.status(400).json({ message: "Share GPS or enter an address." });
    }

    const booking = await Booking.findOneAndUpdate(
      {
        ...bookingLookup(bookingId),
        user: req.user._id,
        status: { $nin: ["completed", "cancelled"] },
      },
      {
        ...(clientLocation ? { clientLocation } : {}),
        ...(trimmedAddress ? { address: trimmedAddress } : {}),
      },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ message: "Active booking not found." });
    }

    const io = req.app.get("io");
    io?.to(booking.bookingId || String(booking._id)).emit("client:location", {
      bookingId: booking.bookingId || String(booking._id),
      clientLocation: publicLocation(booking.clientLocation),
      address: booking.address,
    });

    res.json({
      message: clientLocation
        ? "Client location updated for provider navigation."
        : "Client address updated for provider navigation.",
      booking,
      clientLocation: publicLocation(booking.clientLocation),
      address: booking.address,
    });
  } catch {
    res.status(500).json({ message: "Client location could not be updated." });
  }
});

router.get("/provider/:bookingId", requireAuth, async (req, res) => {
  try {
    const booking = await Booking.findOne({
      ...bookingLookup(req.params.bookingId),
      user: req.user._id,
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    const roomId = booking.bookingId || String(booking._id);
    const cachedLocation = await getJson(`booking:${roomId}:location`);

    res.json({
      bookingId: roomId,
      location: cachedLocation || null,
      stale: !cachedLocation,
    });
  } catch {
    res.status(500).json({ message: "Provider location could not be loaded." });
  }
});

export default router;
