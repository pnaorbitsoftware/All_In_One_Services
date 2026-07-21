import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const mongoUri = "mongodb://127.0.0.1:27017/";
const mongoDbName = process.env.MONGO_DB_NAME || "all_in_one_services";

import Booking from "./src/models/Booking.js";
import Provider from "./src/models/Provider.js";
import User from "./src/models/User.js";

async function run() {
  try {
    await mongoose.connect(mongoUri, { dbName: mongoDbName });
    console.log("Connected to DB:", mongoDbName);

    const bookings = await Booking.find().sort({ createdAt: -1 }).lean();
    console.log("=== BOOKINGS ===");
    for (const b of bookings) {
      console.log({
        id: b._id,
        bookingId: b.bookingId,
        service: b.service,
        status: b.status,
        name: b.name,
        assignedProvider: b.assignedProvider,
        requestedProvider: b.requestedProvider,
        createdAt: b.createdAt
      });
    }

    const providers = await Provider.find().lean();
    console.log("=== PROVIDERS ===");
    for (const p of providers) {
      console.log({
        id: p._id,
        name: p.name,
        category: p.category,
        isActive: p.isActive,
        approvalStatus: p.approvalStatus
      });
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error);
  }
}

run();
