import authModel from "../model/authModel.js";
import privacyModel from "../model/privacyModel.js";

//get privacy

export const getPrivacy = async (req, res) => {
  try {
    const { user_id } = req.user;

    const userfind = await authModel.findOne({
      _id: user_id,
    });

    if (!userfind) {
      return res.status(400).json({
        success: false,
        message: "user Not Found",
      });
    }
    const privacy = await privacyModel.find();

    if (!privacy) {
      return res.status(400).json({
        success: false,
        message: "Privacy Not Found",
      });
    }
    return res.status(201).json({
      success: true,
      message: "Privacy Policy Found Successfully",
      data: privacy,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
