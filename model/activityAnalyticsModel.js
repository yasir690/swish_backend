import mongoose from "mongoose";
const activitySchema = new mongoose.Schema({
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "auth",
    required: false,
  },
  goalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "goals",
  },
  shootingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "shootinggame",
  },
  goalCreatedAt: {
    type: Number,
  },
  shootingCreatedAt: {
    type: Number,
  },
});

const activityModel = mongoose.model("activityAnalytics", activitySchema);

export default activityModel;
