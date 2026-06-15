import express from "express";
import jwt from "jsonwebtoken";
import { createHash, randomBytes, randomInt } from "node:crypto";

import requireAuth from "../middleware/requireAuth.js";
import Session from "../models/Session.js";
import Provider from "../models/Provider.js";
import User from "../models/User.js";
import {
  sendOtpEmail,
  sendWelcomeEmail,
} from "../services/mailService.js";
import { getSmsOtpDiagnostics, sendSmsOtp, verifySmsOtp } from "../services/twilioVerifyService.js";
import { getWhatsAppDiagnostics, sendOtpWhatsApp } from "../services/whatsappService.js";
import { sendWelcomeWhatsApp } from "../services/whatsappNotificationService.js";
import { setJsonWithTtl } from "../utils/redis.js";

const router = express.Router();
const jwtSecret = process.env.JWT_SECRET || "dev_servicehub_secret_change_me";
const passwordResetOtps = new Map();
const registrationOtps = new Map();

const createToken = (userId) =>
  jwt.sign({ userId }, jwtSecret, { expiresIn: "7d" });

const hashToken = (token) => createHash("sha256").update(token).digest("hex");

const createSession = async (req, user, token) => {
  const session = await Session.create({
    user: user._id,
    tokenHash: hashToken(token),
    userAgent: req.get("user-agent") || "",
    ipAddress: req.ip,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  setJsonWithTtl(
    `session:${user._id}`,
    {
      userId: user._id.toString(),
      role: user.role === "user" ? "client" : user.role,
      email: user.email,
    },
    24 * 60 * 60
  ).catch(() => {});

  return session;
};

const queueSession = (req, user, token) => {
  const ip = req.ip;
  const userAgent = req.get("user-agent") || "";
  const sessionRequest = {
    ip,
    get: (header) => (String(header).toLowerCase() === "user-agent" ? userAgent : ""),
  };

  setImmediate(() => {
    createSession(sessionRequest, user, token).catch((error) => {
      console.warn(`Session persistence failed: ${error.message}`);
    });
  });
};

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  address: user.address || "",
  profileImage: user.profileImage || "",
  role: user.role,
});

const isValidProfileImage = (value) => {
  if (value === "") return true;
  return /^data:image\/(png|jpe?g|webp);base64,[a-z0-9+/=\s]+$/i.test(value);
};

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
  }).select("_id name email phone role");
};

const ensureOtpSent = (result, channel) => {
  if (result?.sent || result?.queued) {
    return;
  }

  if (result?.skipped) {
    throw new Error(`${channel} OTP failed: ${result.reason || `${channel} OTP is not configured.`}`);
  }

  throw new Error(`${channel} OTP failed: ${result?.reason || result?.error?.message || `Please check ${channel} settings.`}`);
};

const otpChannelLabel = (channel) => {
  if (channel === "whatsapp") return "WhatsApp number";
  if (channel === "sms") return "mobile number";
  return "email";
};

const sendOtpByChannel = ({ channel, email, phone, name, otp, purpose }) => {
  if (channel === "sms") {
    return sendSmsOtp({ to: phone });
  }

  if (channel === "whatsapp") {
    return sendOtpWhatsApp({ to: phone, name, otp, purpose });
  }

  return sendOtpEmail({ to: email, name, otp, purpose });
};

const queueOtpByChannel = ({ channel, email, phone, name, otp, purpose }) => {
  if (channel === "sms") {
    return sendSmsOtp({ to: phone });
  }

  const delivery = () =>
    sendOtpByChannel({ channel, email, phone, name, otp, purpose }).then((result) => {
      if (!result?.sent) {
        console.warn(`${channel} OTP delivery was not accepted: ${result?.reason || result?.error?.message || "unknown error"}`);
      }
    });

  setImmediate(() => {
    delivery().catch((error) => {
      console.warn(`${channel} OTP delivery failed: ${error.message}`);
    });
  });

  return Promise.resolve({ queued: true, provider: channel });
};

router.get("/whatsapp/status", (_req, res) => {
  res.json({
    ...getWhatsAppDiagnostics(),
    ...getSmsOtpDiagnostics(),
  });
});

router.post("/registration-status", async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const role = req.body?.role || "user";

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    if (!["user", "provider", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid account type." });
    }

    const user = await User.findOne({ email, role }).select("_id role").lean();
    const accountForEmail = user
      ? user
      : await User.findOne({ email }).select("_id role").lean();

    if (!user && role === "user" && accountForEmail?.role === "admin") {
      return res.json({
        registered: true,
        accountExists: true,
        role,
        actualRole: "admin",
        message: "Admin account found.",
      });
    }

    res.json({
      registered: Boolean(user),
      accountExists: Boolean(accountForEmail),
      role,
      message: user
        ? "Account is registered."
        : role === "provider"
        ? "Provider is not registered. Please register first."
        : "User is not registered. Please register first.",
    });
  } catch {
    res.status(500).json({ message: "Registration status could not be checked." });
  }
});

