import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    serviceCode: {
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
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    iconName: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { collection: "services", timestamps: true }
);

serviceSchema.index({ isActive: 1, title: 1 });

const Service = mongoose.model("Service", serviceSchema);

export default Service;
