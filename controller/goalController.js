import authModel from "../model/authModel.js";
import goalModel from "../model/goalModel.js";
// import { loggerInfo, loggerError } from "../utils/log.js";
import activityModel from "../model/activityAnalyticsModel.js";
import shootingGameModel from "../model/shootingGameModel.js";

//create goals

export const createGoals = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { activityEachWeek, shotEachWeek, freeThrowEachWeek } = req.body;

    // Find user

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

    const userType = userfind.userType;

    if (userType === "parent") {
      return res.status(400).json({
        success: false,
        message: "parent not allowed to goal set",
      });
    }
    if (!activityEachWeek) {
      return res.status(400).json({
        success: false,
        message: "activityEachWeek not provide",
      });
    }

    if (!shotEachWeek) {
      return res.status(400).json({
        success: false,
        message: "shotEachWeek not provide",
      });
    }

    if (!freeThrowEachWeek) {
      return res.status(400).json({
        success: false,
        message: "freeThrowEachWeek not provide",
      });
    }

    let minutesSpot = parseInt(activityEachWeek);
    let totalTimeInSecondsSpot = minutesSpot * 60;
    const totalTimeInMillisecondsSpot = totalTimeInSecondsSpot * 1000;

    const creategoals = new goalModel({
      createdBy: user_id,
      activityEachWeek: totalTimeInMillisecondsSpot,
      shotEachWeek,
      freeThrowEachWeek,
    });

    // Save goals
    const savegoals = await creategoals.save();
    if (!savegoals) {
      // loggerError.error("Failed to save goals");
      return res.status(400).json({
        success: false,
        message: "Failed to save goals",
      });
    }

    const newStartTime = Date.now();
    const analyticsEntry = new activityModel({
      goalId: savegoals._id,
      createdBy: user_id,
      goalCreatedAt: newStartTime, // Store time in milliseconds
    });

    const saveAnalyticsEntry = await analyticsEntry.save();

    if (!saveAnalyticsEntry) {
      // loggerError.error("Failed to save analytic entry");
      return res.status(400).json({
        success: false,
        message: "Failed to save analytic entry",
      });
    }

    await authModel.updateOne(
      { _id: user_id },
      {
        $addToSet: {
          childGoal: savegoals._id,
          childAnalytics: saveAnalyticsEntry._id,
        },
      }
    );

    // loggerInfo.info("Goal saved successfully");
    return res.status(200).json({
      success: true,
      message: "Goal Saved Successfully",
      data: savegoals,
      analytics: saveAnalyticsEntry,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//get all shooting stats

export const getAllShootingStats = async (req, res) => {
  try {
    const { user_id } = req.user;

    const userfind = await authModel.findOne({
      _id: user_id,
    });

    if (!userfind) {
      return res.status(400).json({
        success: false,
        message: "User Not Found",
      });
    }

    const shootinggames = await shootingGameModel.find({ authId: user_id });

    let totalShots = 0;
    let totalWorkoutsTime = 0;
    let totalPenalty = 0;

    //sum overall shorts

    shootinggames.forEach((item) => {
      item.spotSelection.forEach((data) => {
        totalShots += data.attempts;
      });
    });

    //sum overall workout time

    const uniqueWorkoutDocuments = {};

    shootinggames.forEach((game) => {
      console.log(game.playingAt, "playingat");
      if (!uniqueWorkoutDocuments[game.playingAt]) {
        uniqueWorkoutDocuments[game.playingAt] = {
          totalWorkoutsTime: game.totalWorkOutTime,
        };
      }
    });

    console.log(shootinggames);

    //sum overall penalty shots

    shootinggames.forEach((item) => {
      item.penaltySpot.forEach((data) => {
        totalPenalty += data.attempts;
      });
    });

    console.log(uniqueWorkoutDocuments, "uniqueWorkoutDocuments");

    // Extract values and process them
    // Extract and accumulate totalWorkoutsTime values

    for (const key in uniqueWorkoutDocuments) {
      const value = uniqueWorkoutDocuments[key].totalWorkoutsTime;
      totalWorkoutsTime += value;
    }
    return res.status(200).json({
      success: true,
      message: "shooting found successfully",
      data: {
        totalShots,
        totalWorkoutsTime: totalWorkoutsTime,
        totalPenalty,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//update goals

export const updateGoals = async (req, res) => {
  try {
    const { activityEachWeek, shotEachWeek, freeThrowEachWeek } = req.body;
    const { user_id } = req.user;
    const { id } = req.params;
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

    //update goals

    const updategoals = await goalModel.findByIdAndUpdate(
      id,
      {
        activityEachWeek,
        shotEachWeek,
        freeThrowEachWeek,
      },
      {
        new: true,
      }
    );
    if (!updategoals) {
      // loggerError.error("goals not update");
      return res.status(400).json({
        success: false,
        message: "Goals Not Update",
      });
    }

    // loggerInfo.info("Goals Update Successfully");
    return res.status(200).json({
      success: true,
      message: "Goals Update Successfully",
      data: updategoals,
    });
  } catch (error) {
    // loggerError.error("internal server error", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//get analytics

export const getAnalytics = async (req, res) => {
  try {
    const { user_id } = req.user;

    const userfind = await authModel.findOne({
      _id: user_id,
    });

    if (!userfind) {
      return res.status(400).json({
        success: false,
        message: "User Not Found",
      });
    }

    const now = new Date();
    const oneDayInMilliseconds = 24 * 60 * 60 * 1000; // 1 day in milliseconds
    const currentWeekStart = new Date(
      now - now.getDay() * oneDayInMilliseconds
    ).setHours(0, 0, 0, 0);
    const previousWeekStart = currentWeekStart - 7 * oneDayInMilliseconds;

    // Querying current weekly goals
    const currentWeeklyGoals = await activityModel
      .find({
        goalCreatedAt: { $gte: currentWeekStart },
        createdBy: user_id,
      })
      .sort({ goalCreatedAt: -1 })
      .limit(1)
      .populate("goalId");

    // Querying previous weekly goals
    const previousWeeklyGoals = await activityModel
      .find({
        goalCreatedAt: { $gte: previousWeekStart, $lt: currentWeekStart },
        createdBy: user_id,
      })
      .sort({ goalCreatedAt: -1 })
      .limit(1)
      .populate("goalId");

    // Querying current weekly shootings
    const currentWeeklyShootings = await activityModel
      .find({
        shootingCreatedAt: { $gte: currentWeekStart },
        createdBy: user_id,
      })
      .populate("shootingId");

    // Querying previous weekly shootings
    const previousWeeklyShootings = await activityModel
      .find({
        shootingCreatedAt: { $gte: previousWeekStart, $lt: currentWeekStart },
        createdBy: user_id,
      })
      .populate("shootingId");

    // Initialize variables for current weekly goals
    let currentWeeklyGoalsData = {};
    if (currentWeeklyGoals.length > 0) {
      const latestCurrentGoal = currentWeeklyGoals[0];
      currentWeeklyGoalsData = {
        overallGoalTime: latestCurrentGoal.goalId.activityEachWeek,
        overallGoalShots: latestCurrentGoal.goalId.shotEachWeek,
        overallGoalFreeThrow: latestCurrentGoal.goalId.freeThrowEachWeek,
      };
    }

    // Initialize variables for previous weekly goals
    let previousWeeklyGoalsData = {};
    if (previousWeeklyGoals.length > 0) {
      const latestPreviousGoal = previousWeeklyGoals[0];
      previousWeeklyGoalsData = {
        overallGoalTime: latestPreviousGoal.goalId.activityEachWeek,
        overallGoalShots: latestPreviousGoal.goalId.shotEachWeek,
        overallGoalFreeThrow: latestPreviousGoal.goalId.freeThrowEachWeek,
      };
    }

    // Initialize session-wise statistics
    let sessionStats = {};
    let overallShootingShots = 0;
    let overallShootingFreeThrow = 0;
    let totalWorkOutTime = 0;

    // Calculating values for current weekly shootings
    for (const item of currentWeeklyShootings) {
      console.log(item, "item.shootingId");

      const sessionTime = item.shootingId.playingAt; // Assuming playingAt holds session time
      // console.log(item.shootingId?.playingAt,'item.shootingId.playingAt');

      if (!sessionStats[sessionTime]) {
        sessionStats[sessionTime] = {
          totalWorkOutTime: 0,
        };
      }

      item.shootingId.spotSelection.forEach((spot) => {
        overallShootingShots += spot.attempts;
      });

      item.shootingId.penaltySpot.forEach((spot) => {
        overallShootingFreeThrow += spot.attempts;
      });

      sessionStats[sessionTime].totalWorkOutTime =
        item.shootingId.totalWorkOutTime;
    }

    totalWorkOutTime = Object.values(sessionStats).reduce(
      (total, currentValue) => total + currentValue.totalWorkOutTime,
      0
    );

    const currentWeeklyShootingsData = {
      overallShootingTime: totalWorkOutTime,
      overallShootingShots,
      overallShootingFreeThrow,
    };

    // Reset variables for previous weekly shootings
    sessionStats = {};
    overallShootingShots = 0;
    overallShootingFreeThrow = 0;
    totalWorkOutTime = 0;

    // Calculating values for previous weekly shootings
    for (const item of previousWeeklyShootings) {
      console.log(item.shootingId, "item.shootingId");
      // return ""
      const sessionTime = item.shootingId?.playingAt; // Assuming playingAt holds session time

      if (!sessionStats[sessionTime]) {
        sessionStats[sessionTime] = {
          totalWorkOutTime: 0,
        };
      }

      item.shootingId?.spotSelection.forEach((spot) => {
        overallShootingShots += spot.attempts;
      });

      item.shootingId?.penaltySpot.forEach((spot) => {
        overallShootingFreeThrow += spot.attempts;
      });

      sessionStats[sessionTime].totalWorkOutTime =
        item.shootingId?.totalWorkOutTime;
    }

    totalWorkOutTime = Object.values(sessionStats).reduce(
      (total, currentValue) => total + currentValue.totalWorkOutTime,
      0
    );

    const previousWeeklyShootingsData = {
      overallShootingTime: totalWorkOutTime,
      overallShootingShots,
      overallShootingFreeThrow,
    };

    // Checking if any data is found for current or previous weeks
    if (
      currentWeeklyGoals.length === 0 &&
      previousWeeklyGoals.length === 0 &&
      currentWeeklyShootings.length === 0 &&
      previousWeeklyShootings.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "No goals and shooting found for the current and previous week",
      });
    } else if (
      previousWeeklyGoals.length === 0 &&
      previousWeeklyShootings.length === 0
    ) {
      return res.status(200).json({
        success: true,
        message: "No goals and shooting found for the previous week",
        data: {
          currentWeeklyGoalsData,
          currentWeeklyShootingsData,
        },
      });
    } else if (
      currentWeeklyGoals.length === 0 &&
      currentWeeklyShootings.length === 0
    ) {
      return res.status(200).json({
        success: true,
        message: "No goals and shooting found for the current week",
        data: {
          currentWeeklyGoalsData,
          previousWeeklyGoalsData,
          previousWeeklyShootingsData,
        },
      });
    } else {
      return res.status(200).json({
        success: true,
        message: "Goals and shooting found successfully",
        data: {
          currentWeeklyGoalsData,
          previousWeeklyGoalsData,
          currentWeeklyShootingsData,
          previousWeeklyShootingsData,
        },
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//get data by date

export const getdatabydate = async (req, res) => {
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

    const getdata = await activityModel
      .find({ createdBy: user_id })
      .populate("goalId");

    return res.status(200).json({
      success: true,
      message: "Data found Successfully",
      data: getdata,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
