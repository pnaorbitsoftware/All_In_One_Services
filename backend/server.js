import cors from "cors";
import dns from "node:dns";
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
import { getMailStatus } from "./src/services/mailService.js";

dotenv.config();

const app = express();

const port = process.env.PORT || 5000;
const host = process.env.HOST || "0.0.0.0";
const isProduction =
  process.env.NODE_ENV === "production" || Boolean(process.env.RENDER);

const configuredMongoUri =
  process.env.MONGO_URI || "mongodb://localhost:27017/";

const mongoDbName =
  process.env.MONGO_DB_NAME || "all_in_one_services";

const mongoDirectHosts = (process.env.MONGO_DIRECT_HOSTS || "")
  .split(",")
  .map((hostName) => hostName.trim())
  .filter(Boolean);
const mongoReplicaSet = process.env.MONGO_REPLICA_SET || "";
const isConfiguredAtlasSrvUri = configuredMongoUri.startsWith("mongodb+srv://");
const configuredMongoDnsServers = (process.env.MONGO_DNS_SERVERS || "")
  .split(",")
  .map((server) => server.trim())
  .filter(Boolean);
const atlasDnsFallbackServers = ["1.1.1.1", "8.8.8.8", "9.9.9.9"];
const localDnsServers = new Set(["127.0.0.1", "::1", "0.0.0.0"]);
const nodeDnsServers = dns.getServers();
const shouldUseAtlasDnsFallback =
  isConfiguredAtlasSrvUri &&
  !configuredMongoDnsServers.length &&
  (!nodeDnsServers.length || nodeDnsServers.every((server) => localDnsServers.has(server)));
const mongoDnsServers = shouldUseAtlasDnsFallback
  ? atlasDnsFallbackServers
  : configuredMongoDnsServers;

function buildMongoUri(uri) {
  if (!uri.startsWith("mongodb+srv://") || !mongoDirectHosts.length) {
    return uri;
  }

  const authMatch = uri.match(/^mongodb\+srv:\/\/([^@]+)@/i);
  if (!authMatch) return uri;

  const options = new URLSearchParams({
    ssl: "true",
    authSource: "admin",
    retryWrites: "true",
    w: "majority",
  });

  if (mongoReplicaSet) {
    options.set("replicaSet", mongoReplicaSet);
  }

  return `mongodb://${authMatch[1]}@${mongoDirectHosts.join(",")}/${mongoDbName}?${options.toString()}`;
}

const mongoUri = buildMongoUri(configuredMongoUri);
const isAtlasSrvUri = isConfiguredAtlasSrvUri && !mongoDirectHosts.length;
const isAtlasConnection = isConfiguredAtlasSrvUri || mongoUri.includes("mongodb.net");

const mongoOptions = {
  dbName: mongoDbName,
  family: 4,
  serverSelectionTimeoutMS: 15000,
};

function validateEnvironment() {
  const warnings = [];

  if (isProduction && configuredMongoUri.includes("localhost")) {
    throw new Error(
      "MONGO_URI is required for production/Render. Add your MongoDB Atlas connection string in Render Environment."
    );
  }

  if (
    isProduction &&
    (!process.env.JWT_SECRET ||
      process.env.JWT_SECRET === "change_this_secret_before_production" ||
      process.env.JWT_SECRET === "dev_servicehub_secret_change_me")
  ) {
    warnings.push(
      "JWT_SECRET is missing or weak. Set a long random JWT_SECRET in Render Environment."
    );
  }

  if (
    process.env.AUTH_REQUIRE_EMAIL_OTP !== "false" &&
    (!process.env.BREVO_SMTP_USER ||
      !process.env.BREVO_SMTP_KEY ||
      !process.env.MAIL_FROM_EMAIL)
  ) {
    warnings.push(
      "Email OTP is enabled, but Brevo SMTP values are incomplete. Registration OTP emails may fail."
    );
  }

  if (
    process.env.AUTH_REQUIRE_EMAIL_OTP !== "false" &&
    process.env.BREVO_SMTP_KEY &&
    !/^(xkeysib-|xsmtp|x-smtp|smtp)/i.test(process.env.BREVO_SMTP_KEY)
  ) {
    warnings.push(
      "BREVO_SMTP_KEY does not look like a full Brevo SMTP key. Re-copy the complete key from Brevo SMTP settings."
    );
  }

  return warnings;
}

