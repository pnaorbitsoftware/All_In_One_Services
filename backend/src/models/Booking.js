import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    userEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    service: {
      type: String,
      required: true,
      trim: true,
    },
    preferredDate: {
      type: Date,
      required: true,
    },
    preferredTime: {
      type: String,
      required: true,
      trim: true,
    },
    serviceDuration: {
      type: String,
      required: true,
      enum: ["30 minutes", "1 hour", "2 hours", "3 hours", "Half day", "Full day"],
      default: "1 hour",
    },
    costEstimate: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },
    workImage: {
      type: String,
      default: "",
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { collection: "bookings", timestamps: true }
);

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
