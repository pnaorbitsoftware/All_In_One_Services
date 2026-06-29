import mongoose from "mongoose";

const locationSchema = new mongoose.Schema(
  {
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    address: { type: String, default: "", trim: true },
    timestamp: { type: Date, default: null },
  },
  { _id: false }
);

const providerSchema = new mongoose.Schema(
  {
    providerCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: "",
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      default: 0,
    },
    reviews: {
      type: Number,
      default: 0,
    },
    responseTime: {
      type: String,
      trim: true,
    },
    price: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    about: {
      type: String,
      trim: true,
    },
    features: {
      type: [String],
      default: [],
    },
    image: {
      type: String,
      default: "",
    },
    aadhaarCardImage: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    availabilityStatus: {
      type: String,
      enum: ["active", "inactive", "absent", "available"],
      default: "available",
    },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    trackingConsent: {
      type: Boolean,
      default: false,
    },
    trackingActive: {
      type: Boolean,
      default: false,
    },
    currentLocation: {
      type: locationSchema,
      default: () => ({}),
    },
  },
  { collection: "providers", timestamps: true }
);

const Provider = mongoose.model("Provider", providerSchema);

export default Provider;
