import authModel from "../model/authModel.js";
import builtInGuideModel from "../model/builtInGuideModel.js";
import libraryModel from "../model/libraryModel.js";
// import { loggerInfo, loggerError } from "../utils/log.js";

//user library

export const userLibrary = async (req, res) => {
  try {
    const { user_id } = req.user;
    const userfind = await authModel.findOne({
      _id: user_id,
    });
    if (!userfind) {
      // loggerError.error("child not found");
      return res.status(400).json({
        success: false,
        message: "User Not Found",
      });
    }

    if (userfind.userType === "admin") {
      return res.status(403).json({
        success: false,
        message: "Access Denied For Admin Users",
      });
    }

    const findCategory = await libraryModel.find();

    console.log(findCategory);
    if (!findCategory || findCategory.length === 0) {
      // loggerError.error("category not found");
      return res.status(400).json({
        success: false,
        message: "Category Not Found",
      });
    }
    // delete findCategory.videoUploadedBy
    const modifiedCategory = findCategory.map((item) => {
      return {
        _id: item._id,
        dribblingVideo: item.dribblingVideo,
        shootingVideo: item.shootingVideo,
        passingVideo: item.passingVideo,
        reboundingVideo: item.reboundingVideo,
        defenseVideo: item.defenseVideo,
        speedVideo: item.speedVideo,
        mentalStrengthVideo: item.mentalStrengthVideo,
      };
    });
    return res.status(200).json({
      success: true,
      message: `Videos of Category Retrieved Successfully`,
      data: findCategory,
    });
  } catch (error) {
    // loggerError.error("Internal server error", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//get guide

export const getGuide = async (req, res) => {
  try {
    const { user_id } = req.user;
    const userfind = await authModel.findOne({
      _id: user_id,
    });
    if (!userfind) {
      // loggerError.error("child not found");
      return res.status(400).json({
        success: false,
        message: "User Not Found",
      });
    }

    if (userfind.userType === "admin") {
      return res.status(403).json({
        success: false,
        message: "Access Denied For Admin Users",
      });
    }

    const getGuide = await builtInGuideModel.find();

    const modifiedGuide = getGuide.map((item) => {
      return {
        _id: item._id,
        builtInGuide: item.builtInGuide,
      };
    });

    if (!modifiedGuide || modifiedGuide.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Built In Guide not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Built In Guide found successfully",
      data: modifiedGuide,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
