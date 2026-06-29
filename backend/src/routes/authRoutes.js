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
import { normalizeServiceName } from "../utils/serviceMatching.js";

const router = express.Router();
const jwtSecret = process.env.JWT_SECRET || "dev_servicehub_secret_change_me";
const jwtExpire = process.env.JWT_EXPIRE || "7d";
const requireEmailOtpForRegistration =
  process.env.AUTH_REQUIRE_EMAIL_OTP !== "false";
const passwordResetOtps = new Map();
const registrationOtps = new Map();
const mobileLoginOtps = new Map();

const createToken = (userId) =>
  jwt.sign({ userId }, jwtSecret, { expiresIn: jwtExpire });

const hashToken = (token) => createHash("sha256").update(token).digest("hex");

const createSession = (req, userId, token) =>
  Session.create({
    user: userId,
    tokenHash: hashToken(token),
    userAgent: req.get("user-agent") || "",
    ipAddress: req.ip,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

const isGeneratedMobileEmail = (email = "") => /^phone\.\d{10}@servicehub\.local$/i.test(String(email));

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.profileComplete ? user.name : "",
  email: user.profileComplete && !isGeneratedMobileEmail(user.email) ? user.email : "",
  phone: user.phone,
  address: user.address || "",
  avatar: user.avatar || "",
  role: user.role,
  profileComplete: Boolean(user.profileComplete),
  mobileVerified: Boolean(user.mobileVerifiedAt),
});

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const getResetKey = (role, identifier) => `${role}:${identifier.trim().toLowerCase()}`;
const getRegistrationKey = (email) => email.trim().toLowerCase();
const normalizeMobileNumber = (value = "") => String(value).replace(/\D/g, "").slice(-10);
const isValidIndianMobile = (value = "") => /^\d{10}$/.test(normalizeMobileNumber(value));
const getTwilioFromNumber = () =>
  process.env.TWILIO_FROM_NUMBER || process.env.TWILIO_PHONE || "";
const hasTwilioSmsConfig = () =>
  Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      getTwilioFromNumber()
  );
const formatIndiaE164 = (phone) => `+91${normalizeMobileNumber(phone)}`;

