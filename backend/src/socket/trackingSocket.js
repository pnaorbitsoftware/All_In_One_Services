import { createAdapter } from "@socket.io/redis-adapter";
import jwt from "jsonwebtoken";
import { jwtSecret } from "../config/auth.js";
import { Server } from "socket.io";

import Booking from "../models/Booking.js";
import ChatMessage from "../models/ChatMessage.js";
import GpsHistory from "../models/GpsHistory.js";
import Provider from "../models/Provider.js";
import User from "../models/User.js";
import { normalizeBookingStatus } from "../services/bookingTrackingService.js";
import { sendStatusChangeNotification } from "../services/notificationService.js";
import haversineDistance from "../utils/haversine.js";
import {
  bookingLookup,
  buildPointLocation,
  isValidCoordinatePair,
  locationToLatLng,
  publicLocation,
  toCoordinate,
} from "../utils/location.js";
import { computeEtaMinutes } from "../utils/osrm.js";
import { initializeRedis, setJsonWithTtl } from "../utils/redis.js";

const statusLabels = {
  accepted: "Accepted",
  confirmed: "Accepted",
  assigned: "Accepted",
  on_the_way: "En Route",
  en_route: "En Route",
  arrived: "Arrived",
  job_started: "Job Started",
  completed: "Completed",
};

export const getBookingRoomId = (booking) => String(booking?.bookingId || booking?._id || "");
export const getProviderRoomId = (providerId) => `provider:${providerId}`;

const normalizeRole = (role, userRole) => {
  if (role === "client") return "client";
  if (role === "provider") return "provider";
  if (role === "admin") return "admin";
  return userRole === "user" ? "client" : userRole;
};

export const normalizeTrackingStatus = (status) => {
  return normalizeBookingStatus(status);
};

const toSocketBookingPayload = (booking) => ({
  bookingId: getBookingRoomId(booking),
  databaseId: String(booking._id),
  status: booking.status,
  trackingStatus: normalizeTrackingStatus(booking.status),
  statusLabel: statusLabels[booking.status] || booking.status,
  eta: booking.eta ?? null,
  clientLocation: publicLocation(booking.clientLocation),
  providerLocation: publicLocation(booking.providerLocation),
  clientAddress: booking.clientLocation?.address || booking.address || "",
  providerName: booking.assignedProviderName || booking.requestedProviderName || "",
  problemDescription: booking.problemDescription || "",
  bookingLocation: booking.bookingLocation || null,
  cancellationReason: booking.cancellationReason || booking.cancelReason || "",
  cancelReason: booking.cancelReason || booking.cancellationReason || "",
  cancelledBy: booking.cancelledBy || "",
  cancelledAt: booking.cancelledAt || null,
  cancelType: booking.cancelType || "",
  trackingEvents: booking.trackingEvents || [],
  updatedAt: booking.updatedAt,
});

const toBookingUpdatePayload = (booking) => ({
  bookingId: getBookingRoomId(booking),
  databaseId: String(booking._id),
  status: booking.status,
  trackingStatus: normalizeTrackingStatus(booking.status),
  eta: booking.eta ?? null,
  problemDescription: booking.problemDescription || "",
  bookingLocation: booking.bookingLocation || null,
  cancellationReason: booking.cancellationReason || booking.cancelReason || "",
  cancelReason: booking.cancelReason || booking.cancellationReason || "",
  cancelledBy: booking.cancelledBy || "",
  cancelledAt: booking.cancelledAt || null,
  cancelType: booking.cancelType || "",
  trackingEvents: booking.trackingEvents || [],
  updatedAt: booking.updatedAt,
});

export const emitProviderDashboardUpdate = (io, providerIds = [], payload = {}) => {
  if (!io) return;

  const uniqueProviderIds = new Set(
    providerIds
      .filter(Boolean)
      .map((providerId) => String(providerId))
      .filter(Boolean)
  );

  uniqueProviderIds.forEach((providerId) => {
    io.to(getProviderRoomId(providerId)).emit("provider:dashboard-updated", payload);
  });
};

