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
    finalEstimateAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    estimateStatus: {
      type: String,
      enum: ["not_submitted", "submitted", "accepted", "rejected"],
      default: "not_submitted",
    },
    estimateSubmittedAt: {
      type: Date,
      default: null,
    },
    estimateAcceptedAt: {
      type: Date,
      default: null,
    },
    estimateRejectedAt: {
      type: Date,
      default: null,
    },
    estimateRejectionReason: {
      type: String,
      default: "",
      trim: true,
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "pending", "paid", "failed", "refunded"],
      default: "unpaid",
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
      enum: [
        "pending",
        "accepted",
        "assigned",
        "confirmed",
        "completed",
        "cancelled",
        "Pending",
        "Confirmed",
        "Provider Assigned",
        "On The Way",
        "Arrived",
        "Service Started",
        "Completed",
        "Cancelled",
      ],
      default: "Confirmed",
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
    paymentReference: {
      type: String,
      default: "",
      trim: true,
    },
    paymentOrderId: {
      type: String,
      default: "",
      trim: true,
    },
    paymentGateway: {
      type: String,
      default: "",
      trim: true,
    },
    receiptUrl: {
      type: String,
      default: "",
      trim: true,
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
    adminCommissionPercent: {
      type: Number,
      default: 20,
      min: 0,
      max: 100,
    },
    adminCommissionAmount: {
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
    trackingHistory: [
      {
        status: {
          type: String,
          required: true,
          trim: true,
        },
        title: {
          type: String,
          required: true,
          trim: true,
        },
        description: {
          type: String,
          default: "",
          trim: true,
        },
        updatedBy: {
          type: String,
          enum: ["system", "client", "provider", "admin"],
          default: "system",
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { collection: "bookings", timestamps: true }
);

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;



