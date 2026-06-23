import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    categoryCode: {
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
    iconName: {
      type: String,
      required: true,
      trim: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { collection: "categories", timestamps: true }
);

categorySchema.index({ isActive: 1, displayOrder: 1, title: 1 });

const Category = mongoose.model("Category", categorySchema);

export default Category;
