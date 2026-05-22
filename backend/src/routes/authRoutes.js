import express from "express";
import jwt from "jsonwebtoken";
import { createHash } from "node:crypto";

import Session from "../models/Session.js";
import Provider from "../models/Provider.js";
import User from "../models/User.js";

const router = express.Router();
const jwtSecret = process.env.JWT_SECRET || "dev_servicehub_secret_change_me";

const createToken = (userId) =>
  jwt.sign({ userId }, jwtSecret, { expiresIn: "7d" });

const hashToken = (token) => createHash("sha256").update(token).digest("hex");

const createSession = (req, userId, token) =>
  Session.create({
    user: userId,
    tokenHash: hashToken(token),
    userAgent: req.get("user-agent") || "",
    ipAddress: req.ip,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
});

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role = "user",
      phone = "",
      providerName,
      category,
      location,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    if (!["user", "provider"].includes(role)) {
      return res.status(400).json({ message: "Invalid account type." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    if (role === "provider" && (!providerName || !category || !location || !phone)) {
      return res.status(400).json({ message: "Provider name, phone, category, and location are required." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const user = await User.create({ name, email, password, role, phone });

    if (role === "provider") {
      await Provider.create({
        owner: user._id,
        providerCode: `${slugify(providerName)}-${Date.now()}`,
        name: providerName,
        email,
        category,
        location,
        phone,
        rating: 0,
        reviews: 0,
        responseTime: "~1 hr",
        price: "Contact for price",
        description: `${providerName} provides ${category} services in ${location}.`,
        about: `${providerName} is registered on ServiceHub as a ${category} provider.`,
        features: [category],
      });
    }

    const token = createToken(user._id);
    await createSession(req, user._id, token);

    res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ message: "Registration failed. Please try again." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password, role = "user" } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    if (!["user", "provider", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid account type." });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    if (user.role !== role) {
      if (role === "admin") {
        return res.status(403).json({
          message: "This email is not a superadmin account. Use User Login for this email or use the seeded superadmin email.",
        });
      }

      return res.status(403).json({ message: `Please use the ${user.role} login option for this account.` });
    }

    const token = createToken(user._id);
    await createSession(req, user._id, token);

    res.json({ token, user: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ message: "Login failed. Please try again." });
  }
});

router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const decoded = jwt.verify(token, jwtSecret);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    res.status(401).json({ message: "Session expired. Please log in again." });
  }
});

export default router;