router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      confirmPassword = "",
      role = "user",
      phone = "",
      address = "",
      providerName,
      category,
      customCategory = "",
      location,
      preferredWorkLocation,
      workImage = "",
      price,
      responseTime,
      otpChannel = "email",
      otp,
    } = req.body;

    const normalizedCategory = String(category || "").trim();
    const normalizedCustomCategory = String(customCategory || "").trim();
    const providerCategory = normalizedCategory === "Other" ? normalizedCustomCategory : normalizedCategory;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ message: "Name, email, phone, and password are required." });
    }

    if (!["user", "provider"].includes(role)) {
      return res.status(400).json({ message: "Invalid account type." });
    }

    if (!["email", "whatsapp", "sms"].includes(otpChannel)) {
      return res.status(400).json({ message: "Invalid OTP delivery option." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ message: "Password and confirm password must match." });
    }

    if (
      role === "provider" &&
      (!providerName || !providerCategory || !location || !preferredWorkLocation || !phone || !price)
    ) {
      return res.status(400).json({
        message: "Provider name, phone, service category, location, preferred work location, and price are required.",
      });
    }

    if (role === "user" && !String(address || "").trim()) {
      return res.status(400).json({ message: "Address is required for client registration." });
    }

    const normalizedWorkImage = String(workImage || "").trim();
    if (role === "provider" && !isValidProfileImage(normalizedWorkImage)) {
      return res.status(400).json({ message: "Please upload a PNG, JPG, JPEG, or WEBP work photo." });
    }

    if (normalizedWorkImage.length > 1_500_000) {
      return res.status(400).json({ message: "Work photo must be smaller than 1.5 MB." });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail }).select("_id").lean();
    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const registrationKey = getRegistrationKey(normalizedEmail);
    const registrationRecord = registrationOtps.get(registrationKey);

    if (!otp) {
      const registrationOtp = String(randomInt(100000, 1000000));
      const otpResult = await queueOtpByChannel({
        channel: otpChannel,
        email: normalizedEmail,
        phone,
        name,
        otp: registrationOtp,
        purpose: "registration",
      });
      ensureOtpSent(otpResult, otpChannel === "whatsapp" ? "WhatsApp" : otpChannel === "sms" ? "SMS" : "Email");
      registrationOtps.set(registrationKey, {
        otp: otpChannel === "sms" ? "__twilio_verify__" : registrationOtp,
        phone,
        expiresAt: Date.now() + 5 * 60 * 1000,
      });

      return res.status(202).json({
        message: `OTP sent to registered ${otpChannelLabel(otpChannel)}. Use it within 5 minutes.`,
        otpChannel,
        requiresOtp: true,
      });
    }

    if (!registrationRecord || registrationRecord.expiresAt < Date.now()) {
      registrationOtps.delete(registrationKey);
      return res.status(400).json({ message: "Registration OTP expired. Please generate a new OTP." });
    }

    if (registrationRecord.otp === "__twilio_verify__") {
      const smsResult = await verifySmsOtp({ to: registrationRecord.phone || phone, code: otp.trim() });
      if (!smsResult.approved) {
        return res.status(400).json({ message: smsResult.reason || "Invalid registration OTP." });
      }
    } else if (registrationRecord.otp !== otp.trim()) {
      return res.status(400).json({ message: "Invalid registration OTP." });
    }

    const user = await User.create({ name, email: normalizedEmail, password, role, phone, address: role === "user" ? address : "" });
    registrationOtps.delete(registrationKey);

    if (role === "provider") {
      await Provider.create({
        owner: user._id,
        providerCode: `${slugify(providerName)}-${Date.now()}`,
        name: providerName,
        email: normalizedEmail,
        category: providerCategory,
        customCategory: normalizedCategory === "Other" ? providerCategory : "",
        location,
        preferredWorkLocation,
        phone,
        rating: 0,
        reviews: 0,
        responseTime: responseTime || "",
        price,
        description: `${providerName} provides ${providerCategory} services in ${location}.`,
        about: `${providerName} is registered on ServiceHub as a ${providerCategory} provider.`,
        features: [providerCategory],
        profileImage: normalizedWorkImage,
        isActive: false,
        approvalStatus: "pending",
      });
    }

    const token = createToken(user._id);
    queueSession(req, user, token);
    sendWelcomeEmail({ to: normalizedEmail, name, role }).catch(() => {});
    sendWelcomeWhatsApp({ to: phone, name, role }).catch(() => {});

    res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (error) {
    console.error(`Registration failed: ${error.message}`);

    if (error.message.startsWith("Email ") || error.message.startsWith("WhatsApp ") || error.message.startsWith("SMS ")) {
      return res.status(500).json({ message: error.message });
    }

    res.status(500).json({ message: error.message || "Registration failed. Please try again." });
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

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail, role }).select("+password name email phone address profileImage role");
    if (!user) {
      const accountForEmail = await User.findOne({ email: normalizedEmail }).select("role").lean();

      if (role === "user" && accountForEmail?.role === "admin") {
        return res.status(403).json({
          message: "This email is not a client account. Use Admin Login for this email or use Client Login with a registered client email.",
        });
      }

      return res.status(404).json({
        message:
          role === "provider"
            ? "Provider is not registered. Please register first."
            : "User is not registered. Please register first.",
      });
    }

    if (!(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = createToken(user._id);
    queueSession(req, user, token);

    res.json({ token, user: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ message: "Login failed. Please try again." });
  }
});

