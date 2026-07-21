import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      expires: 0,
    },
    status: {
      type: String,
      enum: ["active", "expired", "revoked"],
      default: "active",
    },
  },
  { collection: "sessions", timestamps: true }
);

sessionSchema.index({ user: 1, status: 1, expiresAt: 1 });

const Session = mongoose.model("Session", sessionSchema);

export default Session;
