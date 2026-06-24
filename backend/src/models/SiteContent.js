import mongoose from "mongoose";

const siteContentSchema = new mongoose.Schema(
  {
    sectionKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
      default: "",
    },
    body: {
      type: String,
      trim: true,
      default: "",
    },
    items: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { collection: "sitecontents", timestamps: true }
);

siteContentSchema.index({ isActive: 1, sectionKey: 1 });

const SiteContent = mongoose.model("SiteContent", siteContentSchema);

export default SiteContent;
