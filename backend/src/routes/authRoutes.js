import express from "express";
import jwt from "jsonwebtoken";
import { createHash, randomBytes, randomInt } from "node:crypto";

import { jwtSecret } from "../config/auth.js";
import requireAuth, { invalidateAuthToken, invalidateAuthUser } from "../middleware/requireAuth.js";
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
import { normalizeServiceName } from "../utils/serviceMatching.js";

const router = express.Router();
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

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  address: user.address || "",
  profileImage: user.profileImage || "",
  currentLocation: user.currentLocation || {},
  avatar: user.avatar || "",
  role: user.role,
});

const isValidProfileImage = (value) => {
  if (value === "") return true;
  return /^data:image\/(png|jpe?g|webp);base64,[a-z0-9+/=\s]+$/i.test(value);
};

const identityDocumentPattern = /^data:(?:image\/(?:png|jpe?g|webp)|application\/pdf);base64,[a-z0-9+/=\s]+$/i;
const maxIdentityDocumentLength = 3_000_000;

const isValidIdentityDocument = (value) =>
  identityDocumentPattern.test(value) && value.length <= maxIdentityDocumentLength;

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

    const accountForEmail = await User.findOne({ email }).select("_id role").lean();
    const user = accountForEmail?.role === role ? accountForEmail : null;

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
      aadhaarCardImage = "",
      aadhaarFrontUrl = "",
      aadhaarDocumentUrl = "",
      aadhaarNumber = "",
      otp,
    } = req.body;
    const providerAadhaarImage = aadhaarCardImage || aadhaarFrontUrl || aadhaarDocumentUrl;
    const normalizedAadhaarNumber = String(aadhaarNumber || "").replace(/\D/g, "");
    const normalizedEmail = email?.trim().toLowerCase();

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

    if (role === "provider" && (!providerName || !category || !location || !phone || !price || !responseTime || !providerAadhaarImage || normalizedAadhaarNumber.length !== 12)) {
      return res.status(400).json({
        message: "Provider name, phone, category, location, price, response time, 12-digit Aadhaar number, and Aadhaar card are required.",
      });
    }

    const submittedProviderCategory = category === "Other" ? customCategory : category;
    const normalizedProviderCategory = role === "provider" ? normalizeServiceName(submittedProviderCategory) : "";
    if (role === "provider" && normalizedProviderCategory.trim().length < 2) {
      return res.status(400).json({ message: "Please enter a valid ServiceHub service category." });
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
          registrationBody: { ...req.body },
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

      const registrationBody = {
        ...(registrationRecord.registrationBody || {}),
        ...req.body,
      };

      let aadhaarDigits = "";
      let aadhaarFrontUrl = "";
      let aadhaarBackUrl = "";
      if (role === "provider") {
        aadhaarDigits = String(registrationBody.aadhaarNumber || "").replace(/\D/g, "");
        aadhaarFrontUrl = registrationBody.aadhaarFrontUrl || registrationBody.aadhaarDocumentUrl || registrationBody.aadhaarCardImage || "";
        aadhaarBackUrl = registrationBody.aadhaarBackUrl || "";

      if (aadhaarDigits.length !== 12) {
        return res.status(400).json({ message: "Valid 12-digit Aadhaar number is required for provider registration." });
      }

      if (!aadhaarFrontUrl) {
        return res.status(400).json({ message: "Aadhaar front image or PDF upload is required for provider registration." });
      }

      if (!isValidIdentityDocument(aadhaarFrontUrl)) {
        return res.status(400).json({ message: "Aadhaar front document must be a PNG, JPG, WEBP, or PDF smaller than 2 MB." });
      }

      if (aadhaarBackUrl && !isValidIdentityDocument(aadhaarBackUrl)) {
        return res.status(400).json({ message: "Aadhaar back document must be a PNG, JPG, WEBP, or PDF smaller than 2 MB." });
      }
    }

    const user = await User.create({ name, email: normalizedEmail, password, role, phone, address: role === "user" ? address : "" });
    registrationOtps.delete(registrationKey);

    if (role === "provider") {
      await Provider.create({
        owner: user._id,
        providerCode: `${slugify(providerName)}-${Date.now()}`,
        name: providerName,
        businessName: providerName,
        ownerName: name,
        email: normalizedEmail,
        category: providerCategory,
        customCategory: normalizedCategory === "Other" ? providerCategory : "",
        location,
        preferredWorkLocation,
        phone,
        aadhaarNumberMasked: `XXXX XXXX ${aadhaarDigits.slice(-4)}`,
        aadhaarFrontUrl,
        aadhaarBackUrl,
        aadhaarDocumentName: registrationBody.aadhaarDocumentName || "",
        aadhaarBackDocumentName: registrationBody.aadhaarBackDocumentName || "",
        aadhaarFrontUploadedAt: new Date(),
        aadhaarBackUploadedAt: aadhaarBackUrl ? new Date() : null,
        verificationStatus: "pending",
        requestedAt: new Date(),
        rating: 0,
        reviews: 0,
        responseTime: responseTime || "",
        price,
        description: `${providerName} provides ${providerCategory} services in ${location}.`,
        about: `${providerName} is registered on ServiceHub as a ${providerCategory} provider.`,
        features: [providerCategory],
        profileImage: normalizedWorkImage,
        aadhaarCardImage: aadhaarFrontUrl,
        aadhaarNumber: aadhaarDigits,
        isActive: false,
        approvalStatus: "pending",
      });
    }

    const token = createToken(user._id);
    await createSession(req, user, token);
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
    await createSession(req, user, token);

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
    invalidateAuthUser(user._id);
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
      invalidateAuthToken(token);
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

const getAuthenticatedProfile = (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
};

router.get("/profile", requireAuth, getAuthenticatedProfile);
router.get("/me", requireAuth, getAuthenticatedProfile);

router.patch("/profile", requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const { name, email, phone = "", avatar = "", address = "", currentLocation = null } = req.body;
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
    user.phone = user.mobileVerifiedAt ? user.phone : phone.trim();
    user.address = String(address || "").trim();
    user.currentLocation = currentLocation && typeof currentLocation === "object" ? currentLocation : user.currentLocation || {};
    user.avatar = typeof avatar === "string" ? avatar : "";
    if (user.role === "user") user.profileComplete = true;
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

router.patch("/profile-image", requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const profileImage = typeof req.body.profileImage === "string" ? req.body.profileImage : "";

    user.avatar = profileImage;
    await user.save();

    if (user.role === "provider") {
      const provider = await Provider.findOne({ owner: user._id });

      if (provider) {
        provider.image = profileImage;
        await provider.save();
      }
    }

    res.json({ message: "Profile image updated successfully.", user: sanitizeUser(user) });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || "Profile image could not be updated." });
  }
});

