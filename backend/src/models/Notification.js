import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "provider", "admin"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      trim: true,
      default: "support",
    },
    ticketId: {
      type: String,
      trim: true,
      default: "",
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { collection: "notifications", timestamps: true }
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ role: 1, createdAt: -1 });
notificationSchema.index({ ticketId: 1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
