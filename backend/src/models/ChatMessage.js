import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },
    bookingId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderRole: {
      type: String,
      enum: ["client", "provider"],
      required: true,
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
  },
  { collection: "chat_messages", timestamps: true }
);

chatMessageSchema.index({ bookingId: 1, createdAt: 1 });

const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);

export default ChatMessage;
