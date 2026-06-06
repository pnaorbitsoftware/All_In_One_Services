import mongoose from "mongoose";

const gpsHistorySchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
      required: true,
      index: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    heading: {
      type: Number,
      default: null,
    },
    speed: {
      type: Number,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { collection: "gps_history", versionKey: false }
);

gpsHistorySchema.index({ location: "2dsphere" });

const GpsHistory = mongoose.model("GpsHistory", gpsHistorySchema);

export default GpsHistory;
