import mongoose from "mongoose";
import authModel from "../model/authModel.js";
import friendModel from "../model/FriendsModel.js";
import notificationModel from "../model/notificationModel.js";
import shootingGameModel from "../model/shootingGameModel.js";
import pushNotification from "../middleware/pushNotifcation.js";

//add friends

export const addFriendRequest = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { friendId } = req.body;

    const user = await authModel.findById(user_id);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "user not found",
      });
    }

    // Check if the friendId is a valid user
    const findfriend = await authModel.findById(friendId);

    console.log(findfriend.fullName);

    console.log(user);

    if (!findfriend) {
      return res.status(400).json({
        success: false,
        message: "Friend not found",
      });
    }

    const findParent = await authModel.findOne({
      _id: friendId,
      userType: "parent",
    });

    if (findParent) {
      return res.status(400).json({
        success: false,
        message: "parent cannot be added as a friend",
      });
    }

    // Check if the user is not trying to add themselves
    if (user._id.equals(findfriend._id)) {
      return res.status(400).json({
        success: false,
        message: "User cannot add themselves",
      });
    }

    // Check if the user is not already friends with the target user
    const existingFriend = await friendModel.findOne({
      $or: [
        { userId: user_id, friendId: findfriend._id, status: "accepted" },
        { userId: findfriend._id, friendId: user_id, status: "accepted" },
      ],
    });

    if (existingFriend) {
      return res.status(400).json({
        success: false,
        message: "User is already your friend",
      });
    }

    // Check if there is already a pending friend request
    const pendingRequest = await friendModel.findOne({
      userId: user._id,
      friendId: findfriend._id,
      status: "pending",
    });

    if (pendingRequest) {
      return res.status(400).json({
        success: false,
        message: "Friend request is already pending",
      });
    }

    const newFriendship = new friendModel({
      userId: user._id,
      friendId: findfriend._id,
      status: "pending",
    });

    const saveNewFriendship = await newFriendship.save();

    // create notification to the friend about the friend request
    const newNotification = new notificationModel({
      authId: findfriend._id,
      title: "friend request",
      body: `You have a new friend request from ${user.fullName}.`,
    });

    await newNotification.save();

    //send notification to the friend for sending request

    const notificationObj = {
      deviceToken: user.deviceToken,
      title: "friend request",
      body: `You have a new friend request from ${user.fullName}.`,
    };

    try {
      await pushNotification(notificationObj);
    } catch (error) {
      console.log(error.message);
    }

    return res.status(200).json({
      success: true,
      message: "Friend request sent successfully",
      data: saveNewFriendship,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// handle friend request action (accept or reject).

export const RequestAcceptOrReject = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { friendRequestId, status } = req.body;
    const user = await authModel.findById(user_id);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "user not found",
      });
    }

    const friendRequest = await friendModel.findOne({
      _id: friendRequestId,
    });

    if (!friendRequest) {
      return res.status(400).json({
        success: false,
        message: "Friend request not found",
      });
    }

    const initiatorUserId = friendRequest.userId;

    console.log(initiatorUserId, "initiatorUserId");

    if (initiatorUserId.equals(user_id)) {
      return res.status(400).json({
        success: false,
        message: "User cannot accept their own friend request",
      });
    }

    if (friendRequest.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Invalid friend request status",
      });
    }

    if (status === "accepted") {
      friendRequest.status = "accepted";
      await friendRequest.save();

      // Send notification to the user who initiated the friend request

      const initiatorUserId = friendRequest.userId;
      const initiatorFriendId = friendRequest.friendId;

      const initiatorFriendIds = await authModel.findById(initiatorFriendId);
      const initiatorUserIds = await authModel.findById(initiatorUserId);
      console.log(initiatorUserIds, "initiatorUserIds");
      console.log(initiatorFriendIds, "initiatorFriendIds");
      //  return ""
      const newNotification = new notificationModel({
        authId: initiatorUserId,
        title: "notification accepted",
        body: `${user.fullName} has accepted your friend request.`,
      });

      await newNotification.save();

      const Notification = new notificationModel({
        authId: initiatorUserId,
        title: "notification accepted",
        body: `${user.fullName} has now your friend`,
      });

      await Notification.save();

      const Notifications = new notificationModel({
        authId: initiatorFriendId,
        title: "notification accepted",
        body: `${initiatorUserIds.fullName} has now your friend`,
      });

      await Notifications.save();

      const notificationObj = {
        deviceToken: user.deviceToken,
        title: "notification accepted",
        body: `${user.fullName} has accepted your friend request.`,
      };

      try {
        await pushNotification(notificationObj);
      } catch (error) {
        console.log(error.message);
      }

      return res.status(200).json({
        success: true,
        message: "Friend request accepted",
        data: friendRequest,
      });
    } else if (status === "rejected") {
      console.log(friendRequest, "friendRequest");
      // return ""
      friendRequest.status = "rejected";
      await friendRequest.save();

      // await friendRequest.remove(); // Remove the friend request
      // Send notification to the user who initiated the friend request
      const initiatorUserId = friendRequest.userId;
      const newNotification = new notificationModel({
        authId: initiatorUserId,
        title: "rejected request",
        body: `${user.fullName} has rejected your friend request.`,
      });

      await newNotification.save();

      const notificationObj = {
        deviceToken: user.deviceToken,
        title: "rejected request",
        body: `${user.fullName} has rejected your friend request.`,
      };

      try {
        await pushNotification(notificationObj);
      } catch (error) {
        console.log(error.message);
      }

      const deleterequest = await friendModel.findByIdAndDelete(
        friendRequest._id
      );

      return res.status(200).json({
        success: true,
        message: "Friend request rejected",
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//get all friends

export const getAllFriends = async (req, res) => {
  try {
    const { user_id } = req.user;

    const user = await authModel.findById(user_id);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "user not found",
      });
    }

    const getFriends = await friendModel
      .find({
        $or: [
          { userId: user_id, status: "accepted" },
          { friendId: user_id, status: "accepted" },
        ],
      })
      .populate({
        path: "userId",
        match: { _id: { $ne: user_id } }, // Exclude the logged-in user's data
      })
      .populate({
        path: "friendId",
        match: { _id: { $ne: user_id } }, // Exclude the logged-in user's data
      });
    // .populate(['userId','friendId']);

    if (!getFriends || getFriends.length === 0) {
      return res.status(400).json({
        success: false,
        message: "friends not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "friends found successfully",
      data: getFriends,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//get user by search name

export const getUserBySearchName = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { name } = req.query;
    const user = await authModel.findById(user_id);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "user not found",
      });
    }

    const users = await authModel.find({
      _id: { $ne: user_id },
      userType: { $ne: "parent" },
      userName: { $regex: name, $options: "i" }, // Case-insensitive search by name
    });

    if (!users || users.length === 0) {
      return res.status(400).json({
        success: false,
        message: "users not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "user found successfully",
      data: users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//get total short and correct shorts of friends

export const getStatsOfFriend = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { friendId } = req.params;
    // console.log(Id);
    const user = await authModel.findById(user_id);

    console.log(user, "user");
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "user not found",
      });
    }

    let totalshorts = 0;
    let totalfreethrow = 0;
    let totalworkouttime = 0;
    let userName = "";

    const finduser = await authModel.findById(friendId);

    userName = finduser.userName;
    const findfriend = await friendModel.findOne({
      $or: [
        { friendId: friendId, userId: user_id, status: "accepted" },
        { friendId: user_id, userId: friendId, status: "accepted" },
      ],
    });

    if (!findfriend) {
      return res.status(400).json({
        success: false,
        message: "friend not found",
      });
    }
    const findshooting = await shootingGameModel.find({ authId: friendId });

    //sum overall workout time

    const uniqueWorkoutDocuments = {};

    findshooting.forEach((item) => {
      item.spotSelection.forEach((data) => {
        totalshorts += data.attempts;
      });
      item.penaltySpot.forEach((data) => {
        totalfreethrow += data.attempts;
      });
      if (!uniqueWorkoutDocuments[item.playingAt]) {
        uniqueWorkoutDocuments[item.playingAt] = {
          totalworkouttime: item.totalWorkOutTime,
        };
      }
    });
    console.log(findshooting);

    if (!findshooting || findshooting.length === 0) {
      return res.status(400).json({
        success: false,
        message: "stats not found",
      });
    }
    for (const key in uniqueWorkoutDocuments) {
      const value = uniqueWorkoutDocuments[key].totalworkouttime;
      totalworkouttime += value;
    }

    return res.status(200).json({
      success: true,
      message: "stats found successfully",
      data: {
        totalShorts: totalshorts,
        totalworkouttime: totalworkouttime,
        totalfreethrow: totalfreethrow,
        userName: userName,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//get all pending and accepted request

export const getAllPendingRequest = async (req, res) => {
  try {
    const { user_id } = req.user;
    const user = await authModel.findById(user_id);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "user not found",
      });
    }

    const getallpendingandacceptedrequest = await friendModel
      .find({
        friendId: user_id,
        status: "pending",
      })
      .populate(["userId"])
      .select({ friendId: 0 });

    if (!getallpendingandacceptedrequest) {
      return res.status(400).json({
        success: false,
        message: "request not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "request found successfully",
      data: getallpendingandacceptedrequest,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
