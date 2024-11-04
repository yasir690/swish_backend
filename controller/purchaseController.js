import authModel from "../model/authModel.js";
import purchaseModel from "../model/purchaseModel.js";

//createPurchase
// import { loggerInfo, loggerError } from "../utils/log.js";

//get purchase by user id

export const getPurchaseByUser = async (req, res) => {
  try {
    const { user_id } = req.user;
    const findUser = await authModel.findOne({ _id: user_id });
    if (!findUser) {
      return res.status(400).json({
        success: false,
        message: "User Not Found",
      });
    }

    const userType = findUser.userType;

    if (userType == "mySelf") {
      const getPurchase = await purchaseModel

        .find({ mySelfId: findUser._id })
        .populate("mySelfId");

      console.log(getPurchase);

      if (!getPurchase) {
        // loggerError.error("purchase not found");
        return res.status(400).json({
          success: false,
          message: "Purchase Not Found",
        });
      }

      // loggerInfo.info("purchase found successfully");

      return res.status(200).json({
        success: true,
        message: "Purchase Found Successfully",
        data: getPurchase,
      });
    } else if (userType == "parent") {
      const getPurchase = await purchaseModel

        .find({ parentId: findUser._id })
        .populate("parentId");

      console.log(getPurchase);

      if (!getPurchase) {
        // loggerError.error("purchase not found");
        return res.status(400).json({
          success: false,
          message: "Purchase Not Found",
        });
      }

      // loggerInfo.info("purchase found successfully");

      return res.status(200).json({
        success: true,
        message: "Purchase Found Successfully",
        data: getPurchase,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "invalid user type",
      });
    }
  } catch (error) {
    // loggerError.error("internal server error", error.message);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const upgradeSubscription = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { SubscriptionLevel, SubscriptionType, price } = req.body;
    const { subscriptionId } = req.params;

    const userfind = await authModel.findById(user_id);

    if (!userfind) {
      return res.status(400).json({
        success: false,
        message: "User Not Found",
      });
    }

    // Check if the child ID exists in the database and belongs to the parent
    // You might want to uncomment and use this logic if you need to validate childId

    // Validate newSubscriptionLevel and newSubscriptionPrice

    if (!SubscriptionLevel || SubscriptionLevel === "FREE") {
      return res.status(400).json({
        success: false,
        message: "Invalid new Subscription Level",
      });
    }

    if (!SubscriptionType) {
      return res.status(400).json({
        success: false,
        message: "Provide Subscription Type",
      });
    }

    if (!price) {
      return res.status(400).json({
        success: false,
        message: "Provide price",
      });
    }

    // Find the existing subscription
    const foundPurchase = await purchaseModel.findById(subscriptionId);
    if (!foundPurchase) {
      return res.status(400).json({
        success: false,
        message: "Subscription id Not Found",
      });
    }

    const expiration = Date.now() + 30 * 24 * 60 * 60 * 1000;
    console.log(expiration, "expiration");
    const currentDate = Date.now();
    const updatesubsription = await purchaseModel.findByIdAndUpdate(
      subscriptionId,
      {
        parentId: user_id,
        subscriptionLevel: SubscriptionLevel,
        subscriptionType: SubscriptionType,
        price: parseInt(price),
        purchaseDate: currentDate,
        expirationDate: expiration,
      },
      {
        new: true,
      }
    );

    if (!updatesubsription) {
      return res.status(400).json({
        success: false,
        message: "Subscription  Not Update",
      });
    }

    return res.status(400).json({
      success: false,
      message: "Subscription Update",
      data: updatesubsription,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
