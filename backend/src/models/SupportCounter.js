import mongoose from "mongoose";

const supportCounterSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    sequence: {
      type: Number,
      required: true,
      default: 100000,
    },
  },
  { collection: "supportcounters", timestamps: true }
);

const SupportCounter = mongoose.model("SupportCounter", supportCounterSchema);

export default SupportCounter;