if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

if (isAtlasSrvUri && mongoDnsServers.length) {
  dns.setServers(mongoDnsServers);
}

function maskMongoUri(uri) {
  return uri.replace(
    /(mongodb(?:\+srv)?:\/\/)([^:/@]+)(?::([^@]*))?@/i,
    (_match, scheme, username) => `${scheme}${username}:***@`
  );
}

function getMongoConnectionHelp(error) {
  if (error.message.includes("querySrv")) {
    return [
      "Atlas SRV DNS lookup failed in Node.js.",
      `Node DNS servers: ${dns.getServers().join(", ") || "none"}`,
      "Fix: keep MongoDB Atlas Network Access active. MONGO_DNS_SERVERS is now supported; use 1.1.1.1,8.8.8.8 if local DNS blocks SRV lookup.",
      "Then restart backend with npm start.",
    ];
  }

  if (error.message.includes("bad auth") || error.message.includes("Authentication failed")) {
    return [
      "Atlas authentication failed.",
      "Fix: check Database Access username/password, and URL-encode special characters in the password.",
    ];
  }

  if (error.message.includes("Invalid scheme")) {
    return [
      "MongoDB URI format is invalid.",
      "Fix: MONGO_URI must start with mongodb:// or mongodb+srv://.",
    ];
  }

  if (error.message.includes("ENOTFOUND") || error.message.includes("ETIMEOUT")) {
    return [
      "Atlas host could not be reached from this network.",
      "Fix: check internet, VPN/proxy, firewall, and Atlas Network Access 0.0.0.0/0.",
    ];
  }

  return [
    isAtlasConnection
      ? "Atlas connection failed. Check Network Access, Database Access user, password, and internet/firewall."
      : "Local MongoDB connection failed. Start local MongoDB or switch MONGO_URI to Atlas.",
  ];
}

const configuredCorsOrigins = [
  process.env.CLIENT_URL,
  process.env.CORS_ORIGINS,
]
  .filter(Boolean)
  .flatMap((value) => value.split(","))
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = new Set([
  "http://127.0.0.1:5173",
  "http://localhost:5173",
  ...configuredCorsOrigins,
]);

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

app.get("/", (_req, res) => {
  res.json({
    status: "ok",
    name: "ServiceHub API",
    health: "/api/health",
  });
});

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    environment: isProduction ? "production" : "development",
    databaseName: mongoDbName,
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
    mail: getMailStatus(),
    uptimeSeconds: Math.round(process.uptime()),
  });
});

const requireDatabase = (_req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message:
        isAtlasConnection
          ? "Database is not connected. Check Atlas Network Access, Database Access, and backend DNS settings."
          : "Database is not connected. Start MongoDB on mongodb://localhost:27017/.",
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

app.use("/api", (_req, res) => {
  res.status(404).json({ message: "API route not found." });
});

app.use((error, _req, res, _next) => {
  console.error(error.message);
  res.status(500).json({
    message: "Server error.",
  });
});

const startServer = async () => {
  try {
    validateEnvironment().forEach((warning) => console.warn(`WARN ${warning}`));

    await mongoose.connect(mongoUri, mongoOptions);

    await setupDatabase();

    console.log(
      `Connected to MongoDB: ${maskMongoUri(mongoUri)} database=${mongoDbName}`
    );

    console.log(
      "Collections ready: users, bookings, contactmsgs, categories, providers, services, sessions, sitecontents"
    );

    app.listen(port, host, () => {
      console.log(
        `Auth API running on http://localhost:${port} and http://<your-computer-ip>:${port}`
      );
    });
  } catch (error) {
    console.error(
      `MongoDB connection failed: ${error.message}`
    );
    getMongoConnectionHelp(error).forEach((line) => console.error(line));
    process.exitCode = 1;
  }
};

startServer();