router.patch("/profile/complete", requireAuth, async (req, res) => {
  try {
    const user = req.user;
    const name = String(req.body.name || "").trim();
    const normalizedEmail = String(req.body.email || "").trim().toLowerCase();
    const address = String(req.body.address || "").trim();
    const currentLocation = req.body.currentLocation;

    if (user.role !== "user") {
      return res.status(403).json({ message: "Client profile completion is available only for client accounts." });
    }

    if (!user.mobileVerifiedAt || !/^\d{10}$/.test(String(user.phone || ""))) {
      return res.status(403).json({ message: "Verify your mobile number before completing the client profile." });
    }

    if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(normalizedEmail) || address.length < 5) {
      return res.status(400).json({ message: "Enter your real name, a valid email, and complete service address." });
    }

    const existingUser = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } });
    if (existingUser) {
      return res.status(409).json({ message: "This email is already used by another account." });
    }

    user.name = name;
    user.email = normalizedEmail;
    user.address = address;
    user.avatar = typeof req.body.avatar === "string" ? req.body.avatar : user.avatar || "";
    user.currentLocation = currentLocation && typeof currentLocation === "object" ? currentLocation : user.currentLocation || {};
    user.profileComplete = true;
    await user.save();

    res.json({ message: "Client profile completed successfully.", user: sanitizeUser(user) });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || "Client profile could not be completed." });
  }
});

export default router;
