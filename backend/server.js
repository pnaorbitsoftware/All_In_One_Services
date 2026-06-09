import cors from "cors";
import compression from "compression";
import "dotenv/config";
import express from "express";
import rateLimit from "express-rate-limit";
import http from "node:http";

import authRoutes from "./src/routes/authRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import bookingRoutes from "./src/routes/bookingRoutes.js";
import catalogRoutes from "./src/routes/catalogRoutes.js";
import contactRoutes from "./src/routes/contactRoutes.js";
import locationRoutes from "./src/routes/locationRoutes.js";
import paymentRoutes from "./src/routes/paymentRoutes.js";
import providerRoutes from "./src/routes/providerRoutes.js";
import { connectToDatabase, getDatabaseStatus, mongoDbName, mongoUri } from "./src/database/mongo.js";
import setupDatabase from "./src/database/setupDatabase.js";
import { responseTimeLogger } from "./src/middleware/performance.js";
import { setupTrackingSocket } from "./src/socket/trackingSocket.js";

const app = express();

const port = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === "production";

//
// ✅ FIXED CORS CONFIG (PRODUCTION READY)
//
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "https://servicehub.aparaitech.org",
  "https://www.servicehub.aparaitech.org",
  process.env.CLIENT_URL // optional from env
].filter(Boolean);
const allowedOriginSet = new Set(allowedOrigins);

const corsOptions = {
  origin: function (origin, callback) {
    // allow Postman or server-to-server
    if (!origin) return callback(null, true);

    // exact match
    if (allowedOriginSet.has(origin)) {
      return callback(null, true);
    }

    // allow localhost variations
    if (
      origin.includes("localhost") ||
      origin.includes("127.0.0.1")
    ) {
      return callback(null, true);
    }

    console.error("❌ Blocked by CORS:", origin);
    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true,
  maxAge: 86400,
};

app.set("trust proxy", 1);
app.use(cors(corsOptions));
app.use(responseTimeLogger);
app.use(compression());
app.use(express.json({ limit: "10mb" }));

const authLimiter = rateLimit({
  windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  limit: Number(process.env.AUTH_RATE_LIMIT_MAX || 30),
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) =>
    [
      "/api/auth/register",
      "/api/auth/registration-status",
      "/api/auth/logout",
      "/api/auth/me",
      "/api/auth/whatsapp/status",
    ].includes(req.originalUrl.split("?")[0]),
  message: { message: "Too many authentication attempts. Please try again shortly." },
});

const passwordRecoveryLimiter = rateLimit({
  windowMs: Number(process.env.PASSWORD_RECOVERY_RATE_LIMIT_WINDOW_MS || 10 * 60 * 1000),
  limit: Number(process.env.PASSWORD_RECOVERY_RATE_LIMIT_MAX || 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many password recovery attempts. Please try again shortly." },
});

//
// Health check
//
app.get("/api/health", (_req, res) => {
  const dbStatus = getDatabaseStatus();
  res.json({
    status: "ok",
    uptimeSeconds: Math.round(process.uptime()),
    databaseName: mongoDbName,
    database: dbStatus.connected ? "connected" : "disconnected",
  });
});

//
// Middleware: DB check
//
const requireDatabase = (_req, res, next) => {
  if (!getDatabaseStatus().connected) {
    return res.status(503).json({
      message:
        "Database is not connected. Start MongoDB or check connection.",
    });
  }
  next();
};

//
// Routes
//
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/forgot-password", passwordRecoveryLimiter);
app.use("/api/auth/reset-password", passwordRecoveryLimiter);
app.use("/api/auth", requireDatabase, authRoutes);
app.use("/api/admin", requireDatabase, adminRoutes);
app.use("/api/bookings", requireDatabase, bookingRoutes);
app.use("/api/contact", requireDatabase, contactRoutes);
app.use("/api/catalog", requireDatabase, catalogRoutes);
app.use("/api/location", requireDatabase, locationRoutes);
app.use("/api/payments", requireDatabase, paymentRoutes);
app.use("/api/providers", requireDatabase, providerRoutes);

app.use("/api", (_req, res) => {
  res.status(404).json({ message: "API route not found." });
});

const runStartupMaintenance = async () => {
  if (isProduction && process.env.RUN_STARTUP_MAINTENANCE !== "true") {
    console.log("Startup database maintenance skipped in production.");
    return;
  }

  const startedAt = Date.now();
  await setupDatabase();
  console.log(`Startup database maintenance completed in ${Date.now() - startedAt}ms`);
};

const startServer = async () => {
  try {
    const connectedAt = Date.now();
    await connectToDatabase();

    console.log(
      `Connected to MongoDB: ${mongoUri}${mongoDbName} in ${Date.now() - connectedAt}ms`
    );

    const server = http.createServer(app);
    server.keepAliveTimeout = Number(process.env.SERVER_KEEP_ALIVE_TIMEOUT_MS || 65000);
    server.headersTimeout = Number(process.env.SERVER_HEADERS_TIMEOUT_MS || 66000);
    server.requestTimeout = Number(process.env.SERVER_REQUEST_TIMEOUT_MS || 30000);

    const io = await setupTrackingSocket(server, corsOptions);
    app.set("io", io);

    server.listen(port, () => {
      console.log(
        `Server running on http://localhost:${port}`
      );
    });

    runStartupMaintenance().catch((error) => {
      console.warn(`Startup database maintenance failed: ${error.message}`);
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`Port ${port} already in use`);
      } else {
        console.error(`Server error: ${error.message}`);
      }
    });
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
  }
};

startServer();
