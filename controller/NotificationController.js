import notificationModel from "../model/notificationModel.js";
import authModel from "../model/authModel.js";

//get all notification

export const getAllNotification = async (req, res) => {
  try {
    const { user_id } = req.user;

    //userfind

    const userfind = await authModel.findOne({
      _id: user_id,
    });

    if (!userfind) {
      return res.status(400).json({
        success: false,
        message: "User Not Found",
      });
    }

    const getallnotification = await notificationModel.find({
      authId: user_id,
    });

    console.log(getallnotification);
    if (!getallnotification || getallnotification.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Notification Not Found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Notification Found Successfully",
      data: getallnotification,
    });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//read notification

export const readNotification = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { id } = req.params;
    //userfind

    const userfind = await authModel.findOne({
      _id: user_id,
    });

    if (!userfind) {
      return res.status(400).json({
        success: false,
        message: "User Not Found",
      });
    }

    const read = await notificationModel.findByIdAndUpdate(
      id,
      {
        isRead: true,
      },
      { new: true }
    );

    if (!read) {
      return res.status(400).json({
        success: false,
        message: "Notification Not Read",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Notification Read Successfully",
      data: read,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//notification on and off
export const notificationOnAndOff = async (req, res) => {
  try {
    const { user_id } = req.user;
    //userfind

    const userfind = await authModel.findOne({
      _id: user_id,
    });

    if (!userfind) {
      return res.status(400).json({
        success: false,
        message: "User Not Found",
      });
    }

    userfind.notificationOnAndOff = !userfind.notificationOnAndOff;

    await userfind.save();

    let message = userfind.notificationOnAndOff
      ? "Notification On Successfully"
      : "Notification Off Successfully";

    return res.status(200).json({
      success: true,
      message: message,
      data: userfind,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
