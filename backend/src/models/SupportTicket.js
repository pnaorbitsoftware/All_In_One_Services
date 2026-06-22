import mongoose from "mongoose";

const supportTicketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    ticketNumber: {
      type: String,
      trim: true,
      default: "",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "provider"],
      required: true,
      default: "user",
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
    userPhone: {
      type: String,
      trim: true,
      default: "",
    },
    subject: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Technical Issue",
        "Payment Issue",
        "Service Issue",
        "Account Issue",
        "Other",
      ],
    },
    priority: {
      type: String,
      required: true,
      enum: ["Low", "Medium", "High"],
    },
    status: {
      type: String,
      enum: ["Open", "In Progress", "Resolved", "Closed"],
      default: "Open",
    },
    adminResponse: {
      type: String,
      trim: true,
      default: "",
    },
    adminRespondedAt: {
      type: Date,
      default: null,
    },
    adminRespondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    attachments: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    bookingId: {
      type: String,
      default: "",
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  { collection: "supporttickets", timestamps: true }
);

supportTicketSchema.index({ userId: 1 });
supportTicketSchema.index({ role: 1 });
supportTicketSchema.index({ status: 1 });
supportTicketSchema.index({ category: 1 });
supportTicketSchema.index({ priority: 1 });
supportTicketSchema.index({ createdAt: -1 });

const SupportTicket = mongoose.model("SupportTicket", supportTicketSchema);

export default SupportTicket;
