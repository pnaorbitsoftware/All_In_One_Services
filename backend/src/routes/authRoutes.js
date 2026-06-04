import express from "express";
import jwt from "jsonwebtoken";
import { createHash, randomBytes, randomInt } from "node:crypto";

import Session from "../models/Session.js";
import Provider from "../models/Provider.js";
import User from "../models/User.js";
import {
  sendOtpEmail,
  sendWelcomeEmail,
} from "../services/mailService.js";

const router = express.Router();
const jwtSecret = process.env.JWT_SECRET || "dev_servicehub_secret_change_me";
const requireEmailOtpForRegistration =
  process.env.AUTH_REQUIRE_EMAIL_OTP !== "false";
const passwordResetOtps = new Map();
const registrationOtps = new Map();

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
  avatar: user.avatar || "",
  role: user.role,
});

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const getResetKey = (role, identifier) => `${role}:${identifier.trim().toLowerCase()}`;
const getRegistrationKey = (email) => email.trim().toLowerCase();

const findResetUser = async (role, identifier) => {
  const normalizedIdentifier = identifier.trim().toLowerCase();

  return User.findOne({
    role,
    $or: [
      { email: normalizedIdentifier },
      { phone: identifier.trim() },
    ],
  }).select("+password");
};

const ensureOtpEmailSent = (mailResult) => {
  if (mailResult?.sent) {
    return;
  }

  if (mailResult?.skipped) {
    throw new Error("Email is not configured. Add valid Brevo SMTP details in backend .env.");
  }

  throw new Error("Email could not be sent. Check your Brevo SMTP username, key, and verified sender email.");
};

