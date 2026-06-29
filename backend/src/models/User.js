import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    fcmToken: {
      type: String,
      trim: true,
      default: "",
    },
    profileImage: {
      type: String,
      default: "",
    },
    expoPushTokens: {
      type: [String],
      default: [],
    },
    role: {
      type: String,
      enum: ["user", "provider", "admin"],
      default: "user",
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
  },
  { collection: "users", timestamps: true },
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) {
    next();
    return;
  }

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.password);
};

userSchema.index({ role: 1, email: 1 });
userSchema.index({ role: 1, phone: 1 });
userSchema.index({ role: 1, createdAt: -1 });

const User = mongoose.model("User", userSchema);

export default User;
