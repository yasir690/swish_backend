import mongoose from "mongoose";

const librarySchema = new mongoose.Schema({
  video: [
    {
      title: {
        type: String,
        default: "",
      },
      url: {
        type: String,
        default: "",
      },
    },
  ],
  category: {
    type: String,
    enum: [
      "dribbling",
      "shooting",
      "passing",
      "rebounding",
      "defense",
      "speed",
      "mentalStrength",
    ],
  },
  videoUploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "auth",
  },
});

const libraryModel = mongoose.model("library", librarySchema);

export default libraryModel;
