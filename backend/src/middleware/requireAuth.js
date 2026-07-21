import jwt from "jsonwebtoken";
import { createHash } from "node:crypto";
import { jwtSecret } from "../config/auth.js";
import Session from "../models/Session.js";
import User from "../models/User.js";

const hashToken = (token) => createHash("sha256").update(token).digest("hex");
const authCache = new Map();
const authCacheTtlMs = Number(process.env.AUTH_CACHE_TTL_MS || 5 * 60_000);
const authCacheMaxEntries = Number(process.env.AUTH_CACHE_MAX_ENTRIES || 1_000);

const cacheAuthenticatedUser = (tokenHash, userId, user) => {
  if (authCache.size >= authCacheMaxEntries) {
    authCache.delete(authCache.keys().next().value);
  }
  authCache.set(tokenHash, {
    userId: String(userId),
    user,
    expiresAt: Date.now() + authCacheTtlMs,
  });
};

export const invalidateAuthToken = (token) => {
  if (token) authCache.delete(hashToken(token));
};

export const invalidateAuthUser = (userId) => {
  const normalizedUserId = String(userId);
  for (const [tokenHash, entry] of authCache) {
    if (entry.userId === normalizedUserId) authCache.delete(tokenHash);
  }
};

export default async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Please log in to continue." });
    }

    const decoded = jwt.verify(token, jwtSecret);
    const tokenHash = hashToken(token);
    const cachedSession = authCache.get(tokenHash);

    if (cachedSession?.expiresAt > Date.now() && cachedSession.userId === String(decoded.userId)) {
      req.user = cachedSession.user;
      next();
      return;
    }

    if (cachedSession) authCache.delete(tokenHash);
    const activeSession = await Session.findOne({
      tokenHash,
      status: "active",
      expiresAt: { $gt: new Date() },
    }).lean();

    if (!activeSession || String(activeSession.user) !== String(decoded.userId)) {
      return res.status(401).json({ message: "Session expired. Please log in again." });
    }

    const user = await User.findById(activeSession.user);

    if (!user) {
      return res.status(401).json({ message: "Please log in again." });
    }

    req.user = user;
    cacheAuthenticatedUser(tokenHash, decoded.userId, user);
    next();
  } catch (error) {
    res.status(401).json({ message: "Session expired. Please log in again." });
  }
}

