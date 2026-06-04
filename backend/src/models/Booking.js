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
      enum: ["30 minutes", "1 hour", "2 hours", "3 hours", "Half day", "Full day", "Based on Work Time"],
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
    problemDescription: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "assigned", "confirmed", "completed", "cancelled"],
      default: "pending",
    },
    assignedProvider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
      default: null,
    },
    requestedProvider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
      default: null,
    },
    requestedProviderName: {
      type: String,
      default: "",
      trim: true,
    },
    assignedProviderName: {
      type: String,
      default: "",
      trim: true,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    assignedAt: {
      type: Date,
      default: null,
    },
    cancelledBy: {
      type: String,
      enum: ["", "client", "provider", "admin"],
      default: "",
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancellationReason: {
      type: String,
      default: "",
      trim: true,
    },
    workImage: {
      type: String,
      default: "",
    },
    completedAt: {
      type: Date,
      default: null,
    },
    clientPaymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded"],
      default: "pending",
    },
    clientPaidAt: {
      type: Date,
      default: null,
    },
    adminPayoutStatus: {
      type: String,
      enum: ["not_ready", "pending", "released"],
      default: "not_ready",
    },
    providerSharePercent: {
      type: Number,
      default: 80,
      min: 0,
      max: 100,
    },
    providerPayoutAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    providerWithdrawnAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    adminPayoutReleasedAt: {
      type: Date,
      default: null,
    },
    adminPayoutNote: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { collection: "bookings", timestamps: true }
);

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
