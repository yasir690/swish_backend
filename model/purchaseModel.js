import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema({
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "auth",
  },

  mySelfId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "auth",
  },

  subscriptionType: {
    type: String,
    enum: ["Monthly", "Annually"],
  },

  subscriptionLevel: {
    type: String,
    enum: [
      "FREE",
      "BASIC", //for 1 user
      "BASIC_PLUS", // for 5 user
      "BASIC_PREMIUM", //for 12 user
    ],
    default: "FREE",
  },

  price: {
    type: Number,
  },
  expirationDate: {
    type: Number,
  },
  purchaseDate: {
    type: Number,
  },
});

const purchaseModel = mongoose.model("purchase", purchaseSchema);

export default purchaseModel;
