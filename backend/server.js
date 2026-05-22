import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";

import authRoutes from "./src/routes/authRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import bookingRoutes from "./src/routes/bookingRoutes.js";
import catalogRoutes from "./src/routes/catalogRoutes.js";
import contactRoutes from "./src/routes/contactRoutes.js";
import providerRoutes from "./src/routes/providerRoutes.js";
import setupDatabase from "./src/database/setupDatabase.js";

dotenv.config();

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

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin) || isAllowedDevOrigin(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`Origin ${origin} is not allowed by CORS.`));
    },
    credentials: true,
  })
);

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

app.use("/api/providers", requireDatabase, providerRoutes);

const startServer = async () => {
  try {
    await mongoose.connect(mongoUri, mongoOptions);

    await setupDatabase();

    console.log(
      `Connected to MongoDB: ${mongoUri}${mongoDbName}`
    );

    console.log(
      "Collections ready: users, bookings, contactmsgs, categories, providers, services, sessions, sitecontents"
    );

    app.listen(port, () => {
      console.log(
        `Auth API running on http://localhost:${port}`
      );
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