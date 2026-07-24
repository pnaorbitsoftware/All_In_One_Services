import "dotenv/config";
import mongoose from "mongoose";


import Booking from "./src/models/Booking.js";
import Provider from "./src/models/Provider.js";
import User from "./src/models/User.js";

import { connectToDatabase, mongoUri, mongoDbName } from "./src/database/mongo.js";

async function run() {
  try {
    console.log("URI:", mongoUri);
    console.log("DB Name:", mongoDbName);
    await connectToDatabase();
    console.log("Connected to DB");

    console.log("=== BOOKINGS ===");
    const bookings = await Booking.find({
      status: { $in: ["pending", "accepted", "confirmed", "Confirmed", "assigned"] }
    }).sort({ createdAt: -1 }).limit(10).lean();
    for (const b of bookings) {
      console.log(JSON.stringify(b, null, 2));
    }



    await mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error);
  }
}

run();