const sendTwilioSms = async ({ to, body }) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = getTwilioFromNumber();

  if (!accountSid || !authToken || !from) {
    throw new Error("Twilio SMS is not configured.");
  }

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: to,
        From: from,
        Body: body,
      }),
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Twilio SMS could not be sent.");
  }

  return data;
};

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

  if (mailResult?.failed && mailResult?.message) {
    throw new Error(mailResult.message);
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
      aadhaarCardImage = "",
      aadhaarFrontUrl = "",
      aadhaarDocumentUrl = "",
      otp,
    } = req.body;
    const providerAadhaarImage = aadhaarCardImage || aadhaarFrontUrl || aadhaarDocumentUrl;
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

    if (role === "provider" && (!providerName || !category || !location || !phone || !price || !responseTime || !providerAadhaarImage)) {
      return res.status(400).json({
        message: "Provider name, phone, category, location, price, response time, and Aadhaar card are required.",
      });
    }

    const normalizedProviderCategory = role === "provider" ? normalizeServiceName(category) : "";
    if (role === "provider" && normalizedProviderCategory.trim().length < 2) {
      return res.status(400).json({ message: "Please enter a valid ServiceHub service category." });
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

    const user = await User.create({
      name,
      email: normalizedEmail,
      password,
      role,
      phone,
      address: String(req.body.address || "").trim(),
      profileComplete: true,
    });

    if (role === "provider") {
      await Provider.create({
        owner: user._id,
        providerCode: `${slugify(providerName)}-${Date.now()}`,
        name: providerName,
        email: normalizedEmail,
        category: normalizedProviderCategory,
        location,
        phone,
        rating: 0,
        reviews: 0,
        responseTime,
        price,
        description: `${providerName} provides ${normalizedProviderCategory} services in ${location}.`,
        about: `${providerName} is registered on ServiceHub as a ${normalizedProviderCategory} provider.`,
        features: [normalizedProviderCategory],
        aadhaarCardImage: typeof providerAadhaarImage === "string" ? providerAadhaarImage : "",
        isActive: false,
        approvalStatus: "pending",
        approvedAt: null,
      });
    }

    const token = createToken(user._id);
    await createSession(req, user._id, token);
    await sendWelcomeEmail({ to: normalizedEmail, name, role });

    res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (error) {
    if (error.message.startsWith("Email ") || error.message.startsWith("Brevo ")) {
      return res.status(500).json({ message: error.message });
    }

    res.status(500).json({ message: "Registration failed. Please try again." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password, role = "user" } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    if (!["user", "provider", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid account type." });
    }

    const user = await User.findOne({ email: normalizedEmail }).select("+password");
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

router.post("/mobile-otp/send", async (req, res) => {
  try {
    const phone = normalizeMobileNumber(req.body.phone);

    if (!isValidIndianMobile(phone)) {
      return res.status(400).json({ message: "Enter exactly 10 digit mobile number." });
    }

    const canSendRealSms = hasTwilioSmsConfig();
    const canUseDevOtp =
      process.env.NODE_ENV !== "production" ||
      process.env.ALLOW_DEV_OTP === "true" ||
      Boolean(process.env.MOBILE_OTP_DEV_CODE);

    if (!canSendRealSms && !canUseDevOtp) {
      return res.status(503).json({
        message: "Twilio SMS is not configured. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER or TWILIO_PHONE.",
      });
    }

    const otp = process.env.MOBILE_OTP_DEV_CODE || String(randomInt(100000, 1000000));
    const smsBody = `Your ServiceHub OTP is ${otp}. It is valid for 5 minutes.`;

    if (canSendRealSms) {
      await sendTwilioSms({
        to: formatIndiaE164(phone),
        body: smsBody,
      });
    }

    mobileLoginOtps.set(phone, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
      attempts: 0,
    });

    const payload = {
      message: "OTP sent. Use it within 5 minutes.",
      expiresInSeconds: 300,
    };

    if (!canSendRealSms && canUseDevOtp) {
      payload.devOtp = otp;
    }

    res.json(payload);
  } catch {
    res.status(500).json({ message: "Mobile OTP could not be sent. Please try again." });
  }
});

router.post("/mobile-otp/verify", async (req, res) => {
  try {
    const phone = normalizeMobileNumber(req.body.phone);
    const otp = String(req.body.otp || "").replace(/\D/g, "");

    if (!isValidIndianMobile(phone) || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({ message: "Valid mobile number and 6 digit OTP are required." });
    }

    const otpRecord = mobileLoginOtps.get(phone);

    if (!otpRecord || otpRecord.expiresAt < Date.now()) {
      mobileLoginOtps.delete(phone);
      return res.status(400).json({ message: "OTP expired. Please request a new OTP." });
    }

    if (otpRecord.attempts >= 5) {
      mobileLoginOtps.delete(phone);
      return res.status(429).json({ message: "Too many invalid OTP attempts. Please request a new OTP." });
    }

    if (otpRecord.otp !== otp) {
      mobileLoginOtps.set(phone, { ...otpRecord, attempts: otpRecord.attempts + 1 });
      return res.status(400).json({ message: "Invalid OTP." });
    }

    mobileLoginOtps.delete(phone);

    let user = await User.findOne({ phone, role: "user" });

    if (!user) {
      const email = `phone.${phone}@servicehub.local`;
      user = await User.findOne({ email });
      if (!user) {
        user = await User.create({
          name: "",
          email,
          phone,
          role: "user",
          password: randomBytes(18).toString("hex"),
          profileComplete: false,
          mobileVerifiedAt: new Date(),
        });
      }
    }

    if (!user.mobileVerifiedAt || isGeneratedMobileEmail(user.email)) {
      user.mobileVerifiedAt = new Date();
      if (isGeneratedMobileEmail(user.email)) {
        user.profileComplete = false;
        user.name = "";
      }
      await user.save();
    }

    const token = createToken(user._id);
    await createSession(req, user._id, token);

    res.json({ token, user: sanitizeUser(user), message: "Logged in successfully." });
  } catch {
    res.status(500).json({ message: "OTP verification failed. Please try again." });
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

router.patch("/profile/complete", async (req, res) => {
  try {
    const user = await getTokenUser(req);
    const name = String(req.body.name || "").trim();
    const normalizedEmail = String(req.body.email || "").trim().toLowerCase();
    const address = String(req.body.address || "").trim();

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
    user.profileComplete = true;
    await user.save();

    res.json({ message: "Client profile completed successfully.", user: sanitizeUser(user) });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message || "Client profile could not be completed." });
  }
});

export default router;
