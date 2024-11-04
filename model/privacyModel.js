import mongoose from "mongoose";

const privacySchema = new mongoose.Schema({
  privacyPolicy: {
    type: String,
  },
});

const privacyModel = mongoose.model("privacy", privacySchema);
export default privacyModel;
