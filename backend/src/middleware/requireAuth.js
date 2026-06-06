import jwt from "jsonwebtoken";

import User from "../models/User.js";

const jwtSecret = process.env.JWT_SECRET || "dev_servicehub_secret_change_me";

export default async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Please log in to continue." });
    }

    const decoded = jwt.verify(token, jwtSecret);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: "Please log in again." });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: "Session expired. Please log in again." });
  }
}