const canAccessBooking = async ({ booking, user, role }) => {
  const normalizedRole = normalizeRole(role, user.role);

  if (user.role === "admin" || normalizedRole === "admin") return true;

  if (normalizedRole === "client") {
    return booking.user?.toString() === user._id.toString();
  }

  if (normalizedRole === "provider" && user.role === "provider") {
    const provider = await Provider.findOne({ owner: user._id });
    if (!provider) return false;
    const assignedProviderId = booking.assignedProvider?.toString();
    return assignedProviderId === provider._id.toString();
  }

  return false;
};

const findParticipantBooking = async ({ bookingId, user, role }) => {
  const booking = await Booking.findOne(bookingLookup(bookingId));
  if (!booking) return null;

  const allowed = await canAccessBooking({ booking, user, role });
  return allowed ? booking : null;
};

const getChatSenderProfile = async (user) => {
  if (user.role === "provider") {
    const provider = await Provider.findOne({ owner: user._id }).select("name");
    return {
      senderRole: "provider",
      senderName: provider?.name || user.name || "Provider",
    };
  }

  return {
    senderRole: "client",
    senderName: user.name || "Client",
  };
};

const toChatPayload = (message) => ({
  id: String(message._id),
  bookingId: message.bookingId,
  senderId: String(message.sender),
  senderRole: message.senderRole,
  senderName: message.senderName,
  text: message.text,
  createdAt: message.createdAt,
});

const getChatHistory = async (booking) => {
  const messages = await ChatMessage.find({ booking: booking._id })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  return messages.reverse().map(toChatPayload);
};

export const emitStatusChange = (io, booking) => {
  if (!io || !booking) return;

  const payload = toBookingUpdatePayload(booking);

  io.to(getBookingRoomId(booking)).emit("status:change", payload);
  if (booking.user) {
    io.to(`user:${booking.user}`).emit("booking:updated", payload);
  }
  emitProviderDashboardUpdate(
    io,
    [booking.assignedProvider, booking.requestedProvider],
    {
      ...payload,
      type: "booking_status_change",
    }
  );
  sendStatusChangeNotification(booking).catch(() => {});
};

