import "dotenv/config";
import mongoose from "mongoose";
import { connectToDatabase } from "./src/database/mongo.js";
import Booking from "./src/models/Booking.js";

async function run() {
  try {
    await connectToDatabase();
    console.log("Connected to DB");

    const b = await Booking.create({
      user: new mongoose.Types.ObjectId(),
      userName: "Test User",
      userEmail: "test@example.com",
      name: "Test User",
      phone: "1234567890",
      service: "Plumber",
      address: "Test Address",
      problemDescription: "Test problem description",
      preferredDate: new Date(),
      preferredTime: "10:00",
      serviceDuration: "1 hour",
      costEstimate: 299
    });

    console.log("Created booking status in Mongoose model:", b.status);

    const raw = await mongoose.connection.db.collection("bookings").findOne({ _id: b._id });
    console.log("Raw booking status in MongoDB:", raw.status);

    await Booking.deleteOne({ _id: b._id });
    await mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error);
  }
}

run();
