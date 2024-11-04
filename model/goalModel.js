import mongoose from "mongoose";
const goalSchema = new mongoose.Schema({
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "auth",
    required: true,
  },
  activityEachWeek: {
    type: Number,
    required: true,
  },
  shotEachWeek: {
    type: Number,
    required: true,
  },
  freeThrowEachWeek: {
    type: Number,
    required: true,
  },
});

const goalModel = mongoose.model("goals", goalSchema);

export default goalModel;
