import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
      default: null,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
      trim: true,
    },
    razorpayOrderId: {
      type: String,
      default: "",
      trim: true,
    },
    razorpayPaymentId: {
      type: String,
      default: "",
      trim: true,
    },
    razorpaySignature: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "order_created", "paid", "failed", "rejected", "penalty_applied", "refunded"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      default: "razorpay",
      trim: true,
    },
    providerShare: {
      type: Number,
      default: 0,
    },
    platformFee: {
      type: Number,
      default: 0,
    },
    platformFeePercentage: {
      type: Number,
      default: 20,
    },
    providerSharePercentage: {
      type: Number,
      default: 80,
    },
    penaltyAmount: {
      type: Number,
      default: 0,
    },
    rejectionReason: {
      type: String,
      default: "",
      trim: true,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    failedAt: {
      type: Date,
      default: null,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    metadata: {
      type: Object,
      default: () => ({}),
    },
  },
  { collection: "payments", timestamps: true }
);

paymentSchema.index({ booking: 1 });
paymentSchema.index({ user: 1 });
paymentSchema.index({ provider: 1 });
paymentSchema.index({ provider: 1, status: 1 });
paymentSchema.index({ provider: 1, status: 1, paidAt: -1 });
paymentSchema.index({ razorpayOrderId: 1 });
paymentSchema.index({ razorpayPaymentId: 1 });
paymentSchema.index({ status: 1 });

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
