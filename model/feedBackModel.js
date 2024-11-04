import mongoose from "mongoose";

const feedBackSchema = new mongoose.Schema({
  feedback: {
    type: String,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "auth",
  },
});

const feedbackModel = mongoose.model("feedback", feedBackSchema);

export default feedbackModel;
