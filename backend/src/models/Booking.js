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

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    service: {
      type: String,
      required: true,
      trim: true,
    },
    preferredDate: {
      type: Date,
      required: true,
    },
    preferredTime: {
      type: String,
      required: true,
      trim: true,
    },
    serviceDuration: {
      type: String,
      required: true,
      enum: [
        "30 min",
        "30 minutes",
        "1 hour",
        "2 hours",
        "3 hours",
        "Half day",
        "Full day",
        "Based on Work Time",
      ],
      default: "1 hour",
    },
    costEstimate: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    addressLocation: {
      type: locationSchema,
      default: () => ({}),
    },
    clientLocationUpdatedAt: {
      type: Date,
      default: null,
    },
    clientLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: undefined,
      },
      coordinates: {
        type: [Number],
        default: undefined,
      },
      address: {
        type: String,
        default: "",
        trim: true,
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
      capturedAt: {
        type: Date,
        default: null,
      },
    },
    providerLocation: {
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
    eta: {
      type: Number,
      default: null,
      min: 0,
    },

    problemDescription: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "assigned",
        "confirmed",
        "on_the_way",
        "en_route",
        "arrived",
        "job_started",
        "completed",
        "cancelled",
        "rejected",
        "Cancelled",
        "Completed",
        "Confirmed",
      ],
      default: "pending",
    },
    trackingEvents: {
      type: [
        {
          status: {
            type: String,
            enum: [
              "accepted",
              "confirmed",
              "assigned",
              "on_the_way",
              "en_route",
              "arrived",
              "job_started",
              "completed",
            ],
            required: true,
          },
          updatedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      default: [],
    },
    assignedProvider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
      default: null,
    },
    requestedProvider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
      default: null,
    },
    rejectedByProviders: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Provider",
        },
      ],
      default: [],
    },
    requestedProviderName: {
      type: String,
      default: "",
      trim: true,
    },
    assignedProviderName: {
      type: String,
      default: "",
      trim: true,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    assignedAt: {
      type: Date,
      default: null,
    },
    cancelledBy: {
      type: String,
      enum: ["", "client", "provider", "admin"],
      default: "",
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancellationReason: {
      type: String,
      default: "",
      trim: true,
    },
    rejectedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: "",
      trim: true,
    },
    adminRejectionReason: {
      type: String,
      default: "",
      trim: true,
    },
    adminRejectedAt: {
      type: Date,
      default: null,
    },
    workImage: {
      type: String,
      default: "",
    },
    completedAt: {
      type: Date,
      default: null,
    },
    clientRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    clientReview: {
      type: String,
      default: "",
      trim: true,
      maxlength: 600,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    clientPaymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded"],
      default: "pending",
    },
    finalEstimateAmount: {
      type: Number,
      default: 0,
    },
    estimateSubmittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
      default: null,
    },
    estimateSubmittedAt: {
      type: Date,
      default: null,
    },
    estimateHistory: {
      type: [
        {
          amount: {
            type: Number,
            required: true,
            min: 0,
          },
          submittedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Provider",
            default: null,
          },
          submittedAt: {
            type: Date,
            required: true,
            default: Date.now,
          },
          status: {
            type: String,
            enum: ["submitted", "accepted", "rejected"],
            required: true,
            default: "submitted",
          },
          statusAt: {
            type: Date,
            default: null,
          },
          note: {
            type: String,
            default: "",
            trim: true,
          },
        },
      ],
      default: [],
    },
    estimateStatus: {
      type: String,
      enum: ["not_submitted", "submitted", "accepted", "rejected"],
      default: "not_submitted",
    },
    paymentStatus: {
      type: String,
      enum: [
        "unpaid",
        "order_created",
        "paid",
        "failed",
        "rejected",
        "penalty_applied",
        "refunded",
        "pending",
      ],
      default: "unpaid",
    },
    razorpayOrderId: {
      type: String,
      default: "",
      trim: true,
    },
    razorpayPaymentId: {
      type: String,
      default: "",
      trim: true,
    },
    providerShare: {
      type: Number,
      default: 0,
    },
    platformFee: {
      type: Number,
      default: 0,
    },
    clientRejectionPenalty: {
      type: Number,
      default: 0,
    },
    paymentCompletedAt: {
      type: Date,
      default: null,
    },
    providerPaymentReleased: {
      type: Boolean,
      default: false,
    },

    providerPaymentReleasedAt: {
      type: Date,
      default: null,
    },
    locationRequested: {
      type: Boolean,
      default: false,
    },
    trackingHistory: [
      {
        status: {
          type: String,
          required: true,
          trim: true,
        },
        title: {
          type: String,
          required: true,
          trim: true,
        },
        description: {
          type: String,
          default: "",
          trim: true,
        },
        updatedBy: {
          type: String,
          enum: ["system", "client", "provider", "admin"],
          default: "system",
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { collection: "bookings", timestamps: true },
);

bookingSchema.index(
  { clientLocation: "2dsphere" },
  {
    partialFilterExpression: {
      "clientLocation.coordinates": { $exists: true },
    },
  },
);
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ assignedProvider: 1, status: 1, createdAt: -1 });
bookingSchema.index({ requestedProvider: 1, status: 1, createdAt: -1 });
bookingSchema.index({ status: 1, assignedProvider: 1, createdAt: -1 });
bookingSchema.index({ status: 1, requestedProvider: 1, service: 1, createdAt: -1 });
bookingSchema.index({ service: 1, status: 1, createdAt: -1 });
bookingSchema.index({ createdAt: -1 });

bookingSchema.pre("validate", function assignPublicBookingId(next) {
  if (!this.bookingId) {
    const randomPart = Math.random().toString(36).slice(2, 7).toUpperCase();
    const timePart = Date.now().toString(36).toUpperCase();
    this.bookingId = `SH-${timePart}-${randomPart}`;
  }

  next();
});

const Booking = mongoose.model("Booking", bookingSchema);

export default Booking;
