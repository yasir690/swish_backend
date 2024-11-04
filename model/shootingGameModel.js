import mongoose from "mongoose";

const shootingGameSchema = new mongoose.Schema({
  authId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "auth",
    required: true,
  },

  gameType: {
    type: String,
    enum: ["Game", "Practice"],
    required: true,
  },

  Method: {
    type: String,
    enum: ["SingleShotEntry", "BulkEntry"],
    required: true,
  },

  playingAt: {
    type: Number,
    required: true,
  },

  makes: {
    type: Number,
    required: false,
  },
  attempts: {
    type: Number,
    required: false,
  },
  shorts: {
    type: String,
  },
  penaltyShorts: {
    type: String,
  },
  freeThrow: {
    type: String,
  },

  spotSelection: [
    {
      spot: {
        type: Number,
        enum: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
        required: true,
      },
      makes: {
        type: Number,
        required: false,
      },
      attempts: {
        type: Number,
        required: false,
      },
      shorts: {
        type: String,
      },
      freeThrow: {
        type: String,
      },
    },
  ],
  penaltySpot: [
    {
      spot: {
        type: Number,

        required: true,
      },
      makes: {
        type: Number,
        required: false,
      },
      attempts: {
        type: Number,
        required: false,
      },
      penaltyShorts: {
        type: String,
      },
      freeThrow: {
        type: String,
      },
    },
  ],
  totalWorkOutTime: {
    type: Number,
    required: false,
  },
});

const shootingGameModel = mongoose.model("shootinggame", shootingGameSchema);

export default shootingGameModel;