export const setupTrackingSocket = async (server, corsOptions) => {
  const io = new Server(server, {
    cors: corsOptions,
  });

  const redisClients = await initializeRedis();
  if (redisClients) {
    io.adapter(createAdapter(redisClients.pubClient, redisClients.subClient));
  }

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error("Authentication required."));

      const decoded = jwt.verify(token, jwtSecret);
      const user = await User.findById(decoded.userId);
      if (!user) return next(new Error("Session expired."));

      socket.data.user = user;
      next();
    } catch {
      next(new Error("Session expired."));
    }
  });

  io.on("connection", (socket) => {
    socket.join(`user:${socket.data.user._id}`);

    if (socket.data.user.role === "provider") {
      Provider.findOne({ owner: socket.data.user._id })
        .select("_id")
        .then((provider) => {
          if (provider) socket.join(getProviderRoomId(provider._id));
        })
        .catch(() => {});
    }

    socket.on("join_room", async ({ bookingId, role } = {}) => {
      try {
        const booking = await findParticipantBooking({
          bookingId,
          user: socket.data.user,
          role,
        });

        if (!booking) {
          socket.emit("tracking:error", { message: "Booking room not found or not allowed." });
          return;
        }

        socket.join(getBookingRoomId(booking));
        socket.emit("room_joined", toSocketBookingPayload(booking));
        socket.emit("chat:history", {
          bookingId: getBookingRoomId(booking),
          messages: await getChatHistory(booking),
        });
      } catch (error) {
        console.warn(`Socket room join error: ${error.message}`);
        socket.emit("tracking:error", { message: "Tracking room could not be joined." });
      }
    });

    socket.on("location:update", async (data = {}) => {
      try {
        const user = socket.data.user;
        if (user.role !== "provider") {
          socket.emit("tracking:error", { message: "Provider access required." });
          return;
        }

        const provider = await Provider.findOne({ owner: user._id });
        if (!provider) {
          socket.emit("tracking:error", { message: "Provider profile not found." });
          return;
        }

        const lat = toCoordinate(data.lat ?? data.latitude);
        const lng = toCoordinate(data.lng ?? data.longitude);
        if (!isValidCoordinatePair(lat, lng)) {
          socket.emit("tracking:error", { message: "Valid latitude and longitude are required." });
          return;
        }

        const booking = await Booking.findOne({
          ...bookingLookup(data.bookingId),
          assignedProvider: provider._id,
          status: { $nin: ["completed", "cancelled"] },
        });

        if (!booking) {
          socket.emit("tracking:error", { message: "Active booking not found for this provider." });
          return;
        }

        if (["arrived", "job_started"].includes(booking.status)) {
          return;
        }

        const providerLocation = buildPointLocation(
          {
            lat,
            lng,
            accuracy: data.accuracy,
          },
          "updatedAt"
        );
        const clientPoint = locationToLatLng(booking.clientLocation);
        const eta = clientPoint ? await computeEtaMinutes({ provider: { lat, lng }, client: clientPoint }) : null;
        const timestamp = data.timestamp ? new Date(data.timestamp) : new Date();
        const heading = toCoordinate(data.heading);
        const speed = toCoordinate(data.speed);
        const roomId = getBookingRoomId(booking);
        let arrived = false;

        const updateOperation = {
          $set: {
            providerLocation,
            eta,
          },
        };

        if (clientPoint) {
          const distanceMeters = haversineDistance(lat, lng, clientPoint.lat, clientPoint.lng);
          arrived = distanceMeters < 150 && !["arrived", "completed", "cancelled"].includes(booking.status);
          if (arrived) {
            updateOperation.$set.status = "arrived";
            updateOperation.$push = {
              trackingEvents: {
                status: "arrived",
                updatedAt: timestamp,
              },
            };
          }
        }

        const [updatedBooking] = await Promise.all([
          Booking.findByIdAndUpdate(booking._id, updateOperation, { new: true }),
          Provider.findByIdAndUpdate(provider._id, { currentLocation: providerLocation }),
          setJsonWithTtl(`booking:${roomId}:location`, {
            lat,
            lng,
            heading,
            speed,
            eta,
            timestamp: timestamp.toISOString(),
          }),
        ]);

        GpsHistory.create({
          bookingId: roomId,
          providerId: provider._id,
          location: {
            type: "Point",
            coordinates: [lng, lat],
          },
          heading,
          speed,
          timestamp,
        }).catch(() => {});

        if (arrived) {
          io.to(roomId).emit("provider:arrived", { timestamp: timestamp.toISOString() });
          emitStatusChange(io, updatedBooking);
        }

        io.to(roomId).emit("location:update", {
          bookingId: roomId,
          lat,
          lng,
          heading,
          speed,
          eta,
          timestamp: timestamp.toISOString(),
          providerLocation: publicLocation(providerLocation),
          clientLocation: publicLocation(updatedBooking?.clientLocation) || null,
          providerArea: updatedBooking?.assignedProviderName
            ? `${updatedBooking.assignedProviderName} is nearby`
            : "Provider is nearby",
        });
      } catch (error) {
        console.warn(`Socket location update error: ${error.message}`);
        socket.emit("tracking:error", { message: "Provider location could not be shared." });
      }
    });

    socket.on("chat:message", async (data = {}) => {
      try {
        const text = String(data.text || "").trim();
        if (!text) {
          socket.emit("tracking:error", { message: "Message cannot be empty." });
          return;
        }

        if (text.length > 1000) {
          socket.emit("tracking:error", { message: "Message is too long." });
          return;
        }

        const booking = await findParticipantBooking({
          bookingId: data.bookingId,
          user: socket.data.user,
          role: normalizeRole(data.role, socket.data.user.role),
        });

        if (!booking) {
          socket.emit("tracking:error", { message: "Booking chat not found or not allowed." });
          return;
        }

        const roomId = getBookingRoomId(booking);
        const sender = await getChatSenderProfile(socket.data.user);
        socket.join(roomId);
        const message = await ChatMessage.create({
          booking: booking._id,
          bookingId: roomId,
          sender: socket.data.user._id,
          senderRole: sender.senderRole,
          senderName: sender.senderName,
          text,
        });

        io.to(roomId).emit("chat:message", toChatPayload(message));
      } catch (error) {
        console.warn(`Socket chat message error: ${error.message}`);
        socket.emit("tracking:error", { message: "Message could not be sent." });
      }
    });
  });

  return io;
};
