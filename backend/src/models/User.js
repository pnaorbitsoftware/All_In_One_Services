import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const getBcryptSaltRounds = () => {
  const rounds = Number(process.env.BCRYPT_SALT_ROUNDS || 12);
  return Number.isInteger(rounds) && rounds >= 4 ? rounds : 12;
};

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "",
      trim: true,
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
    avatar: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    profileComplete: {
      type: Boolean,
      default: false,
      index: true,
    },
    mobileVerifiedAt: {
      type: Date,
      default: null,
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

  this.password = await bcrypt.hash(this.password, getBcryptSaltRounds());
  next();
});

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
