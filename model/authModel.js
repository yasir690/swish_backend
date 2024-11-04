import mongoose from "mongoose";

const authSchema = new mongoose.Schema({
  userName: {
    type: String,
    validate: {
      validator: (value) => /^[A-Za-z\s]+$/.test(value), // Only alphabetic characters and spaces are allowed
    },
  },
  fullName: {
    type: String,
    validate: {
      validator: (value) => /^[A-Za-z\s]+$/.test(value), // Only alphabetic characters and spaces are allowed
    },
  },
  email: {
    type: String,
    required: false,
    match: [
      /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/,
    ],
  },
  password: {
    type: String,
    required: true,
  },
  mobileNumber: {
    type: String,
    required: false,
  },

  otpEmail: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "otp",
  },
  otpVerified: {
    type: Boolean,
    default: false,
  },
  userVerified: {
    type: Boolean,
    default: false,
  },
  userType: {
    type: String,
    enum: ["parent", "child", "admin", "mySelf"],
    required: true,
  },

  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "auth",
  },
  childId: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "auth",
    },
  ],
  isActive: {
    type: Boolean,
    default: false,
  },
  DateOfBirth: {
    type: Date,
  },
  userDisabled: {
    type: Boolean,
    default: false,
  },
  deviceType: {
    type: String,
    enum: ["android", "ios"],
  },
  deviceToken: {
    type: String,
  },
  isEmail: {
    type: Boolean,
    default: true,
  },
  CourtSize: {
    type: String,

    enum: ["Youth Junior and High School", "Women's College", "Men's College"],
  },
  childGoal: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "goals",
    },
  ],
  childAnalytics: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "activityAnalytics",
    },
  ],

  purchase: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "purchase",
    },
  ],

  notificationOnAndOff: {
    type: Boolean,
    default: true,
  },

  isPurchase: {
    type: Boolean,
    default: false,
  },
});

const authModel = mongoose.model("auth", authSchema);

export default authModel;
