import cors from "cors";
import "dotenv/config";
import express from "express";
import http from "node:http";
import mongoose from "mongoose";

import authRoutes from "./src/routes/authRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import bookingRoutes from "./src/routes/bookingRoutes.js";
import catalogRoutes from "./src/routes/catalogRoutes.js";
import contactRoutes from "./src/routes/contactRoutes.js";
import locationRoutes from "./src/routes/locationRoutes.js";
import paymentRoutes from "./src/routes/paymentRoutes.js";
import providerRoutes from "./src/routes/providerRoutes.js";
import setupDatabase from "./src/database/setupDatabase.js";
import { setupTrackingSocket } from "./src/socket/trackingSocket.js";

const app = express();

const port = process.env.PORT || 5000;

const mongoUri =
  process.env.MONGO_URI || "mongodb://localhost:27017/";

const mongoDbName =
  process.env.MONGO_DB_NAME || "all_in_one_services";

const mongoOptions = {
  dbName: mongoDbName,
  serverSelectionTimeoutMS: 5000,
};

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

const corsOptions = {
  origin: function (origin, callback) {
    // allow Postman or server-to-server
    if (!origin) return callback(null, true);

    // exact match
    if (allowedOrigins.includes(origin)) {
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
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));

//
// Health check
//
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    databaseName: mongoDbName,
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
  });
});

//
// Middleware: DB check
//
const requireDatabase = (_req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
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

//
// Start Server
//
const startServer = async () => {
  try {
    await mongoose.connect(mongoUri, mongoOptions);

    await setupDatabase();

    console.log(
      `Connected to MongoDB: ${mongoUri}${mongoDbName}`
    );

    const server = http.createServer(app);
    const io = await setupTrackingSocket(server, corsOptions);
    app.set("io", io);

    server.listen(port, () => {
      console.log(
        `Server running on http://localhost:${port}`
      );
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