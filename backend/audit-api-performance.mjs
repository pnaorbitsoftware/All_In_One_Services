import "dotenv/config";
import { createHash } from "node:crypto";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import { jwtSecret } from "./src/config/auth.js";
import { connectToDatabase } from "./src/database/mongo.js";
import Booking from "./src/models/Booking.js";
import Provider from "./src/models/Provider.js";
import Session from "./src/models/Session.js";
import User from "./src/models/User.js";

const baseUrl = "http://localhost:5003/api";
await connectToDatabase();

const [clientGroup] = await Booking.aggregate([
  { $lookup: { from: "users", localField: "user", foreignField: "_id", as: "account" } },
  { $unwind: "$account" },
  { $match: { "account.role": "user" } },
  { $group: { _id: "$user", bookings: { $sum: 1 } } },
  { $sort: { bookings: -1 } },
  { $limit: 1 },
]);
const client = clientGroup?._id
  ? await User.findById(clientGroup._id).lean()
  : await User.findOne({ role: "user" }).lean();
const providerProfile = await Provider.findOne({ approvalStatus: "approved" }).select("_id owner").lean();
const provider = providerProfile?.owner ? await User.findById(providerProfile.owner).lean() : null;
const admin = await User.findOne({ role: "admin" }).lean();

const temporarySessions = [];
const makeHeaders = async (user) => {
  if (!user) return null;
  const token = jwt.sign({ userId: String(user._id) }, jwtSecret, { expiresIn: "15m" });
  const tokenHash = createHash("sha256").update(token).digest("hex");
  await Session.create({
    user: user._id,
    tokenHash,
    status: "active",
    userAgent: "servicehub-api-performance-audit",
    expiresAt: new Date(Date.now() + 15 * 60_000),
  });
  temporarySessions.push(tokenHash);
  return { Authorization: `Bearer ${token}` };
};

const [clientHeaders, providerHeaders, adminHeaders] = await Promise.all([
  makeHeaders(client),
  makeHeaders(provider),
  makeHeaders(admin),
]);

const timeRequest = async (label, path, headers = {}) => {
  const startedAt = performance.now();
  const response = await fetch(`${baseUrl}${path}`, { headers });
  const text = await response.text();
  return {
    label,
    status: response.status,
    ms: Math.round(performance.now() - startedAt),
    kb: Math.round(text.length / 1024),
  };
};

const runTwice = async (label, path, headers) => [
  await timeRequest(`${label}-first`, path, headers),
  await timeRequest(`${label}-warm`, path, headers),
];

try {
  const clientBooking = client
    ? await Booking.findOne({ user: client._id }).select("_id bookingId").lean()
    : null;
  const providerBooking = providerProfile
    ? await Booking.findOne({ assignedProvider: providerProfile._id }).select("_id bookingId").lean()
    : null;

  const groups = [
    await runTwice("catalog", "/catalog", {}),
    ...(clientHeaders ? [
      await runTwice("client-bookings", "/bookings/my", clientHeaders),
      await runTwice("client-payments", "/payments/my", clientHeaders),
      await runTwice("client-support", "/support/tickets", clientHeaders),
      await runTwice("client-profile", "/auth/profile", clientHeaders),
      ...(clientBooking ? [await runTwice("client-tracking", `/bookings/${clientBooking.bookingId || clientBooking._id}/tracking`, clientHeaders)] : []),
    ] : []),
    ...(providerHeaders ? [
      await runTwice("provider-dashboard", "/providers/dashboard", providerHeaders),
      await runTwice("provider-profile", "/providers/profile", providerHeaders),
      await runTwice("provider-availability", "/providers/availability", providerHeaders),
      await runTwice("provider-earnings", "/payments/provider/earnings", providerHeaders),
      ...(providerBooking ? [await runTwice("provider-tracking", `/providers/bookings/${providerBooking.bookingId || providerBooking._id}/tracking`, providerHeaders)] : []),
    ] : []),
    ...(adminHeaders ? [
      await runTwice("admin-dashboard", "/admin/dashboard", adminHeaders),
      await runTwice("admin-contact", "/admin/contact-messages", adminHeaders),
      await runTwice("admin-ledger", "/payments/admin/ledger", adminHeaders),
      await runTwice("admin-support", "/support/tickets", adminHeaders),
      await runTwice("admin-support-analytics", "/support/analytics", adminHeaders),
      await runTwice("admin-staff", "/support/staff", adminHeaders),
    ] : []),
  ];
  console.log(JSON.stringify(groups.flat(), null, 2));
} finally {
  await Session.deleteMany({ tokenHash: { $in: temporarySessions } });
  await mongoose.disconnect();
}
