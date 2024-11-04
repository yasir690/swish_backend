import mongoose from "mongoose";

const shootingHistorySchema = new mongoose.Schema({
  spotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "shootinggame",
  },
  penaltyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "shootinggame",
  },
  authId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "auth",
  },
  workoutTime: {
    type: Number,
  },
  sessionTime: {
    type: Number,
  },
  totalSpotMakes: {
    type: Number,
  },
  totalSpotAttempt: {
    type: Number,
  },
  totalPenaltyMakes: {
    type: Number,
  },
  totalPenaltyAttempt: {
    type: Number,
  },
  totalWorkOutTime: {
    type: Number,
  },
  Method: {
    type: String,
  },
  gameType: {
    type: String,
  },
  totalSpotSuccess: {
    type: String,
  },
  totalPenaltySuccess: {
    type: String,
  },
});

const shootingHistoryModel = mongoose.model(
  "shootinghistory",
  shootingHistorySchema
);

export default shootingHistoryModel;
