import mongoose from "mongoose";
const otpSchema = new mongoose.Schema(
  {
    auth: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "auth",
    },
    otpKey: {
      type: String,
      required: true,
    },
    otpUsed: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      default: Date.now,
      index: { expires: "1h" }, // TTL index that expires after 1 hour
    },
  },
  {
    timestamps: true,
  }
);

const otpModel = mongoose.model("otp", otpSchema);
export default otpModel;
