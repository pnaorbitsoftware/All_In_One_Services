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

const allowedOrigins = new Set([
  "http://127.0.0.1:5173",
  "http://localhost:5173",
  process.env.CLIENT_URL,
].filter(Boolean));

const isAllowedDevOrigin = (origin) => {
  try {
    const url = new URL(origin);
    return ["127.0.0.1", "localhost"].includes(url.hostname);
  } catch {
    return false;
  }
};

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin) || isAllowedDevOrigin(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} is not allowed by CORS.`));
  },
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json({ limit: "10mb" }));

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

const requireDatabase = (_req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message:
        "Database is not connected. Start MongoDB on mongodb://localhost:27017/.",
    });
  }

  next();
};

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

const startServer = async () => {
  try {
    await mongoose.connect(mongoUri, mongoOptions);

    await setupDatabase();

    console.log(
      `Connected to MongoDB: ${mongoUri}${mongoDbName}`
    );

    console.log(
      "Collections ready: users, bookings, gps_history, chat_messages, payments, ledgers, contactmsgs, categories, providers, services, sessions, sitecontents"
    );

    const server = http.createServer(app);
    const io = await setupTrackingSocket(server, corsOptions);
    app.set("io", io);

    server.listen(port, () => {
      console.log(
        `Auth, payment, and tracking API running on http://localhost:${port}`
      );
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(
          `Port ${port} is already in use. Stop the running backend or set a different PORT.`
        );
        return;
      }

      console.error(`Server failed to start: ${error.message}`);
    });
  } catch (error) {
    console.error(
      `MongoDB connection failed: ${error.message}`
    );
    console.error(
      "Start MongoDB locally, then restart the backend."
    );
  }
};

startServer();
