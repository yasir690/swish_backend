import authModel from "../model/authModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { handleMultiPartData } from "../utils/multiPartData.js";
import { sendEmails } from "../utils/sendEmail.js";
import { randomInt } from "crypto";
import otpModel from "../model/otpModel.js";
// import { loggerInfo, loggerError } from "../utils/log.js";
import { uploadFileWithFolder } from "../utils/awsFileUpload.js";
//user register
import serverless from "serverless-http";
import purchaseModel from "../model/purchaseModel.js";

import activityModel from "../model/activityAnalyticsModel.js";
import feedbackModel from "../model/feedBackModel.js";
import mongoose from "mongoose";

//user register

export const userRegister = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      mobileNumber,
      userType,
      deviceType,
      deviceToken,
      userName,
    } = req.body;

    // Batch user existence check
    const existingUsers = await authModel.find({
      $or: [{ email }, { userName }],
    });

    if (existingUsers.length) {
      const existingEmail = existingUsers.find((user) => user.email === email);
      if (existingEmail) {
        return res.status(200).json({
          success: false,
          message: "Email Already Registered",
        });
      }
      const existingUsername = existingUsers.find(
        (user) => user.userName === userName
      );
      if (existingUsername) {
        return res.status(400).json({
          success: false,
          message: "User Name Already exist",
        });
      }
    }

    // Validations
    if (
      !email.match(
        /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/
      )
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format" });
    }
    if (!/^[A-Za-z\s]+$/.test(fullName)) {
      return res.status(400).json({
        success: false,
        message: "Full name can only contain alphabetic characters and spaces",
      });
    }
    if (!["parent", "admin", "mySelf"].includes(userType)) {
      return res.status(400).json({
        success: false,
        message: "User type must be Parent, Admin, or Myself to register",
      });
    }
    const passwordRegex =
      /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters and contain one uppercase letter, one lowercase letter, one number, and one special character.",
      });
    }

    // Create and save user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new authModel({
      fullName,
      email,
      password: hashedPassword,
      mobileNumber,
      userType,
      deviceType,
      deviceToken,
      userName,
    });
    const savedUser = await newUser.save();

    // Send verification email asynchronously (consider using a queue)
    const apiLink = `https://api.swishstats.app/api/v1/verifyUser/${savedUser._id}`;
    sendEmails(
      savedUser.email,
      "Link Sent Successfully",
      `<h5>Your link is <a href="${apiLink}">${apiLink}</a></h5>`
    );

    return res.status(200).json({
      success: true,
      message: "User Registered Successfully",
      data: savedUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

//user login

export const userLogin = async (req, res) => {
  try {
    const { email, password, userName } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and Password are required",
      });
    }

    // Fetch user and check for child username if provided
    const user = await authModel
      .findOne({ email })
      .populate({
        path: "childId",
        match: { userVerified: true },
      })
      .populate("parentId")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User Not Found",
      });
    }

    // Check for child user by username if provided
    if (userName) {
      const childUser = await authModel.findOne({ userName, isEmail: false });
      if (!childUser) {
        return res.status(404).json({
          success: false,
          message: "Child User Name Not Found",
        });
      }
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid Password",
      });
    }

    // Validate user type
    const validUserTypes = ["parent", "child", "admin", "mySelf"];
    if (!validUserTypes.includes(user.userType)) {
      return res.status(403).json({
        success: false,
        message: "Invalid User Type",
      });
    }

    // Check if the user is verified
    if (user.userType !== "admin" && !user.userVerified) {
      return res.status(403).json({
        success: false,
        message: "User Not Verified. Please Verify Before Logging In.",
      });
    }

    // Generate JWT tokens
    const userToken = {
      userToken: jwt.sign({ user_id: user._id }, process.env.SECRET_KEY, {
        expiresIn: "1d",
      }),
    };
    user.userToken = userToken;

    for (let i = 0; i < user.childId.length; i++) {
      const childToken = jwt.sign(
        { user_id: user.childId[i]._id },
        process.env.SECRET_KEY,
        {
          expiresIn: "1d",
        }
      );
      user.childId[i].userToken = childToken;
    }

    const response = {
      ...user,
      ...userToken,
    };

    return res.status(200).json({
      success: true,
      message: "User Login Successfully",
      data: response,
    });
  } catch (error) {
    console.error("Internal server error", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//parent response

export const parentResponse = async (req, res) => {
  try {
    const { user_id } = req.user;

    const user = await authModel
      .findOne({
        _id: user_id,
        userType: "parent",
      })
      .populate("childId")
      .lean();

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "parent not found",
      });
    }

    for (let i = 0; i < user.childId.length; i++) {
      const childToken = jwt.sign(
        { user_id: user.childId[i]._id },
        process.env.SECRET_KEY,
        {
          expiresIn: "1d",
        }
      );
      user.childId[i].userToken = childToken;
    }

    const response = {
      ...user,
    };

    return res.status(200).json({
      success: true,
      message: "parent found successfully",
      data: response,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//forget password

export const forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Check for email presence
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await authModel.findOne({ email }).lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Email Not Found",
      });
    }

    // Check if an OTP already exists and is unused
    const existingOTP = await otpModel
      .findOne({ otpUsed: false, _id: user.otpEmail })
      .lean();

    if (existingOTP) {
      return res.status(429).json({
        success: false,
        message:
          "An OTP has already been sent. Please wait before requesting another.",
      });
    }

    const OTP = randomInt(10000, 99999);

    // Create a new OTP document
    const newOTP = new otpModel({
      otpKey: OTP,
      otpUsed: false,
    });

    // Save the new OTP document
    const savedOTP = await newOTP.save();

    // Assign the OTP document reference to the user's otpEmail field
    user.otpEmail = savedOTP._id;
    await authModel.updateOne({ _id: user._id }, { otpEmail: user.otpEmail });

    // Send email asynchronously (consider using a queue)
    sendEmails(
      user.email,
      "Code Sent Successfully",
      `<h5>Your code is ${OTP}</h5>`
    );

    return res.status(200).json({
      success: true,
      message: "Code Sent Successfully",
    });
  } catch (error) {
    console.error("Internal server error", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//verify otp

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Input validation
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const user = await authModel.findOne({ email }).populate("otpEmail").lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User Not Found",
      });
    }

    const OTP = user.otpEmail;

    if (!OTP || OTP.otpUsed || OTP.otpKey !== otp) {
      return res.status(400).json({
        success: false,
        message: OTP ? "Invalid OTP or already used" : "OTP Not Found",
      });
    }

    // Check if OTP has expired (1 hour expiration)
    const isExpired = new Date() - OTP.createdAt > 3600000; // 3600000ms = 1 hour
    if (isExpired) {
      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    // Generate token
    const token = jwt.sign({ user_id: user._id }, process.env.SECRET_KEY, {
      expiresIn: "1d",
    });

    // Update user and OTP status in a single operation
    await Promise.all([
      authModel.updateOne(
        { _id: user._id },
        {
          $set: {
            userToken: token,
            otpVerified: true,
            otpEmail: null,
          },
        }
      ),
      otpModel.updateOne({ _id: OTP._id }, { otpUsed: true }),
    ]);

    const profile = { ...user, userToken: token };

    return res.status(200).json({
      success: true,
      message: "OTP Verified Successfully",
      data: profile,
    });
  } catch (error) {
    console.error("Internal server error", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//reset password

export const resetPassword = async (req, res) => {
  try {
    const { password } = req.body;
    const { user_id } = req.user;

    const user = await authModel.findById(user_id);

    if (!user) {
      // loggerError.error("user not found");
      return res.status(400).json({
        success: false,
        message: "User Not Found",
      });
    }

    // Const Match Regex for password
    const passwordRegex =
      /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be 8 characters and must contain at least one uppercase letter, one lowercase letter, one number and one special character.",
      });
    }

    const userResetPassword = await authModel.findByIdAndUpdate(
      user_id,
      {
        password: bcrypt.hashSync(password, 10),
      },
      {
        new: true,
      }
    );
    if (!userResetPassword) {
      // loggerError.error("password not reset");
      return res.status(400).json({
        success: false,
        message: "Unable Not Reset Password",
      });
    }

    // loggerInfo.info("password reset successfully");

    return res.status(200).json({
      success: true,
      message: "Password Reset Successfully",
      data: userResetPassword,
    });
  } catch (error) {
    // loggerError.error("Internal server error", error.message);
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//profile update

export const updateProfile = async (req, res) => {
  try {
    const { fullName, mobileNumber } = req.body;
    const { user_id } = req.user;

    // Retrieve the user from the database
    const user = await authModel.findOne({ _id: user_id });

    if (!user) {
      // loggerError.error("User not found");
      return res.status(400).json({
        success: false,
        message: "User Not Found",
      });
    }

    // Update the profile, including the new password
    const updateProfile = await authModel.findByIdAndUpdate(
      user_id,
      {
        fullName,
        mobileNumber,
      },
      {
        new: true,
      }
    );

    if (!updateProfile) {
      // loggerError.error("Profile not updated");
      return res.status(400).json({
        success: false,
        message: "Profile Not Updated",
      });
    }

    // loggerInfo.info("Profile updated successfully");

    return res.status(200).json({
      success: true,
      message: "Profile Update Successfully",
      data: updateProfile,
    });
  } catch (error) {
    // loggerError.error("Internal server error", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//change password

export const changePassword = async (req, res) => {
  try {
    const { user_id } = req.user;

    const user = await authModel.findById(user_id);
    const { password, previousPassword, confirmPassword } = req.body;

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "user not found",
      });
    }

    // Verify that the provided previous password matches the stored password
    if (!bcrypt.compareSync(previousPassword, user.password)) {
      loggerError.error("Please enter the correct previous password");
      return res.status(400).json({
        success: false,
        message: "Please enter the correct previous password",
      });
    }

    // Check if the new password and confirmation password match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Your passwords do not match",
      });
    }

    // Update the password
    const newPasswordHash = await bcrypt.hashSync(password, 8);

    const change = await authModel.findByIdAndUpdate(
      user_id,
      {
        password: newPasswordHash,
      },
      { new: true }
    );

    if (!change) {
      return res.status(400).json({
        success: false,
        message: "Password not changed",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//invite child

export const inviteChild = async (req, res) => {
  try {
    const { user_id } = req.user;

    const user = await authModel.findOne({ _id: user_id, userType: "parent" });
    if (!user) {
      // loggerError.error("user not found");
      return res.status(400).json({
        success: false,
        message: "User Not Found",
      });
    }
    const {
      fullName,
      email,
      password,
      DateOfBirth,
      CourtSize,
      mobileNumber,
      userType,
      deviceType,
      deviceToken,
      userName,
    } = req.body;

    // Check if userType is "parent" or "admin" before proceeding with registration

    if (email) {
      console.log("email called");

      const childpurchase = await purchaseModel.findOne({
        parentId: user_id,
      });
      console.log(childpurchase, "childpurchase");

      if (!childpurchase) {
        return res.status(400).json({
          success: false,
          message: "subscription not found",
        });
      }

      if (childpurchase) {
        console.log("find child purchase");

        // // Get the current timestamp in milliseconds
        const currentTimestamp = Date.now();

        //if subscription type is free
        if (childpurchase.subscriptionLevel === "FREE") {
          // Calculate the remaining time in milliseconds
          console.log("called free");
          console.log(currentTimestamp, "currentTimestamp");
          console.log(childpurchase.expirationDate, "purchase.expirationDate");
          const remainingTime = childpurchase.expirationDate - currentTimestamp;

          // console.log(remainingTime, 'remainingTime');
          if (remainingTime <= 0) {
            console.log("expired");
            // The subscription has expired
            return res.status(400).json({
              success: false,
              message:
                "Your free subscription has expired. Buy a Basic subscription to continue",
            });
          } else {
            if (userType !== "child") {
              return res.status(400).json({
                success: false,
                message: "User type must be child to register",
              });
            }
            const checkChild = await authModel.findOne({ email: email });

            if (checkChild) {
              return res.status(400).json({
                success: false,
                message: "Child Already Registered",
              });
            }

            const checkUserName = await authModel.findOne({
              userName: userName,
            });

            if (checkUserName) {
              return res.status(400).json({
                success: false,
                message: "User Name Already exist",
              });
            }
            // Const Match Regex for password
            const passwordRegex =
              /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;
            if (!passwordRegex.test(password)) {
              return res.status(400).json({
                success: false,
                message:
                  "Password must be 8 characters and must contain at least one uppercase letter, one lowercase letter, one number and one special character.",
              });
            }
            const hashedPassword = await bcrypt.hash(password, 10);

            // Function to determine user slots based on subscription

            const getUserSlots = (subscriptionLevel) => {
              switch (subscriptionLevel) {
                case "FREE":
                  return 1;
                default:
                  return 0;
              }
            };

            const subscriptions = await purchaseModel.find({
              parentId: user_id,
            });

            // Calculate total allowed users based on subscriptions

            let totalUsersAllowed = 0;

            for (const subscription of subscriptions) {
              totalUsersAllowed += getUserSlots(subscription.subscriptionLevel);
            }

            //count child

            const countChild = user.childId.length;

            console.log(checkChild, "childcount");

            if (countChild >= totalUsersAllowed) {
              return res.status(400).json({
                success: false,
                message:
                  "Cannot add more children, subscription limit reached.",
              });
            }
            const createChild = new authModel({
              fullName,
              email,
              password: hashedPassword,
              DateOfBirth,
              CourtSize,
              mobileNumber,
              userType,
              parentId: user_id,
              userName,
              ...(deviceType && { deviceType }), // Only add deviceType if it exists
              ...(deviceToken && { deviceToken }), // Only add deviceToken if it exists
            });
            const saveChild = await createChild.save();
            user.childId.push(saveChild._id);
            await user.save();
            const id = saveChild._id;

            const basePath = "http://localhost:4000/api/v1/";
            const livePath = "https://api.swishstats.app/api/v1/";

            const link = `${livePath}verifyChild/${id}`;

            const plainTexts = link.replace(/<[^>]*>/g, "");
            sendEmails(
              email,
              "Invitation Link Sent Successfully",
              `<h5>Your Invitation Link is <a href="${link}">${link}</a></h5>`
            );

            // loggerInfo.info("Invitation link sent successfully");
            return res.status(200).json({
              success: true,
              message: "Invitation Link Sent Successfully",
              data: saveChild,
            });
          }
        }
        if (childpurchase.subscriptionLevel === "BASIC") {
          if (userType !== "child") {
            return res.status(400).json({
              success: false,
              message: "User type must be child to register",
            });
          }
          const checkChild = await authModel.findOne({ email: email });

          if (checkChild) {
            return res.status(400).json({
              success: false,
              message: "Child Already Registered",
            });
          }

          const checkUserName = await authModel.findOne({ userName: userName });

          if (checkUserName) {
            return res.status(400).json({
              success: false,
              message: "User Name Already exist",
            });
          }
          // Const Match Regex for password
          const passwordRegex =
            /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;
          if (!passwordRegex.test(password)) {
            return res.status(400).json({
              success: false,
              message:
                "Password must be 8 characters and must contain at least one uppercase letter, one lowercase letter, one number and one special character.",
            });
          }
          const hashedPassword = await bcrypt.hash(password, 10);

          // Function to determine user slots based on subscription

          const getUserSlots = (subscriptionLevel) => {
            switch (subscriptionLevel) {
              case "BASIC":
                return 1;
              default:
                return 0;
            }
          };

          const subscriptions = await purchaseModel.find({ parentId: user_id });

          // Calculate total allowed users based on subscriptions

          let totalUsersAllowed = 0;

          for (const subscription of subscriptions) {
            totalUsersAllowed += getUserSlots(subscription.subscriptionLevel);
          }

          //count child

          const countChild = user.childId.length;

          console.log(checkChild, "childcount");

          if (countChild >= totalUsersAllowed) {
            return res.status(400).json({
              success: false,
              message: "Cannot add more children, subscription limit reached.",
            });
          }
          const createChild = new authModel({
            fullName,
            email,
            password: hashedPassword,
            DateOfBirth,
            CourtSize,
            mobileNumber,
            userType,
            parentId: user_id,
            userName,
            ...(deviceType && { deviceType }), // Only add deviceType if it exists
            ...(deviceToken && { deviceToken }), // Only add deviceToken if it exists
          });
          const saveChild = await createChild.save();
          user.childId.push(saveChild._id);
          await user.save();
          const id = saveChild._id;

          const basePath = "http://localhost:4000/api/v1/";
          const livePath = "https://api.swishstats.app/api/v1/";

          const link = `${livePath}verifyChild/${id}`;

          const plainTexts = link.replace(/<[^>]*>/g, "");
          sendEmails(
            email,
            "Invitation Link Sent Successfully",
            `<h5>Your Invitation Link is <a href="${link}">${link}</a></h5>`
          );

          // loggerInfo.info("Invitation link sent successfully");
          return res.status(200).json({
            success: true,
            message: "Invitation Link Sent Successfully",
            data: saveChild,
          });
        }
        if (childpurchase.subscriptionLevel === "BASIC_PLUS") {
          if (userType !== "child") {
            return res.status(400).json({
              success: false,
              message: "User type must be child to register",
            });
          }
          const checkChild = await authModel.findOne({ email: email });

          if (checkChild) {
            return res.status(400).json({
              success: false,
              message: "Child Already Registered",
            });
          }

          const checkUserName = await authModel.findOne({ userName: userName });

          if (checkUserName) {
            return res.status(400).json({
              success: false,
              message: "User Name Already exist",
            });
          }
          // Const Match Regex for password
          const passwordRegex =
            /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;
          if (!passwordRegex.test(password)) {
            return res.status(400).json({
              success: false,
              message:
                "Password must be 8 characters and must contain at least one uppercase letter, one lowercase letter, one number and one special character.",
            });
          }
          const hashedPassword = await bcrypt.hash(password, 10);

          // Function to determine user slots based on subscription

          const getUserSlots = (subscriptionLevel) => {
            switch (subscriptionLevel) {
              case "BASIC_PLUS":
                return 5;
              default:
                return 0;
            }
          };

          const subscriptions = await purchaseModel.find({ parentId: user_id });

          // Calculate total allowed users based on subscriptions

          let totalUsersAllowed = 0;

          for (const subscription of subscriptions) {
            totalUsersAllowed += getUserSlots(subscription.subscriptionLevel);
          }

          //count child

          const countChild = user.childId.length;

          console.log(checkChild, "childcount");

          if (countChild >= totalUsersAllowed) {
            return res.status(400).json({
              success: false,
              message: "Cannot add more children, subscription limit reached.",
            });
          }
          const createChild = new authModel({
            fullName,
            email,
            password: hashedPassword,
            DateOfBirth,
            CourtSize,
            mobileNumber,
            userType,
            parentId: user_id,
            userName,
            ...(deviceType && { deviceType }), // Only add deviceType if it exists
            ...(deviceToken && { deviceToken }), // Only add deviceToken if it exists
          });
          const saveChild = await createChild.save();
          user.childId.push(saveChild._id);
          await user.save();
          const id = saveChild._id;

          const basePath = "http://localhost:4000/api/v1/";
          const livePath = "https://api.swishstats.app/api/v1/";

          const link = `${livePath}verifyChild/${id}`;

          const plainTexts = link.replace(/<[^>]*>/g, "");
          sendEmails(
            email,
            "Invitation Link Sent Successfully",
            `<h5>Your Invitation Link is <a href="${link}">${link}</a></h5>`
          );

          // loggerInfo.info("Invitation link sent successfully");
          return res.status(200).json({
            success: true,
            message: "Invitation Link Sent Successfully",
            data: saveChild,
          });
        }
        if (childpurchase.subscriptionLevel === "BASIC_PREMIUM") {
          if (userType !== "child") {
            return res.status(400).json({
              success: false,
              message: "User type must be child to register",
            });
          }
          const checkChild = await authModel.findOne({ email: email });

          if (checkChild) {
            return res.status(400).json({
              success: false,
              message: "Child Already Registered",
            });
          }

          const checkUserName = await authModel.findOne({ userName: userName });

          if (checkUserName) {
            return res.status(400).json({
              success: false,
              message: "User Name Already exist",
            });
          }
          // Const Match Regex for password
          const passwordRegex =
            /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/;
          if (!passwordRegex.test(password)) {
            return res.status(400).json({
              success: false,
              message:
                "Password must be 8 characters and must contain at least one uppercase letter, one lowercase letter, one number and one special character.",
            });
          }
          const hashedPassword = await bcrypt.hash(password, 10);

          // Function to determine user slots based on subscription

          const getUserSlots = (subscriptionLevel) => {
            switch (subscriptionLevel) {
              case "BASIC_PREMIUM":
                return 12;
              default:
                return 0;
            }
          };

          const subscriptions = await purchaseModel.find({ parentId: user_id });

          // Calculate total allowed users based on subscriptions

          let totalUsersAllowed = 0;

          for (const subscription of subscriptions) {
            totalUsersAllowed += getUserSlots(subscription.subscriptionLevel);
          }

          //count child

          const countChild = user.childId.length;

          console.log(checkChild, "childcount");

          if (countChild >= totalUsersAllowed) {
            return res.status(400).json({
              success: false,
              message: "Cannot add more children, subscription limit reached.",
            });
          }
          const createChild = new authModel({
            fullName,
            email,
            password: hashedPassword,
            DateOfBirth,
            CourtSize,
            mobileNumber,
            userType,
            parentId: user_id,
            userName,
            ...(deviceType && { deviceType }), // Only add deviceType if it exists
            ...(deviceToken && { deviceToken }), // Only add deviceToken if it exists
          });
          const saveChild = await createChild.save();
          user.childId.push(saveChild._id);
          await user.save();
          const id = saveChild._id;

          const basePath = "http://localhost:4000/api/v1/";
          const livePath = "https://api.swishstats.app/api/v1/";

          const link = `${livePath}verifyChild/${id}`;

          const plainTexts = link.replace(/<[^>]*>/g, "");
          sendEmails(
            email,
            "Invitation Link Sent Successfully",
            `<h5>Your Invitation Link is <a href="${link}">${link}</a></h5>`
          );

          // loggerInfo.info("Invitation link sent successfully");
          return res.status(200).json({
            success: true,
            message: "Invitation Link Sent Successfully",
            data: saveChild,
          });
        }
      }
    } else {
      console.log("below");

      const hashedPassword = await bcrypt.hashSync(password);

      const child = new authModel({
        fullName,
        userName,
        password: hashedPassword,
        parentId: user_id,
        userType,
        DateOfBirth,
        CourtSize,
        ...(deviceType && { deviceType }), // Only add deviceType if it exists
        ...(deviceToken && { deviceToken }), // Only add deviceToken if it exists
      });

      const savechild = await child.save();
      savechild.isEmail = false;
      savechild.userVerified = true;
      user.childId.push(savechild._id);
      await savechild.save();
      await user.save();

      return res.status(200).json({
        success: true,
        message: "Child user invited without email or id successfully",
        password: savechild,
      });
    }
  } catch (error) {
    // loggerError.error("Internal server error", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//verify user

export const verifyUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await authModel.findById(id);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    const userType = user.userType;

    if (userType == "mySelf") {
      const purchase = await purchaseModel.findOne({
        mySelfId: user._id,
        subscriptionLevel: "FREE",
      });

      if (purchase) {
        return res.status(400).json({
          success: false,
          message: "User Already Buy Subscription",
        });
      }

      // Calculate the expiration timestamp for 7 days in the future (7 days * 24 hours/day * 60 minutes/hour * 60 seconds/minute * 1000 milliseconds/second)
      const expiration = Date.now() + 7 * 24 * 60 * 60 * 1000;

      if (!purchase) {
        const newPurchase = new purchaseModel({
          subscriptionLevel: "FREE",
          mySelfId: user._id,
          expirationDate: expiration,
        });

        const savePurchase = await newPurchase.save();

        await authModel.findByIdAndUpdate(
          user._id,
          {
            $addToSet: {
              purchase: savePurchase._id,
            },
          },
          { new: true }
        );
        await user.save();
      }

      user.userVerified = true;
      const fullName = user.fullName;

      const responseHtml =
        `<html><body><h1>User Verification Successful</h1><p> Thank you ,${fullName} For Verifying Your Account</p></body></html>`.trim();

      // Remove HTML tags using a regular expression
      const plainText = responseHtml.replace(/<[^>]*>/g, "");

      await user.save();

      return res.status(200).json({
        success: true,
        data: plainText,
      });
    } else if (userType == "parent") {
      const purchase = await purchaseModel.findOne({
        parentId: user._id,
        subscriptionLevel: "FREE",
      });

      if (purchase) {
        return res.status(400).json({
          success: false,
          message: "User Already Buy Subscription",
        });
      }

      // Calculate the expiration timestamp for 7 days in the future (7 days * 24 hours/day * 60 minutes/hour * 60 seconds/minute * 1000 milliseconds/second)
      const expiration = Date.now() + 7 * 24 * 60 * 60 * 1000;

      if (!purchase) {
        const newPurchase = new purchaseModel({
          subscriptionLevel: "FREE",
          parentId: user._id,
          expirationDate: expiration,
        });

        const savePurchase = await newPurchase.save();

        await authModel.findByIdAndUpdate(
          user._id,
          {
            $addToSet: {
              purchase: savePurchase._id,
            },
          },
          { new: true }
        );
        await user.save();
      }

      user.userVerified = true;
      const fullName = user.fullName;

      const responseHtml =
        `<html><body><h1>User Verification Successful</h1><p> Thank you ,${fullName} For Verifying Your Account</p></body></html>`.trim();

      // Remove HTML tags using a regular expression
      const plainText = responseHtml.replace(/<[^>]*>/g, "");

      await user.save();

      return res.status(200).json({
        success: true,
        data: plainText,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "invalid user type",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//verify child

export const verifyChild = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await authModel.findById(id);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    user.isActive = true;
    user.userVerified = true;
    const fullName = user.fullName;
    const responseHtml =
      `<html><body><h1>Child Verification Successful</h1><p> Thank you ,${fullName} For Verifying Your Account</p></body></html>`.trim();
    // Remove HTML tags using a regular expression
    const plainText = responseHtml.replace(/<[^>]*>/g, "");

    await user.save();
    return res.status(200).json({
      success: true,
      data: plainText,
    });
  } catch (error) {
    // loggerError.error("Internal server error", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//invite friend

export const inviteFriend = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { email } = req.body;

    const user = await authModel.findById(user_id);
    if (!user) {
      // loggerError.error("user not found");
      return res.status(400).json({
        success: false,
        message: "User Not Found",
      });
    }
    const invitefriend = await authModel.findOne({ email: email });

    if (invitefriend) {
      return res.status(400).json({
        success: false,
        message: "Already Invited",
      });
    }

    const basePath = "https://api.swishstats.app";
    const link = `${basePath}/api/v1/inviteFriend/${email}`;
    const plainTexts = link.replace(/<[^>]*>/g, "");
    sendEmails(
      email,
      "Invitation Link Sent Successfully",
      `<h5>Your Invitation Link is <a href="${link}">${link}</a></h5>`
    );

    return res.status(200).json({
      success: true,
      message: "Invitation Link Sent Successfully",
      data: plainTexts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//child analytics

export const childAnalytics = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { id } = req.params;
    const user = await authModel.findOne({
      _id: user_id,
      userType: "parent",
    });
    if (!user) {
      // loggerError.error("user not found");
      return res.status(400).json({
        success: false,
        message: "User Not Found",
      });
    }

    //child id
    const childId = await authModel.findById(id);

    if (!childId) {
      return res.status(400).json({
        success: false,
        message: "Child Id Not Found",
      });
    }

    //child analytics

    if (!childId.userVerified) {
      return res.status(400).json({
        success: false,
        message: "Child Not Verified. Please verify",
      });
    }

    const childanalytics = await activityModel
      .find({ createdBy: id })
      .populate(["goalId", "createdBy"]);

    if (!childanalytics) {
      return res.status(400).json({
        success: false,
        message: "Child Analytics Not Found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Child Analytics Found Successfully",
      data: childanalytics,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//user delete

export const userDelete = async (req, res) => {
  try {
    const { user_id } = req.user;
    // const {id}=req.params;
    const user = await authModel.findOne({
      _id: user_id,
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "user not found",
      });
    }
    const deleteuser = await authModel.findByIdAndDelete(user_id);

    if (!deleteuser) {
      return res.status(400).json({
        success: false,
        message: "user not delete",
      });
    }

    return res.status(200).json({
      success: true,
      message: "user delete successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//user feed back

export const feedBack = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { feedback } = req.body;
    const user = await authModel.findOne({
      _id: user_id,
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "user not found",
      });
    }

    //post feed back

    const create = new feedbackModel({
      feedback,
      createdBy: user_id,
    });

    if (!feedback) {
      return res.status(400).json({
        success: false,
        message: "Please Provide Your Feedback",
      });
    }

    const save = await create.save();

    if (!save) {
      return res.status(400).json({
        success: false,
        message: "Feedback Not Submitted",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Feedback Submitted Successfully",
      data: save,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
