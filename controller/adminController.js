import authModel from "../model/authModel.js";
import libraryModel from "../model/libraryModel.js";
import { handleMultiPartData } from "../utils/multiPartData.js";
// import { loggerInfo, loggerError } from "../utils/log.js";
import activityModel from "../model/activityAnalyticsModel.js";
import builtInGuideModel from "../model/builtInGuideModel.js";
import purchaseModel from "../model/purchaseModel.js";
import { uploadFileWithFolder } from "../utils/awsFileUpload.js";
import privacyModel from "../model/privacyModel.js";
import notificationModel from "../model/notificationModel.js";
import pushNotification from "../middleware/pushNotifcation.js";
import jwt from "jsonwebtoken";
import feedbackModel from "../model/feedBackModel.js";
import bcrypt from "bcryptjs";

//create privacy

export const createPrivacy = async (req, res) => {
  try {
    const { user_id } = req.user;
    const admin = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Admin Not Found",
      });
    }
    const { privacyPolicy } = req.body;

    const data = await privacyModel.find();

    if (data.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Privacy Create Only One Time",
      });
    }

    const createPrivacy = new privacyModel({
      privacyPolicy,
    });

    const savePrivacy = await createPrivacy.save();

    if (!savePrivacy) {
      return res.status(400).json({
        success: false,
        message: "Privacy Not Create",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Privacy Create Successfully",
      data: savePrivacy,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

//get privacy

export const getPrivacy = async (req, res) => {
  try {
    const { user_id } = req.user;
    const admin = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Admin Not Found",
      });
    }

    const getprivacy = await privacyModel.find();

    if (!getprivacy) {
      return res.status(400).json({
        success: false,
        message: "Privacy Policy Not Found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Privacy Policy Found Successfully",
      data: getprivacy,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

//update privacy

export const updatePrivacy = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { id } = req.params;
    const { privacyPolicy } = req.body;
    const admin = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Admin Not Found",
      });
    }
    const updateprivacy = await privacyModel.findByIdAndUpdate(
      id,
      {
        privacyPolicy,
      },
      { new: true }
    );

    if (!updateprivacy) {
      return res.status(400).json({
        success: false,
        message: "Privacy Policy Not Update",
      });
    }
    return res.status(201).json({
      success: true,
      message: "Privacy Policy Update Successfully",
      data: updateprivacy,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

//delete privacy

export const deletePrivacy = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { id } = req.params;
    const admin = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Admin Not Found",
      });
    }

    const deleteprivacy = await privacyModel.findByIdAndDelete(id);

    if (!deleteprivacy) {
      return res.status(400).json({
        success: false,
        message: "Privacy Not Delete",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Privacy Delete Successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

//upload library video

export const uploadLibraryVideos = [
  handleMultiPartData.array("video", 7),

  async (req, res) => {
    try {
      const { user_id } = req.user;

      const findadmin = await authModel.findOne({
        _id: user_id,
        userType: "admin",
      });

      if (!findadmin) {
        // loggerError.error("Admin not found");
        return res.status(400).json({
          success: false,
          message: "Admin Not Found",
        });
      }
      const { files } = req;
      const { category } = req.body; // Assuming the category is provided in the request body

      const libraryDocs = [];

      for (const file of files) {
        const { originalname, buffer } = file;

        // Check if the category already exists in the library
        let existingCategory = await libraryModel.findOne({ category });

        if (!existingCategory) {
          // If the category doesn't exist, create a new category
          existingCategory = new libraryModel({
            category,
            videoUploadedBy: user_id,
            video: [], // Initialize an empty array for videos in the new category
          });
        }

        // Check if the category is valid based on your enum
        if (
          libraryModel.schema.path("category").enumValues.includes(category)
        ) {
          const videoLocation = await uploadFileWithFolder(
            originalname,
            "library",
            buffer
          );

          const title = `${category} Video`;
          const url = videoLocation;

          // Create a video object
          const videoObject = {
            title,
            url,
          };

          existingCategory.video.push(videoObject); // Add the video to the existing category

          await existingCategory.save(); // Save the modified or newly created category
          libraryDocs.push(existingCategory); // Push the category object to the response
        }
      }

      const childUsers = await authModel
        .find({ userType: "child" })
        .select("_id deviceToken");

      console.log(childUsers);

      if (childUsers.length > 0) {
        const notificationContent = `Admin upload a new video:${libraryDocs}`;

        // Send a notification to each child user

        for (const childUser of childUsers) {
          const notification = new notificationModel({
            title: "library videos upload successfully",
            body: notificationContent,
            authId: childUser._id,
          });

          await notification.save();
        }
      }
      // Send push notifications
      const notificationContent = `Admin uploaded a new video: ${libraryDocs.title}`; // Assuming saveVideo has a 'title' property

      for (const childUser of childUsers) {
        const notificationObj = {
          deviceToken: childUser.deviceToken,
          title: "New video uploaded",
          body: notificationContent,
        };

        try {
          await pushNotification(notificationObj);
          console.log(
            `Push notification sent to user with device token: ${childUser.deviceToken}`
          );
        } catch (pushError) {
          console.error("Push Notification Error:", pushError.message);
        }
      }

      // loggerInfo.info("Video uploaded successfully");
      return res.status(200).json({
        success: true,
        message: "Video uploaded successfully",
        data: libraryDocs,
      });
    } catch (error) {
      console.log(error);
      // loggerError.error(error.message);
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
];

//get library video

export const getLibraryVideo = async (req, res) => {
  try {
    const { user_id } = req.user;

    const findadmin = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!findadmin) {
      // loggerError.error("Admin not found");
      return res.status(400).json({
        success: false,
        message: "Admin Not Found",
      });
    }

    const getlibrary = await libraryModel.find();

    if (!getlibrary) {
      return res.status(400).json({
        success: false,
        message: "Library Video Not Found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Library Video Found Successfully",
      data: getlibrary,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//delete library video

export const deleteLibraryVideos = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { id } = req.params;
    const findadmin = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!findadmin) {
      // loggerError.error("Admin not found");
      return res.status(400).json({
        success: false,
        message: "Admin Not Found",
      });
    }

    const library = await libraryModel.findOne({ videoUploadedBy: user_id });

    if (!library) {
      return res.status(400).json({
        success: false,
        message: "Library  Not Found",
      });
    }

    // Find and remove the video from the array
    const updatedVideos = library.video.filter(
      (video) => video._id.toString() !== id
    );

    // Update the library with the updated videos
    library.video = updatedVideos;
    await library.save();

    return res.status(200).json({
      success: true,
      message: "Video Delete Successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//upload built in Guide

export const uploadGuide = [
  handleMultiPartData.fields([
    {
      name: "builtInGuide",
      // maxCount: 10,
    },
  ]),

  async (req, res) => {
    try {
      const { user_id } = req.user;

      const admin = await authModel.findOne({
        _id: user_id,
        userType: "admin",
      });

      if (!admin) {
        return res.status(400).json({
          success: false,
          message: "Admin Not Found",
        });
      }

      const guide = await builtInGuideModel.find();

      if (guide.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Guide upload only one time",
        });
      }
      const { files } = req;
      let builtInGuideLocation = "";

      if (files.builtInGuide) {
        const file = files.builtInGuide[0];
        const fileName = file.originalname;
        const fileContent = file.buffer;

        builtInGuideLocation = await uploadFileWithFolder(
          fileName,
          "builtInGuide",
          fileContent
        );
      }

      const data = await builtInGuideModel.find();

      if (data.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Built In Guide Uploaded Only One Time",
        });
      }

      //upload built in guide
      const upload = new builtInGuideModel({
        uploadBy: user_id,
        builtInGuide: builtInGuideLocation,
      });
      const save = await upload.save();

      if (!save) {
        return res.status(400).json({
          success: false,
          message: "BuiltInGuide Not Upload",
        });
      }

      const childUsers = await authModel
        .find({ userType: "child" })
        .select("_id deviceToken");

      console.log(childUsers);

      if (childUsers.length > 0) {
        const notificationContent = `Admin upload a new video:${save}`;

        // Send a notification to each child user

        for (const childUser of childUsers) {
          const notification = new notificationModel({
            title: "guide file uploaded successfully",
            body: notificationContent,
            authId: childUser._id,
          });

          await notification.save();
        }
      }
      // Send push notifications
      const notificationContent = `Admin uploaded a new video: ${save.title}`; // Assuming saveVideo has a 'title' property

      for (const childUser of childUsers) {
        const notificationObj = {
          deviceToken: childUser.deviceToken,
          title: "guide file uploaded successfully",
          body: notificationContent,
        };

        try {
          await pushNotification(notificationObj);
          console.log(
            `Push notification sent to user with device token: ${childUser.deviceToken}`
          );
        } catch (pushError) {
          console.error("Push Notification Error:", pushError.message);
        }
      }

      return res.status(200).json({
        success: true,
        message: "BuiltInGuide Upload Successfully",
        data: save,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
];

//update built in Guide

export const updateGuide = [
  handleMultiPartData.fields([
    {
      name: "builtInGuide",
      // maxCount: 10,
    },
  ]),

  async (req, res) => {
    try {
      const { user_id } = req.user;
      const { id } = req.params;
      const admin = await authModel.findOne({
        _id: user_id,
        userType: "admin",
      });

      if (!admin) {
        return res.status(400).json({
          success: false,
          message: "Admin not found",
        });
      }

      const { files } = req;
      let builtInGuideLocation = "";

      if (files.builtInGuide) {
        const file = files.builtInGuide[0];
        const fileName = file.originalname;
        const fileContent = file.buffer;

        builtInGuideLocation = await uploadFileWithFolder(
          fileName,
          "builtInGuide",
          fileContent
        );
      }

      //upload built in guide
      const update = await builtInGuideModel.findByIdAndUpdate(
        id,
        {
          uploadBy: user_id,
          builtInGuide: builtInGuideLocation,
        },

        {
          new: true,
        }
      );

      if (!update) {
        return res.status(400).json({
          success: false,
          message: "Guide not update",
        });
      }
      return res.status(200).json({
        success: true,
        message: "Guide Updated Successfully",
        data: update,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
];

//get built in Guide

export const getGuide = async (req, res) => {
  try {
    const { user_id } = req.user;

    const admin = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Admin Not Found",
      });
    }

    const getGuide = await builtInGuideModel.find();

    if (!getGuide) {
      return res.status(400).json({
        success: false,
        message: "Guide Not Found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Guide Found Successfully",
      data: getGuide,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//user management system

//get all users

export const getAllUser = async (req, res) => {
  try {
    const { user_id } = req.user;
    const page = parseInt(req.query.page) || 1; // Get the page number from the request query or default to 1
    const limit = parseInt(req.query.limit) || 10; // Get the limit from the request query or default to 10
    const usertype = req.query.usertype;
    const userfind = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!userfind) {
      return res.status(400).json({
        success: false,
        message: "Admin Not Found",
      });
    }

    const totalUsersCount = await authModel.countDocuments({
      _id: { $ne: user_id },
    });
    const totalPages = Math.ceil(totalUsersCount / limit);

    const skip = (page - 1) * limit; // Calculate the number of documents to skip

    const query = {
      _id: { $ne: user_id },
      userType: usertype,
    };

    const getUserQuery = authModel.find(query).skip(skip).limit(limit);

    if (usertype === "parent") {
      getUserQuery.populate("childId");
    }

    if (usertype === "child") {
      getUserQuery.populate("parentId");
    }

    if (usertype === "mySelf") {
      getUserQuery;
    }

    const getUser = await getUserQuery;
    if (!getUser) {
      return res.status(400).json({
        success: false,
        message: "Users Not Found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Users Found Successfully",
      data: getUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//get user by id

export const getUserById = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { id } = req.params;

    // Check if the requesting user is an admin
    const userfind = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!userfind) {
      return res.status(400).json({
        success: false,
        message: "Admin Not Found",
      });
    }

    const finduser = await authModel.findById(id);

    if (!finduser) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    if (finduser.userType === "parent") {
      await finduser.populate("childId");
    } else if (finduser.userType === "child") {
      await finduser.populate("parentId");
    }

    // Return the populated user
    return res.status(200).json({
      success: true,
      message: "User Found Successfully",
      data: finduser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//delete user

export const deleteUser = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { id } = req.params;
    const userfind = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!userfind) {
      return res.status(400).json({
        success: false,
        message: "Admin Not Found",
      });
    }
    const deleteuser = await authModel.findByIdAndDelete(id);

    if (!deleteuser) {
      return res.status(400).json({
        success: true,
        message: "User Not Delete",
      });
    }
    return res.status(200).json({
      success: true,
      message: "User Delete Successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Analytics and Reporting

//get all user analytics

export const getUsersAnalytics = async (req, res) => {
  try {
    const { user_id } = req.user;
    const userfind = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!userfind) {
      return res.status(400).json({
        success: false,
        message: "Admin Not Found",
      });
    }

    const getanalytics = await activityModel.find().populate({
      path: "goalId",
      populate: {
        path: "createdBy",
      },
    });
    if (!getanalytics || getanalytics.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Analytics Not Found",
      });
    }

    // const modifiedAnalytics = getanalytics.map((data) => {
    //   return {
    //     _id: data._id,
    //     fullName: data.goalId.createdBy?.fullName,
    //     email: data.goalId.createdBy?.email,
    //     Image: data.goalId.createdBy?.Image,
    //     otpVerified: data.goalId.createdBy?.otpVerified,
    //     userVerified: data.goalId.createdBy?.userVerified,
    //     userType: data.goalId.createdBy?.userType,
    //     phoneNumber: data.goalId.createdBy?.phoneNumber, // Corrected property name
    //     parentId: data.goalId.createdBy?.parentId,
    //     childId: data.goalId.createdBy?.childId,
    //     isActive: data.goalId.createdBy?.isActive,
    //     DateOfBirth: data.goalId.createdBy?.DateOfBirth,
    //     userDisabled: data.goalId.createdBy?.userDisabled,
    //     deviceType: data.goalId.createdBy?.deviceType,
    //     deviceToken: data.goalId.createdBy?.deviceToken,
    //     CourtSize: data.goalId.createdBy?.CourtSize,
    //     activityEachWeek:data.goalId.activityEachWeek,
    //     shotEachWeek:data.goalId.shotEachWeek,
    //     freeThrowEachWeek:data.goalId.freeThrowEachWeek,
    //     correctShorts:data.goalId.correctShorts,
    //     percentageShot:data.goalId.percentageShot,
    //     percentageFreeThrows:data.goalId.percentageFreeThrows,
    //     goalCreatedAt: data.goalCreatedAt,
    //     share: data.share
    //   };
    // });

    // Create an object to store consolidated user data
    // const consolidatedUsers = {};

    // // Iterate through the analytics data and combine user data and their goals
    // for (const user of modifiedAnalytics) {
    //   const userEmail = user.email; // get user email for comparison

    //   // If the user already exists in the consolidatedUsers object, combine their goals
    //   if (consolidatedUsers[userEmail]) {
    //     // Check if the goal doesn't already exist before adding it
    //     for (const goal of user.childGoal) {
    //       if (!consolidatedUsers[userEmail].childGoal.includes(goal)) {
    //         consolidatedUsers[userEmail].childGoal.push(goal);
    //       }
    //     }
    //   } else {
    //     // If the user doesn't exist, add them to the consolidatedUsers object
    //     consolidatedUsers[userEmail] = { ...user }; // Create a shallow copy of the user object
    //   }
    // }
    // // Convert the consolidatedUsers object back to an array

    // const consolidatedUsersArray = Object.values(consolidatedUsers);

    // console.log(consolidatedUsersArray);

    return res.status(200).json({
      success: true,
      message: "All Analytics Found Successfully",
      data: getanalytics,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//get single user analytics

export const getSingleUserAnalytics = async (req, res) => {
  try {
    // const adminId = req.user_id; // Assuming req.user_id contains the admin ID
    const { user_id } = req.user;
    const { id } = req.params;
    const admin = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Admin not found",
      });
    }

    const userAnalytics = await activityModel.find({ createdBy: id }).populate({
      path: "goalId",
      populate: {
        path: "createdBy",
      },
    });

    if (!userAnalytics || userAnalytics.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Analytics Not Found",
      });
    }

    const analyticsModified = userAnalytics.map((data) => {
      return {
        _id: data._id,
        fullName: data.goalId.createdBy?.fullName,
        email: data.goalId.createdBy?.email,
        Image: data.goalId.createdBy?.Image,
        otpVerified: data.goalId.createdBy?.otpVerified,
        userVerified: data.goalId.createdBy?.userVerified,
        userType: data.goalId.createdBy?.userType,
        parentId: data.goalId.createdBy?.parentId,
        childId: data.goalId.createdBy?.childId,
        isActive: data.goalId.createdBy?.isActive,
        DateOfBirth: data.goalId.createdBy?.DateOfBirth,
        userDisabled: data.goalId.createdBy?.userDisabled,
        CourtSize: data.goalId.createdBy?.CourtSize,
        activityEachWeek: data.goalId.activityEachWeek,
        shotEachWeek: data.goalId.shotEachWeek,
        freeThrowEachWeek: data.goalId.freeThrowEachWeek,
        correctShorts: data.goalId.correctShorts,
        percentageShot: data.goalId.percentageShot,
        percentageFreeThrows: data.goalId.percentageFreeThrows,
        goalCreatedAt: data.goalCreatedAt,
        share: data.share,
      };
    });

    // Create an object to store consolidated user data
    // const consolidatedUsers = {};

    // // Iterate through the analytics data and combine user data and their goals
    // for (const user of analyticsModified) {
    //   const userEmail = user.email; // get user email for comparison

    //   // If the user already exists in the consolidatedUsers object, combine their goals
    //   if (consolidatedUsers[userEmail]) {
    //     // Check if the goal doesn't already exist before adding it
    //     for (const goal of user.childGoal) {
    //       if (!consolidatedUsers[userEmail].childGoal.includes(goal)) {
    //         consolidatedUsers[userEmail].childGoal.push(goal);
    //       }
    //     }
    //   } else {
    //     // If the user doesn't exist, add them to the consolidatedUsers object
    //     consolidatedUsers[userEmail] = { ...user }; // Create a shallow copy of the user object
    //   }
    // }
    // // Convert the consolidatedUsers object back to an array

    // const consolidatedUsersArray = Object.values(consolidatedUsers);

    return res.status(200).json({
      success: true,
      message: "User Analytics Found Successfully",
      data: analyticsModified,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//payment management system

export const getAllPayment = async (req, res) => {
  try {
    const { user_id } = req.user;

    const userfind = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!userfind) {
      return res.status(400).json({
        success: false,
        message: "Admin Not Found",
      });
    }

    const currentDate = Date.now();

    const getPayments = await purchaseModel.aggregate([
      {
        $match: {
          subscriptionLevel: { $in: ["Basic", "BASIC_PLUS", "BASIC_PREMIUM"] },
          expirationDate: { $gte: currentDate }, // Only include active subscriptions
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m",
              date: { $toDate: "$purchaseDate" },
            },
          }, // Group by expiration date
          totalAmount: { $sum: "$price" },
        },
      },
    ]);

    console.log(getPayments, "getPayments");

    const monthlyEarnings = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      year: new Date().getFullYear(),
      totalAmount: 0,
    }));

    // Populate monthly earnings with the aggregated total amounts
    if (getPayments.length > 0) {
      getPayments.forEach((payment) => {
        const [year, month] = payment._id.split("-");
        const monthIndex = parseInt(month, 10) - 1; // Convert month to 0-indexed
        if (monthlyEarnings[monthIndex]) {
          monthlyEarnings[monthIndex].totalAmount += payment.totalAmount; // Add the totalAmount for the month
        }
      });
    }

    console.log(monthlyEarnings);

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const modifiedData = monthlyEarnings.map(({ month, totalAmount }) => ({
      x: monthNames[month - 1],
      y: totalAmount,
    }));
    return res.status(200).json({
      success: true,
      message: "Monthly Payments Found Successfully",
      data: modifiedData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//user disabled

export const userDisabled = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { userId } = req.params;

    const admin = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Admin Not Found",
      });
    }

    const user = await authModel.findById(userId);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User Not Found",
      });
    }

    user.userDisabled = !user.userDisabled;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "User Disabled Successfully",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//get android and ios user
export const getAndroidAndIosUser = async (req, res) => {
  try {
    const { user_id } = req.user;

    const admin = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Admin Not Found",
      });
    }

    //android user

    const androidUser = await authModel.find({
      deviceType: "android",
    });

    //ios user
    const iosUser = await authModel.find({
      deviceType: "ios",
    });

    if (androidUser.length === 0 && iosUser.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Andriod and Ios User Not Available",
      });
    }

    if (androidUser.length === 0) {
      return res.status(200).json({
        success: false,
        message: "Ios User Available",
        data: {
          iosUser,
          androidUser,
        },
      });
    }

    if (iosUser.length === 0) {
      return res.status(200).json({
        success: false,
        message: "Android User Available",
        data: {
          androidUser,
          iosUser,
        },
      });
    }
    res.status(200).json({
      success: true,
      message: "Andriod and Ios User Found Successfully",
      data: {
        androidUser,
        iosUser,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//token valid

export const tokenValid = async (req, res) => {
  try {
    const { user_id } = req.user;
    const user = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Admin Not Found",
      });
    }

    const newToken = jwt.sign({ user_id: user._id }, process.env.SECRET_KEY, {
      expiresIn: "1d",
    });

    return res.status(200).json({
      success: true,
      message: "Token is Valid",
      data: newToken,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//send notification
export const SendNotification = async (req, res) => {
  try {
    const { user_id } = req.user;
    const admin = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Admin Not Found",
      });
    }
    const { title, body, tokenList } = req.body;

    if (!title) {
      return res.status(400).json({
        status: false,
        message: "Title Not Provide",
      });
    }
    if (!body) {
      return res.status(400).json({
        status: false,
        message: "Body Not Provide",
      });
    }
    if (!tokenList) {
      return res.status(400).json({
        status: false,
        message: "TokenList Not Provide",
      });
    }
    for (let item of tokenList) {
      // Find the user based on the device token
      const deviceToken = item.deviceToken;
      const user = await authModel.findOne({ deviceToken: deviceToken });

      console.log(`Device Token: ${item.deviceToken}`);
      console.log(`User ID: ${user ? user._id : "Not Found"}`);

      if (!user) {
        // Handle the case where the user with the device token is not found
        console.log(`User not found for deviceToken: ${item.deviceToken}`);
        return res.status(400).json({
          success: false,
          message: "User Not Found For Device Token",
        });
      } else {
        const notificationObj = {
          deviceToken: item.deviceToken,
          title: title,
          body: body,
          authId: user._id,
        };
        // Send push notification and handle errors
        try {
          await pushNotification(notificationObj);
        } catch (pushError) {
          console.error("Push Notification Error:", pushError.message);
          // Handle push notification error as needed
        }
        // Save the notification data to your Notification model
        const notification = new notificationModel(notificationObj);
        await notification.save();
      }
    }

    return res.status(200).json({
      success: true,
      message: "Notification Send Successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

//count user

export const countUser = async (req, res) => {
  try {
    const { user_id } = req.user;
    const admin = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Admin not found",
      });
    }

    console.log("userid", user_id);
    const count = await authModel.countDocuments({
      _id: { $ne: user_id },
    });
    console.log("count", count);

    if (!count) {
      return res.status(400).json({
        success: false,
        message: "Users not count",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Users Count Successfully",
      data: count,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

//get user feed back

export const getUserFeedBack = async (req, res) => {
  try {
    const { user_id } = req.user;
    const admin = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Admin not found",
      });
    }

    const getfeedback = await feedbackModel.find().populate("createdBy");

    if (!getfeedback) {
      return res.status(400).json({
        success: false,
        message: "feed back not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "feed back found successfully",
      data: getfeedback,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//update password

export const changePassword = async (req, res) => {
  try {
    const { user_id } = req.user;
    const admin = await authModel.findOne({
      _id: user_id,
      userType: "admin",
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Admin not found",
      });
    }
    console.log(admin);

    const { password, previousPassword } = req.body;

    // Verify that the provided previous password matches the stored password
    if (!bcrypt.compareSync(previousPassword, admin.password)) {
      // loggerError.error("Please enter the correct previous password");
      return res.status(400).json({
        success: false,
        message: "Please enter the correct previous password",
      });
    }

    // Check if the new password and confirmation password match
    // if (password !== confirmPassword) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Your passwords do not match",
    //   });
    // }

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

    console.log("after", change);
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
