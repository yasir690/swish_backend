import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "",
    },
    body: {
      type: String,
      default: "",
    },
    authId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "auth",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const notificationModel = mongoose.model("notification", notificationSchema);

export default notificationModel;
