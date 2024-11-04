import mongoose from "mongoose";

const builtInGuideSchema = new mongoose.Schema({
  uploadBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "auth",
  },

  builtInGuide: {
    type: String,
  },
});

const builtInGuideModel = new mongoose.model(
  "builtInGuide",
  builtInGuideSchema
);

export default builtInGuideModel;
