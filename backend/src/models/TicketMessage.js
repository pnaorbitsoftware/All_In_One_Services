import mongoose from "mongoose";

const ticketMessageSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      required: true,
      ref: "SupportTicket",
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderRole: {
      type: String,
      enum: ["user", "admin", "internal"], // "internal" is for admin-only internal notes
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    attachment: {
      name: { type: String, default: "" },
      url: { type: String, default: "" }, // Base64 data URI
    },
  },
  { collection: "ticketmessages", timestamps: true }
);

ticketMessageSchema.index({ ticketId: 1 });
ticketMessageSchema.index({ createdAt: 1 });

const TicketMessage = mongoose.model("TicketMessage", ticketMessageSchema);

export default TicketMessage;
