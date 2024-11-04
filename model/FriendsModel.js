import mongoose from "mongoose";

const friendSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "auth",
  },
  friendId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "auth",
  },

  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },
});

const friendModel = mongoose.model("friends", friendSchema);

export default friendModel;
