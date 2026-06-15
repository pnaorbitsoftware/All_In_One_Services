import mongoose from "mongoose";

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
    customCategory: {
      type: String,
      trim: true,
      default: "",
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    preferredWorkLocation: {
      type: String,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    fcmToken: {
      type: String,
      default: "",
      trim: true,
    },
    profileImage: {
      type: String,
      default: "",
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    currentLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: undefined,
      },
      coordinates: {
        type: [Number],
        default: undefined,
      },
      latitude: {
        type: Number,
        default: null,
      },
      longitude: {
        type: Number,
        default: null,
      },
      accuracy: {
        type: Number,
        default: null,
      },
      updatedAt: {
        type: Date,
        default: null,
      },
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
    isActive: {
      type: Boolean,
      default: true,
    },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved",
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
    pendingEarnings: {
      type: Number,
      default: 0,
    },
    paidEarnings: {
      type: Number,
      default: 0,
    },
    bankDetails: {
      accountHolder: {
        type: String,
        trim: true,
        default: "",
      },
      bankName: {
        type: String,
        trim: true,
        default: "",
      },
      accountNumber: {
        type: String,
        trim: true,
        default: "",
      },
      ifscCode: {
        type: String,
        trim: true,
        uppercase: true,
        default: "",
      },
    },
  },
  { collection: "providers", timestamps: true }
);

const Provider = mongoose.model("Provider", providerSchema);

export default Provider;