router.patch("/profile-image", requireAuth, async (req, res) => {
  try {
    const profileImage = String(req.body?.profileImage || "").trim();

    if (!isValidProfileImage(profileImage)) {
      return res.status(400).json({ message: "Please upload a PNG, JPG, JPEG, or WEBP image." });
    }

    if (profileImage.length > 1_500_000) {
      return res.status(400).json({ message: "Profile image must be smaller than 1.5 MB." });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profileImage },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.role === "provider") {
      await Provider.findOneAndUpdate({ owner: user._id }, { profileImage });
    }

    res.json({
      message: profileImage ? "Profile image updated successfully." : "Profile image removed successfully.",
      user: sanitizeUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: "Profile image could not be updated." });
  }
});

const updateProfileHandler = async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    const phone = String(req.body?.phone || "").trim();
    const address = String(req.body?.address || "").trim();

    if (!name || name.length < 2) {
      return res.status(400).json({ message: "Name must be at least 2 characters." });
    }

    if (!phone) {
      return res.status(400).json({ message: "Phone number is required." });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, address },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({ message: "Profile updated successfully.", user: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ message: "Profile could not be updated." });
  }
};

router.patch("/profile", requireAuth, updateProfileHandler);
router.patch("/me", requireAuth, updateProfileHandler);

router.post("/forgot-password/otp", async (req, res) => {
  try {
    const { identifier, role = "user", otpChannel = "email" } = req.body;

    if (!identifier) {
      return res.status(400).json({ message: "Email or mobile number is required." });
    }

    if (!["user", "provider"].includes(role)) {
      return res.status(400).json({ message: "Password reset is available for client and provider accounts only." });
    }

    if (!["email", "whatsapp", "sms"].includes(otpChannel)) {
      return res.status(400).json({ message: "Invalid OTP delivery option." });
    }

    const user = await findResetUser(role, identifier);

    if (!user) {
      return res.status(404).json({ message: "No matching account was found for this email or mobile number." });
    }

    const otp = String(randomInt(100000, 1000000));
    const otpResult = await queueOtpByChannel({
      channel: otpChannel,
      email: user.email,
      phone: user.phone,
      name: user.name,
      otp,
      purpose: "password reset",
    });
    ensureOtpSent(otpResult, otpChannel === "whatsapp" ? "WhatsApp" : otpChannel === "sms" ? "SMS" : "Email");
    passwordResetOtps.set(getResetKey(role, identifier), {
      otp: otpChannel === "sms" ? "__twilio_verify__" : otp,
      resetToken: "",
      userId: user._id.toString(),
      phone: user.phone,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    res.json({
      message: `OTP sent to registered ${otpChannelLabel(otpChannel)}. Use it within 5 minutes.`,
      otpChannel,
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

    if (resetRecord.otp === "__twilio_verify__") {
      const smsResult = await verifySmsOtp({ to: resetRecord.phone, code: otp.trim() });
      if (!smsResult.approved) {
        return res.status(400).json({ message: smsResult.reason || "Invalid OTP." });
      }
    } else if (resetRecord.otp !== otp.trim()) {
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

router.post("/logout", async (req, res) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (token) {
      await Session.updateOne(
        { tokenHash: hashToken(token), status: "active" },
        { $set: { status: "revoked" } }
      );
    }

    res.json({ message: "Logged out successfully." });
  } catch {
    res.json({ message: "Logged out successfully." });
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
    const user = await User.findById(decoded.userId)
      .select("_id name email phone address profileImage role")
      .lean();

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    res.status(401).json({ message: "Session expired. Please log in again." });
  }
});

export default router;