const getTokenUser = async (req) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    const error = new Error("Authentication required.");
    error.status = 401;
    throw error;
  }

  let decoded;
  try {
    decoded = jwt.verify(token, jwtSecret);
  } catch {
    const error = new Error("Session expired. Please log in again.");
    error.status = 401;
    throw error;
  }

  const user = await User.findById(decoded.userId);

  if (!user) {
    const error = new Error("User not found.");
    error.status = 404;
    throw error;
  }

  return user;
};

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
      price,
      responseTime,
      otp,
    } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!name || !normalizedEmail || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    if (!["user", "provider"].includes(role)) {
      return res.status(400).json({ message: "Invalid account type." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    if (role === "provider" && (!providerName || !category || !location || !phone || !price || !responseTime)) {
      return res.status(400).json({
        message: "Provider name, phone, category, location, price, and response time are required.",
      });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const registrationKey = getRegistrationKey(normalizedEmail);
    const registrationRecord = registrationOtps.get(registrationKey);

    if (!otp) {
      const registrationOtp = String(randomInt(100000, 1000000));
      const mailResult = await sendOtpEmail({
        to: normalizedEmail,
        name,
        otp: registrationOtp,
        purpose: "registration",
      });

      if (mailResult?.sent) {
        registrationOtps.set(registrationKey, {
          otp: registrationOtp,
          expiresAt: Date.now() + 5 * 60 * 1000,
        });

        return res.status(202).json({
          message: "OTP sent to registered email. Use it within 5 minutes.",
          requiresOtp: true,
        });
      }

      if (requireEmailOtpForRegistration) {
        ensureOtpEmailSent(mailResult);
      }

      console.warn(
        `Registration email was not sent for ${normalizedEmail}; continuing without OTP for local/mobile testing.`
      );
    }

    if (otp) {
      if (!registrationRecord || registrationRecord.expiresAt < Date.now()) {
        registrationOtps.delete(registrationKey);
        return res.status(400).json({ message: "Registration OTP expired. Please generate a new OTP." });
      }

      if (registrationRecord.otp !== otp.trim()) {
        return res.status(400).json({ message: "Invalid registration OTP." });
      }

      registrationOtps.delete(registrationKey);
    }

    const user = await User.create({ name, email: normalizedEmail, password, role, phone });

    if (role === "provider") {
      await Provider.create({
        owner: user._id,
        providerCode: `${slugify(providerName)}-${Date.now()}`,
        name: providerName,
        email: normalizedEmail,
        category,
        location,
        phone,
        rating: 0,
        reviews: 0,
        responseTime,
        price,
        description: `${providerName} provides ${category} services in ${location}.`,
        about: `${providerName} is registered on ServiceHub as a ${category} provider.`,
        features: [category],
        isActive: true,
        approvalStatus: "approved",
        approvedAt: new Date(),
      });
    }

    const token = createToken(user._id);
    await createSession(req, user._id, token);
    await sendWelcomeEmail({ to: normalizedEmail, name, role });

    res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (error) {
    if (error.message.startsWith("Email ")) {
      return res.status(500).json({ message: error.message });
    }

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

router.post("/forgot-password/otp", async (req, res) => {
  try {
    const { identifier, role = "user" } = req.body;

    if (!identifier) {
      return res.status(400).json({ message: "Email or mobile number is required." });
    }

    if (!["user", "provider"].includes(role)) {
      return res.status(400).json({ message: "Password reset is available for client and provider accounts only." });
    }

    const user = await findResetUser(role, identifier);

    if (!user) {
      return res.status(404).json({ message: "No matching account was found for this email or mobile number." });
    }

    const otp = String(randomInt(100000, 1000000));
    const mailResult = await sendOtpEmail({
      to: user.email,
      name: user.name,
      otp,
      purpose: "password reset",
    });
    ensureOtpEmailSent(mailResult);
    passwordResetOtps.set(getResetKey(role, identifier), {
      otp,
      resetToken: "",
      userId: user._id.toString(),
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    res.json({
      message: "OTP sent to registered email. Use it within 5 minutes.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "OTP could not be generated. Please try again." });
  }
});

router.post("/forgot-password/verify", async (req, res) => {
  try {
    const { identifier, otp, role = "user" } = req.body;

    if (!identifier || !otp) {
      return res.status(400).json({ message: "Email or mobile number and OTP are required." });
    }

    if (!["user", "provider"].includes(role)) {
      return res.status(400).json({ message: "Password reset is available for client and provider accounts only." });
    }

    const resetKey = getResetKey(role, identifier);
    const resetRecord = passwordResetOtps.get(resetKey);

    if (!resetRecord || resetRecord.expiresAt < Date.now()) {
      passwordResetOtps.delete(resetKey);
      return res.status(400).json({ message: "OTP expired. Please generate a new OTP." });
    }

    if (resetRecord.otp !== otp.trim()) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    const resetToken = randomBytes(24).toString("hex");
    passwordResetOtps.set(resetKey, { ...resetRecord, resetToken });

    res.json({ message: "OTP verified successfully.", resetToken });
  } catch (error) {
    res.status(500).json({ message: "OTP could not be verified. Please try again." });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { identifier, password, resetToken, role = "user" } = req.body;

    if (!identifier || !password || !resetToken) {
      return res.status(400).json({ message: "OTP verification and new password are required." });
    }

    if (!["user", "provider"].includes(role)) {
      return res.status(400).json({ message: "Password reset is available for client and provider accounts only." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const resetKey = getResetKey(role, identifier);
    const resetRecord = passwordResetOtps.get(resetKey);

    if (!resetRecord || resetRecord.expiresAt < Date.now() || resetRecord.resetToken !== resetToken) {
      passwordResetOtps.delete(resetKey);
      return res.status(400).json({ message: "OTP verification expired. Please generate a new OTP." });
    }

    const user = await User.findById(resetRecord.userId).select("+password");

    if (!user || user.role !== role) {
      passwordResetOtps.delete(resetKey);
      return res.status(404).json({ message: "No matching account was found." });
    }

    user.password = password;
    await user.save();
    await Session.deleteMany({ user: user._id });
    passwordResetOtps.delete(resetKey);

    res.json({ message: "Password updated successfully. Please login with your new password." });
  } catch (error) {
    res.status(500).json({ message: "Password could not be reset. Please try again." });
  }
});

router.get("/me", async (req, res) => {
  try {
    const user = await getTokenUser(req);
    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    res.status(error.status || 401).json({ message: error.message || "Session expired. Please log in again." });
  }
});

router.patch("/profile", async (req, res) => {
  try {
    const user = await getTokenUser(req);
    const { name, email, phone = "", avatar = "" } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!name?.trim() || !normalizedEmail) {
      return res.status(400).json({ message: "Name and email are required." });
    }

    const existingUser = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: user._id },
    });

    if (existingUser) {
      return res.status(409).json({ message: "This email is already used by another account." });
    }

    user.name = name.trim();
    user.email = normalizedEmail;
    user.phone = phone.trim();
    user.avatar = typeof avatar === "string" ? avatar : "";
    await user.save();

    if (user.role === "provider") {
      const provider = await Provider.findOne({ owner: user._id });

      if (provider) {
        provider.name = user.name;
        provider.email = user.email;
        provider.phone = user.phone;
        provider.image = user.avatar;
        await provider.save();
      }
    }

    res.json({
      message: "Profile updated successfully.",
      user: sanitizeUser(user),
    });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || "Profile could not be updated." });
  }
});

export default router;
