import mongoose from "mongoose";

const ledgerSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      default: null,
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
      default: null,
    },
    type: {
      type: String,
      enum: ["payment_received", "provider_credit", "platform_fee", "client_penalty", "refund", "payout", "provider_withdrawal"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    direction: {
      type: String,
      enum: ["credit", "debit"],
      required: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "completed",
    },
    metadata: {
      type: Object,
      default: () => ({}),
    },
  },
  { collection: "ledgers", timestamps: true }
);

ledgerSchema.index({ booking: 1 });
ledgerSchema.index({ payment: 1 });
ledgerSchema.index({ user: 1 });
ledgerSchema.index({ provider: 1 });
ledgerSchema.index({ provider: 1, type: 1, status: 1 });
ledgerSchema.index({ provider: 1, type: 1, status: 1, createdAt: -1 });
ledgerSchema.index({ type: 1 });

const Ledger = mongoose.model("Ledger", ledgerSchema);

export default Ledger;
