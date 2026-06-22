import mongoose from "mongoose";

const supportFaqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      default: "General",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  { collection: "supportfaqs", timestamps: true }
);

supportFaqSchema.index({ question: "text", answer: "text", category: "text" });
supportFaqSchema.index({ isActive: 1, sortOrder: 1 });

const SupportFaq = mongoose.model("SupportFaq", supportFaqSchema);

export default SupportFaq;
