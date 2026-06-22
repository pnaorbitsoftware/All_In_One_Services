import jwt from "jsonwebtoken";
import { createHash } from "node:crypto";

import { jwtSecret } from "../config/auth.js";
import Session from "../models/Session.js";
import User from "../models/User.js";

const hashToken = (token) => createHash("sha256").update(token).digest("hex");

export default async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Please log in to continue." });
    }

    const decoded = jwt.verify(token, jwtSecret);
    const session = await Session.findOne({
      tokenHash: hashToken(token),
      status: "active",
      expiresAt: { $gt: new Date() },
    })
      .select("user")
      .lean();

    if (!session || String(session.user) !== String(decoded.userId)) {
      return res.status(401).json({ message: "Session expired. Please log in again." });
    }

    const user = await User.findById(decoded.userId)
      .select("_id name email phone address profileImage role")
      .lean();

    if (!user) {
      return res.status(401).json({ message: "Please log in again." });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Session expired. Please log in again." });
  }
}
