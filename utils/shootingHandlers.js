import shootingGameModel from "../model/shootingGameModel.js";
import authModel from "../model/authModel.js";
import purchaseModel from "../model/purchaseModel.js";
// import { loggerInfo, loggerError } from "../utils/log.js";
import pushNotification from "../middleware/pushNotifcation.js";
import notificationModel from "../model/notificationModel.js";
import activityModel from "../model/activityAnalyticsModel.js";
import shootingHistoryModel from "../model/shootingHistoryModel.js";

export const SingleShotEntry = async (req, res) => {
  try {
    const { Method, gameType, makes, attempts, totalWorkOutTime } = req.body;
    const { user_id } = req.user;
    const userfind = await authModel.findOne({ _id: user_id });

    if (
      userfind.userType !== "parent" &&
      userfind.userType !== "child" &&
      userfind.userType !== "mySelf"
    ) {
      return res.status(400).json({
        success: false,
        message: "only parent and its child can play this game",
      });
    }

    const spotSelection = req.body.spotSelection;

    const penaltySpot = req.body.penaltySpot;

    if (spotSelection && penaltySpot.length === 0) {
      // Validate spotSelection
      if (!Array.isArray(spotSelection)) {
        return res.status(400).json({
          success: false,
          message: "spotSelection should be an array.",
        });
      }

      // Iterate through the spotSelection array
      for (const spot of spotSelection) {
        const makes = parseInt(spot.makes, 10);
        const attempts = parseInt(spot.attempts, 10);
        if (makes > attempts) {
          return res.status(400).json({
            success: false,
            message: "Makes cannot be greater than attempts.",
          });
        }
      }

      const newStartTimeSpot = Date.now();

      const spotResults = [];

      // Iterate through the spotSelection array to calculate spot statistics
      for (const spot of spotSelection) {
        const makes = spot.makes;
        const attempts = spot.attempts;
        const spotAvg = (makes / attempts) * 100;
        const spotFreeThrow = 100 - spotAvg;

        const spotStat = {
          spot: spot.spot,
          makes: makes,
          attempts: attempts,
          shorts: `${Math.round(spotAvg)}%`,
          freeThrow: `${Math.round(spotFreeThrow)}%`,
        };

        spotResults.push(spotStat);
      }

      // Calculate overall statistics
      let total_makes_spot = 0;
      let total_attempts_spot = 0;

      for (const spotStat of spotResults) {
        total_makes_spot += spotStat.makes;
        total_attempts_spot += spotStat.attempts;
      }

      const overallAvgSpot =
        total_attempts_spot !== 0
          ? (total_makes_spot / total_attempts_spot) * 100
          : 0;
      const overallFreeThrowSpot = 100 - overallAvgSpot;

      // Check if newMakes and newAttempts are valid numbers
      if (isNaN(total_makes_spot) || isNaN(total_attempts_spot)) {
        console.log(
          "Invalid values for makes or attempts:",
          total_makes_spot,
          total_attempts_spot
        );
        return res.status(400).json({
          success: false,
          message: "Invalid values for makes or attempts.",
        });
      }

      //

      let timePartsSpot = totalWorkOutTime.split(":");
      let hoursSpot = parseInt(timePartsSpot[0]);
      let minutesSpot = parseInt(timePartsSpot[1]);
      let secondsSpot = parseInt(timePartsSpot[2]);
      let totalTimeInSecondsSpot =
        hoursSpot * 3600 + minutesSpot * 60 + secondsSpot;

      const totalTimeInMillisecondsSpot = totalTimeInSecondsSpot * 1000;

      //

      // Create a spot game model and save it

      const shootinggamespot = new shootingGameModel({
        gameType,
        Method,
        authId: user_id,
        playingAt: newStartTimeSpot,
        makes: total_makes_spot,
        attempts: total_attempts_spot,
        shorts: `${Math.round(overallAvgSpot)}%`,
        freeThrow: `${Math.round(overallFreeThrowSpot)}%`,
        spotSelection: spotResults,
        totalWorkOutTime: totalTimeInMillisecondsSpot,
      });

      const saveShootingGameSpot = await shootinggamespot.save();

      //save shooting history

      const createHistory = new shootingHistoryModel({
        spotId: saveShootingGameSpot._id,
        authId: user_id,
        workoutTime: totalTimeInMillisecondsSpot,
        sessionTime: newStartTimeSpot,
        totalSpotMakes: total_makes_spot,
        totalSpotAttempt: total_attempts_spot,
        totalPenaltyMakes: 0,
        totalPenaltyAttempt: 0,
        totalWorkOutTime: totalTimeInMillisecondsSpot,
        Method,
        gameType,
        totalSpotSuccess: `${Math.round(overallAvgSpot)}%`,
        totalPenaltySuccess: "0.00%",
      });

      const saveHistory = await createHistory.save();

      //save in analytics

      const analyticsEntrySpot = new activityModel({
        shootingId: saveShootingGameSpot._id,
        createdBy: user_id,
        shootingCreatedAt: newStartTimeSpot, // Store time in milliseconds
      });

      const saveAnalyticsEntrySpot = await analyticsEntrySpot.save();

      if (!saveAnalyticsEntrySpot) {
        return res.status(400).json({
          success: false,
          message: "analytics not save",
        });
      }

      const totalMakesAndAttempt = {
        Makes: saveShootingGameSpot.makes,
        Attempts: saveShootingGameSpot.attempts,
        shorts: saveShootingGameSpot.shorts,
        freeThrow: saveShootingGameSpot.freeThrow,
      };
      const aroundTheRimsuccessPercentage =
        saveShootingGameSpot.spotSelection.find((obj) => obj.spot == 1)
          .attempts > 0
          ? (saveShootingGameSpot.spotSelection.find((obj) => obj.spot == 1)
              .makes /
              saveShootingGameSpot.spotSelection.find((obj) => obj.spot == 1)
                .attempts) *
            100
          : 0;
      console.log(
        aroundTheRimsuccessPercentage,
        "aroundTheRimsuccessPercentage"
      );

      const aroundTheRimfailurePercentage =
        saveShootingGameSpot.spotSelection.find((obj) => obj.spot == 1)
          .attempts > 0
          ? 100 - aroundTheRimsuccessPercentage
          : 0;

      console.log(
        aroundTheRimsuccessPercentage,
        "aroundTheRimsuccessPercentage"
      );

      const aroundTheRimMakesAndAttempt = {
        Makes: saveShootingGameSpot.spotSelection.find((obj) => obj.spot == 1)
          .makes,
        Attempts: saveShootingGameSpot.spotSelection.find(
          (obj) => obj.spot == 1
        ).attempts,
        shorts: aroundTheRimsuccessPercentage.toFixed(2),
        freeThrow: aroundTheRimfailurePercentage.toFixed(2),
      };

      const shortSpot = [2, 3, 4, 5, 6];

      const shortdata = saveShootingGameSpot.spotSelection
        .filter((item) => shortSpot.includes(item.spot))
        .reduce(
          (acc, obj) => {
            acc.makes += obj.makes || 0;
            acc.attempts += obj.attempts || 0;
            return acc;
          },
          { makes: 0, attempts: 0 }
        ); // Initialize the accumulator with default values
      // Calculate success and failure percentages
      const shortdatasuccessPercentage =
        shortdata.attempts > 0
          ? (shortdata.makes / shortdata.attempts) * 100
          : 0;

      console.log(shortdatasuccessPercentage, "shortdatasuccessPercentage");

      const shortdatafailurePercentage =
        shortdata.attempts > 0 ? 100 - shortdatasuccessPercentage : 0;

      console.log(shortdatafailurePercentage, "shortdatafailurePercentage");

      const midSpot = [7, 8, 9, 10, 11];

      const middata = saveShootingGameSpot.spotSelection
        .filter((item) => midSpot.includes(item.spot))
        .reduce(
          (acc, obj) => {
            acc.makes += obj.makes || 0;
            acc.attempts += obj.attempts || 0;
            return acc;
          },
          { makes: 0, attempts: 0 }
        ); // Initialize the accumulator with default values

      // Calculate success and failure percentages
      const middatasuccessPercentage =
        middata.attempts > 0 ? (middata.makes / middata.attempts) * 100 : 0;

      console.log(middatasuccessPercentage, "middatasuccessPercentage");

      const middatafailurePercentage =
        middata.attempts > 0 ? 100 - middatasuccessPercentage : 0;

      console.log(middatafailurePercentage, "middatafailurePercentage");

      const threeSpot = [12, 13, 14, 15, 16];

      const threedata = saveShootingGameSpot.spotSelection
        .filter((item) => threeSpot.includes(item.spot))
        .reduce(
          (acc, obj) => {
            acc.makes += obj.makes || 0;
            acc.attempts += obj.attempts || 0;
            return acc;
          },
          { makes: 0, attempts: 0 }
        ); // Initialize the accumulator with default values

      // Calculate success and failure percentages
      const threedatasuccessPercentage =
        threedata.attempts > 0 ? (middata.makes / middata.attempts) * 100 : 0;

      console.log(threedatasuccessPercentage, "threedatasuccessPercentage");

      const threedatafailurePercentage =
        threedata.attempts > 0 ? 100 - threedatasuccessPercentage : 0;
      console.log(threedatafailurePercentage, "threedatafailurePercentage");

      const leftSpot = [2, 3, 7, 8, 12, 13];

      const leftdata = saveShootingGameSpot.spotSelection
        .filter((item) => leftSpot.includes(item.spot))
        .reduce(
          (acc, obj) => {
            acc.makes += obj.makes || 0;
            acc.attempts += obj.attempts || 0;
            return acc;
          },
          { makes: 0, attempts: 0 }
        ); // Initialize the accumulator with default values

      // Calculate success and failure percentages
      const leftdatasuccessPercentage =
        leftdata.attempts > 0 ? (middata.makes / middata.attempts) * 100 : 0;

      console.log(leftdatasuccessPercentage, "leftdatasuccessPercentage");

      const leftdatafailurePercentage =
        leftdata.attempts > 0 ? 100 - leftdatasuccessPercentage : 0;

      console.log(leftdatafailurePercentage, "leftdatafailurePercentage");

      const rightSpot = [5, 6, 10, 11, 15, 16];

      const rightdata = saveShootingGameSpot.spotSelection
        .filter((item) => rightSpot.includes(item.spot))
        .reduce(
          (acc, obj) => {
            acc.makes += obj.makes || 0;
            acc.attempts += obj.attempts || 0;
            return acc;
          },
          { makes: 0, attempts: 0 }
        ); // Initialize the accumulator with default values

      // Calculate success and failure percentages
      const rightdatasuccessPercentage =
        rightdata.attempts > 0 ? (middata.makes / middata.attempts) * 100 : 0;

      console.log(rightdatasuccessPercentage, "rightdatasuccessPercentage");

      const rightdatafailurePercentage =
        rightdata.attempts > 0 ? 100 - rightdatasuccessPercentage : 0;

      console.log(rightdatafailurePercentage, "rightdatafailurePercentage");

      const centerSpot = [1, 4, 9, 14];

      const centerdata = saveShootingGameSpot.spotSelection
        .filter((item) => centerSpot.includes(item.spot))
        .reduce(
          (acc, obj) => {
            acc.makes += obj.makes || 0;
            acc.attempts += obj.attempts || 0;
            return acc;
          },
          { makes: 0, attempts: 0 }
        ); // Initialize the accumulator with default values

      // Calculate success and failure percentages
      const centerdatasuccessPercentage =
        centerdata.attempts > 0
          ? (centerdata.makes / centerdata.attempts) * 100
          : 0;
      console.log(centerdatasuccessPercentage, "centerdatasuccessPercentage");

      const centerdatafailurePercentage =
        centerdata.attempts > 0 ? 100 - centerdatasuccessPercentage : 0;
      console.log(centerdatafailurePercentage, "centerdatafailurePercentage");

      const shortMakesAndAttempt = {
        Makes: shortdata.makes,
        Attempts: shortdata.attempts,
        shorts: shortdatasuccessPercentage.toFixed(2),
        freeThrow: shortdatafailurePercentage.toFixed(2),
      };

      const midMakesAndAttempt = {
        Makes: middata.makes,
        Attempts: middata.attempts,
        shorts: middatasuccessPercentage.toFixed(2),
        freeThrow: middatafailurePercentage.toFixed(2),
      };
      const threeMakesAndAttempt = {
        Makes: threedata.makes,
        Attempts: threedata.attempts,
        shorts: threedatasuccessPercentage.toFixed(2),
        freeThrow: threedatafailurePercentage.toFixed(2),
      };

      const leftMakesAndAttempt = {
        Makes: leftdata.makes,
        Attempts: leftdata.attempts,
        shorts: leftdatasuccessPercentage.toFixed(2),
        freeThrow: leftdatafailurePercentage.toFixed(2),
      };

      const rightMakesAndAttempt = {
        Makes: rightdata.makes,
        Attempts: rightdata.attempts,
        shorts: rightdatasuccessPercentage.toFixed(2),
        freeThrow: rightdatafailurePercentage.toFixed(2),
      };

      const centerMakesAndAttempt = {
        Makes: centerdata.makes,
        Attempts: centerdata.attempts,
        shorts: centerdatasuccessPercentage.toFixed(2),
        freeThrow: centerdatafailurePercentage.toFixed(2),
      };
      // const saveShootingGameSpotTime = new Date(saveShootingGameSpot.playingAt);
      const spotNameResponse = {
        Total: totalMakesAndAttempt,
        AroundTheRim: aroundTheRimMakesAndAttempt,
        Short: shortMakesAndAttempt,
        Mid: midMakesAndAttempt,
        Three: threeMakesAndAttempt,
        Left: leftMakesAndAttempt,
        Right: rightMakesAndAttempt,
        Center: centerMakesAndAttempt,
        // AmountOfTime:saveShootingGameSpotTime.toLocaleTimeString()
      };

      const spotResponse = {
        _id: saveShootingGameSpot._id,
        authId: saveShootingGameSpot.authId,
        gameType: saveShootingGameSpot.gameType,
        Method: saveShootingGameSpot.Method,
        playingAt: saveShootingGameSpot.playingAt,
        makes: saveShootingGameSpot.makes,
        attempts: saveShootingGameSpot.attempts,
        shorts: saveShootingGameSpot.shorts,
        freeThrow: saveShootingGameSpot.freeThrow,
        totalWorkOutTime: saveShootingGameSpot.totalWorkOutTime,
      };

      // Convert to an array of objects without numeric keys
      const objectsArray = Object.values(saveShootingGameSpot.spotSelection);

      // Transform into a single object where each value is an array element
      const resultObject = { values: objectsArray };

      const spotChartResponse = {
        ...resultObject,
      };

      return res.status(200).json({
        success: true,
        message: "Shooting game saved successfully",
        data: { spotResponse, spotNameResponse, spotChartResponse },
      });
    } else if (penaltySpot && spotSelection.length === 0) {
      console.log("only penalty selection");

      // Validate spotSelection
      if (!Array.isArray(penaltySpot)) {
        return res.status(400).json({
          success: false,
          message: "penaltySpot should be an array.",
        });
      }

      // Iterate through the penaltySpot array

      for (const spot of penaltySpot) {
        const makes = parseInt(spot.makes, 10);
        const attempts = parseInt(spot.attempts, 10);
        if (makes > attempts) {
          return res.status(400).json({
            success: false,
            message: "Makes cannot be greater than attempts.",
          });
        }

        //   if (!(isValidValue(spotMakes) && isValidValue(spotAttempts))) {
        //       return res.status(400).json({
        //           success: false,
        //           message: "Please select either 0 or 1 for makes and attempts.",
        //       });
        //   }
      }

      const newStartTimePenalty = Date.now();

      const penaltyResults = [];

      //        // Iterate through the penaltySpot array to calculate spot statistics
      for (const spot of penaltySpot) {
        const makes = spot.makes;
        const attempts = spot.attempts;
        const spotAvg = (makes / attempts) * 100;
        const spotFreeThrow = 100 - spotAvg;

        const spotStat = {
          spot: spot.spot,
          makes: makes,
          attempts: attempts,
          penaltyShorts: `${Math.round(spotAvg)}%`,
          freeThrow: `${Math.round(spotFreeThrow)}%`,
        };

        penaltyResults.push(spotStat);
      }

      //       // Calculate overall statistics
      let total_makes_penalty = 0;
      let total_attempts_penalty = 0;

      for (const spotStat of penaltyResults) {
        total_makes_penalty += spotStat.makes;
        total_attempts_penalty += spotStat.attempts;
      }

      const overallAvgPenalty =
        total_attempts_penalty !== 0
          ? (total_makes_penalty / total_attempts_penalty) * 100
          : 0;
      const overallFreeThrowPenalty = 100 - overallAvgPenalty;

      // Check if newMakes and newAttempts are valid numbers
      if (isNaN(total_makes_penalty) || isNaN(total_attempts_penalty)) {
        console.log(
          "Invalid values for makes or attempts:",
          total_makes_penalty,
          total_attempts_penalty
        );
        return res.status(400).json({
          success: false,
          message: "Invalid values for makes or attempts.",
        });
      }

      let timePartsPenalty = totalWorkOutTime.split(":");
      let hoursPenalty = parseInt(timePartsPenalty[0]);
      let minutesPenalty = parseInt(timePartsPenalty[1]);
      let secondsPenalty = parseInt(timePartsPenalty[2]);
      let totalTimeInSecondsPenalty =
        hoursPenalty * 3600 + minutesPenalty * 60 + secondsPenalty;

      const totalTimeInMillisecondsPenalty = totalTimeInSecondsPenalty * 1000;

      // Create a shooting game model and save it
      const shootinggamepenalty = new shootingGameModel({
        gameType,
        Method,
        authId: user_id,
        playingAt: newStartTimePenalty,
        makes: total_makes_penalty,
        attempts: total_attempts_penalty,
        penaltyShorts: `${Math.round(overallAvgPenalty)}%`,
        freeThrow: `${Math.round(overallFreeThrowPenalty)}%`,
        penaltySpot: penaltyResults,
        totalWorkOutTime: totalTimeInMillisecondsPenalty,
      });

      const saveShootingGamePenalty = await shootinggamepenalty.save();

      //save shooting history

      const createHistory = new shootingHistoryModel({
        penaltyId: saveShootingGamePenalty._id,
        authId: user_id,
        totalWorkOutTime: totalTimeInMillisecondsPenalty,
        workoutTime: totalTimeInMillisecondsPenalty,
        sessionTime: newStartTimePenalty,
        totalSpotMakes: 0,
        totalSpotAttempt: 0,
        totalPenaltyMakes: total_makes_penalty,
        totalPenaltyAttempt: total_attempts_penalty,
        totalWorkOutTime: totalTimeInMillisecondsPenalty,
        Method,
        gameType,
        totalSpotSuccess: "0.00%",
        totalPenaltySuccess: `${Math.round(overallAvgPenalty)}%`,
      });

      const saveHistory = await createHistory.save();

      //save in analytics

      const analyticsEntryPenalty = new activityModel({
        shootingId: saveShootingGamePenalty._id,
        createdBy: user_id,
        shootingCreatedAt: newStartTimePenalty, // Store time in milliseconds
      });

      const saveAnalyticsEntryPenalty = await analyticsEntryPenalty.save();

      if (!saveAnalyticsEntryPenalty) {
        return res.status(400).json({
          success: false,
          message: "analytics not save",
        });
      }

      const responseObject = {
        _id: saveShootingGamePenalty._id,
        authId: saveShootingGamePenalty.authId,
        gameType: saveShootingGamePenalty.gameType,
        Method: saveShootingGamePenalty.Method,
        playingAt: saveShootingGamePenalty.playingAt,
        makes: saveShootingGamePenalty.makes,
        attempts: saveShootingGamePenalty.attempts,
        penaltyShorts: saveShootingGamePenalty.penaltyShorts,
        freeThrow: saveShootingGamePenalty.freeThrow,
        totalWorkOutTime: saveShootingGamePenalty.totalWorkOutTime,
      };

      return res.status(200).json({
        success: true,
        message: "Shooting game saved successfully",
        data: responseObject,
      });
    } else if (spotSelection && penaltySpot) {
      console.log("spot selection and penalty selection");

      // Validate spotSelection
      if (!Array.isArray(spotSelection)) {
        return res.status(400).json({
          success: false,
          message: "spotSelection should be an array.",
        });
      }

      // Iterate through the spotSelection array
      for (const spot of spotSelection) {
        const makes = parseInt(spot.makes, 10);
        const attempts = parseInt(spot.attempts, 10);
        if (makes > attempts) {
          return res.status(400).json({
            success: false,
            message: "Makes cannot be greater than attempts.",
          });
        }

        // if (!(isValidValue(spotMakes) && isValidValue(spotAttempts))) {
        //     return res.status(400).json({
        //         success: false,
        //         message: "Please select either 0 or 1 for makes and attempts.",
        //     });
        // }
      }

      const newStartTimeSpot = Date.now();

      const spotResults = [];

      // Iterate through the spotSelection array to calculate spot statistics
      for (const spot of spotSelection) {
        const makes = spot.makes;
        const attempts = spot.attempts;
        const spotAvg = (makes / attempts) * 100;
        const spotFreeThrow = 100 - spotAvg;

        const spotStat = {
          spot: spot.spot,
          makes: makes,
          attempts: attempts,
          shorts: `${Math.round(spotAvg)}%`,
          freeThrow: `${Math.round(spotFreeThrow)}%`,
        };

        spotResults.push(spotStat);
      }

      // Calculate overall statistics
      let total_makes_spot = 0;
      let total_attempts_spot = 0;

      for (const spotStat of spotResults) {
        total_makes_spot += spotStat.makes;
        total_attempts_spot += spotStat.attempts;
      }

      const overallAvgSpot =
        total_attempts_spot !== 0
          ? (total_makes_spot / total_attempts_spot) * 100
          : 0;
      const overallFreeThrowSpot = 100 - overallAvgSpot;

      // Check if newMakes and newAttempts are valid numbers
      if (isNaN(total_makes_spot) || isNaN(total_attempts_spot)) {
        console.log(
          "Invalid values for makes or attempts:",
          total_makes_spot,
          total_attempts_spot
        );
        return res.status(400).json({
          success: false,
          message: "Invalid values for makes or attempts.",
        });
      }

      //

      let timePartsSpot = totalWorkOutTime.split(":");
      let hoursSpot = parseInt(timePartsSpot[0]);
      let minutesSpot = parseInt(timePartsSpot[1]);
      let secondsSpot = parseInt(timePartsSpot[2]);
      let totalTimeInSecondsSpot =
        hoursSpot * 3600 + minutesSpot * 60 + secondsSpot;

      const totalTimeInMillisecondsSpot = totalTimeInSecondsSpot * 1000;

      if (!Array.isArray(penaltySpot)) {
        return res.status(400).json({
          success: false,
          message: "penaltySpot should be an array.",
        });
      }

      // Iterate through the penaltySpot array

      for (const spot of penaltySpot) {
        const makes = parseInt(spot.makes, 10);
        const attempts = parseInt(spot.attempts, 10);
        if (makes > attempts) {
          return res.status(400).json({
            success: false,
            message: "Makes cannot be greater than attempts.",
          });
        }

        //   if (!(isValidValue(spotMakes) && isValidValue(spotAttempts))) {
        //       return res.status(400).json({
        //           success: false,
        //           message: "Please select either 0 or 1 for makes and attempts.",
        //       });
        //   }
      }

      const penaltyResults = [];

      //        // Iterate through the penaltySpot array to calculate spot statistics
      for (const spot of penaltySpot) {
        const makes = spot.makes;
        const attempts = spot.attempts;
        const spotAvg = (makes / attempts) * 100;
        const spotFreeThrow = 100 - spotAvg;

        const spotStat = {
          spot: spot.spot,
          makes: makes,
          attempts: attempts,
          penaltyShorts: `${Math.round(spotAvg)}%`,
          penaltyfreeThrow: `${Math.round(spotFreeThrow)}%`,
        };

        penaltyResults.push(spotStat);
      }

      //       // Calculate overall statistics
      let total_makes_penalty = 0;
      let total_attempts_penalty = 0;

      for (const spotStat of penaltyResults) {
        total_makes_penalty += spotStat.makes;
        total_attempts_penalty += spotStat.attempts;
      }

      const overallAvgPenalty =
        total_attempts_penalty !== 0
          ? (total_makes_penalty / total_attempts_penalty) * 100
          : 0;
      const overallFreeThrowPenalty = 100 - overallAvgPenalty;

      // Check if newMakes and newAttempts are valid numbers
      if (isNaN(total_makes_penalty) || isNaN(total_attempts_penalty)) {
        console.log(
          "Invalid values for makes or attempts:",
          total_makes_penalty,
          total_attempts_penalty
        );
        return res.status(400).json({
          success: false,
          message: "Invalid values for makes or attempts.",
        });
      }

      let timePartsPenalty = totalWorkOutTime.split(":");
      let hoursPenalty = parseInt(timePartsPenalty[0]);
      let minutesPenalty = parseInt(timePartsPenalty[1]);
      let secondsPenalty = parseInt(timePartsPenalty[2]);
      let totalTimeInSecondsPenalty =
        hoursPenalty * 3600 + minutesPenalty * 60 + secondsPenalty;

      const totalTimeInMillisecondsPenalty = totalTimeInSecondsPenalty * 1000;

      // Create a shooting game model for spot and save it
      const shootinggamespot = new shootingGameModel({
        gameType,
        Method,
        authId: user_id,
        playingAt: newStartTimeSpot,
        makes: total_makes_spot,
        attempts: total_attempts_spot,
        shorts: `${Math.round(overallAvgSpot)}%`,
        freeThrow: `${Math.round(overallFreeThrowSpot)}%`,
        spotSelection: spotResults,
        totalWorkOutTime: totalTimeInMillisecondsPenalty,
        isPenalty: true,
      });

      const saveShootingGameSpot = await shootinggamespot.save();

      //save in analytics

      const analyticsEntrySpot = new activityModel({
        shootingId: saveShootingGameSpot._id,
        createdBy: user_id,
        shootingCreatedAt: newStartTimeSpot, // Store time in milliseconds
      });

      const saveAnalyticsEntrySpot = await analyticsEntrySpot.save();

      if (!saveAnalyticsEntrySpot) {
        return res.status(400).json({
          success: false,
          message: "analytics not save",
        });
      }

      // Create a shooting game model for penalty and save it
      const shootinggamepenalty = new shootingGameModel({
        gameType,
        Method,
        authId: user_id,
        playingAt: newStartTimeSpot,
        makes: total_makes_penalty,
        attempts: total_attempts_penalty,
        penaltyShorts: `${Math.round(overallAvgPenalty)}%`,
        freeThrow: `${Math.round(overallFreeThrowPenalty)}%`,
        penaltySpot: penaltyResults,
        totalWorkOutTime: totalTimeInMillisecondsPenalty,
        isPenalty: true,
      });

      const saveShootingGamePenalty = await shootinggamepenalty.save();

      //save in analytics

      const analyticsEntryPenalty = new activityModel({
        shootingId: saveShootingGamePenalty._id,
        createdBy: user_id,
        shootingCreatedAt: newStartTimeSpot, // Store time in milliseconds
      });

      const saveAnalyticsEntryPenalty = await analyticsEntryPenalty.save();

      if (!saveAnalyticsEntryPenalty) {
        return res.status(400).json({
          success: false,
          message: "analytics not save",
        });
      }

      //save shooting history

      const createHistory = new shootingHistoryModel({
        penaltyId: saveShootingGamePenalty._id,
        spotId: saveShootingGameSpot._id,
        authId: user_id,
        workoutTime: totalTimeInMillisecondsPenalty,
        sessionTime: newStartTimeSpot,
        totalSpotMakes: total_makes_spot,
        totalSpotAttempt: total_attempts_spot,
        totalPenaltyMakes: total_makes_penalty,
        totalPenaltyAttempt: total_attempts_penalty,
        totalWorkOutTime: totalTimeInMillisecondsPenalty,
        Method,
        gameType,
        totalSpotSuccess: `${Math.round(overallAvgSpot)}%`,
        totalPenaltySuccess: `${Math.round(overallAvgPenalty)}%`,
      });

      const saveHistory = await createHistory.save();

      const spotResponse = {
        _id: saveShootingGameSpot._id,
        authId: saveShootingGameSpot.authId,
        gameType: saveShootingGameSpot.gameType,
        Method: saveShootingGameSpot.Method,
        playingAt: saveShootingGameSpot.playingAt,
        makes: saveShootingGameSpot.makes,
        attempts: saveShootingGameSpot.attempts,
        shorts: saveShootingGameSpot.shorts,
        freeThrow: saveShootingGameSpot.freeThrow,
        totalWorkOutTime: saveShootingGameSpot.totalWorkOutTime,
      };

      const penaltyResponse = {
        _id: saveShootingGamePenalty._id,
        authId: saveShootingGamePenalty.authId,
        gameType: saveShootingGamePenalty.gameType,
        Method: saveShootingGamePenalty.Method,
        playingAt: saveShootingGamePenalty.playingAt,
        makes: saveShootingGamePenalty.makes,
        attempts: saveShootingGamePenalty.attempts,
        penaltyShorts: saveShootingGamePenalty.penaltyShorts,
        freeThrow: saveShootingGamePenalty.freeThrow,
        totalWorkOutTime: saveShootingGamePenalty.totalWorkOutTime,
      };

      const totalMakesAndAttempt = {
        Makes: saveShootingGameSpot.makes,
        Attempts: saveShootingGameSpot.attempts,
        shorts: saveShootingGameSpot.shorts,
        freeThrow: saveShootingGameSpot.freeThrow,
      };

      const aroundTheRimsuccessPercentage =
        saveShootingGameSpot.spotSelection.find((obj) => obj.spot == 1)
          .attempts > 0
          ? (saveShootingGameSpot.spotSelection.find((obj) => obj.spot == 1)
              .makes /
              saveShootingGameSpot.spotSelection.find((obj) => obj.spot == 1)
                .attempts) *
            100
          : 0;

      const aroundTheRimfailurePercentage =
        saveShootingGameSpot.spotSelection.find((obj) => obj.spot == 1)
          .attempts > 0
          ? 100 - aroundTheRimsuccessPercentage
          : 0;

      const aroundTheRimMakesAndAttempt = {
        Makes: saveShootingGameSpot.spotSelection.find((obj) => obj.spot == 1)
          .makes,
        Attempts: saveShootingGameSpot.spotSelection.find(
          (obj) => obj.spot == 1
        ).attempts,
        shorts: aroundTheRimsuccessPercentage.toFixed(2),
        freeThrow: aroundTheRimfailurePercentage.toFixed(2),
      };

      const shortSpot = [2, 3, 4, 5, 6];

      const shortdata = saveShootingGameSpot.spotSelection
        .filter((item) => shortSpot.includes(item.spot))
        .reduce(
          (acc, obj) => {
            acc.makes += obj.makes || 0;
            acc.attempts += obj.attempts || 0;
            return acc;
          },
          { makes: 0, attempts: 0 }
        ); // Initialize the accumulator with default values

      const shortdatasuccessPercentage =
        shortdata.attempts > 0
          ? (shortdata.makes / shortdata.attempts) * 100
          : 0;

      const shortdatafailurePercentage =
        shortdata.attempts > 0 ? 100 - shortdatasuccessPercentage : 0;

      const midSpot = [7, 8, 9, 10, 11];

      const middata = saveShootingGameSpot.spotSelection
        .filter((item) => midSpot.includes(item.spot))
        .reduce(
          (acc, obj) => {
            acc.makes += obj.makes || 0;
            acc.attempts += obj.attempts || 0;
            return acc;
          },
          { makes: 0, attempts: 0 }
        ); // Initialize the accumulator with default values

      const middatasuccessPercentage =
        middata.attempts > 0 ? (middata.makes / middata.attempts) * 100 : 0;

      const middatafailurePercentage =
        middata.attempts > 0 ? 100 - middatasuccessPercentage : 0;

      const threeSpot = [12, 13, 14, 15, 16];

      const threedata = saveShootingGameSpot.spotSelection
        .filter((item) => threeSpot.includes(item.spot))
        .reduce(
          (acc, obj) => {
            acc.makes += obj.makes || 0;
            acc.attempts += obj.attempts || 0;
            return acc;
          },
          { makes: 0, attempts: 0 }
        ); // Initialize the accumulator with default values

      const threedatasuccessPercentage =
        threedata.attempts > 0
          ? (threedata.makes / threedata.attempts) * 100
          : 0;

      const threedatafailurePercentage =
        threedata.attempts > 0 ? 100 - threedatasuccessPercentage : 0;
      const leftSpot = [2, 3, 7, 8, 12, 13];

      const leftdata = saveShootingGameSpot.spotSelection
        .filter((item) => leftSpot.includes(item.spot))
        .reduce(
          (acc, obj) => {
            acc.makes += obj.makes || 0;
            acc.attempts += obj.attempts || 0;
            return acc;
          },
          { makes: 0, attempts: 0 }
        ); // Initialize the accumulator with default values

      const leftdatasuccessPercentage =
        leftdata.attempts > 0 ? (leftdata.makes / leftdata.attempts) * 100 : 0;

      const leftdatafailurePercentage =
        leftdata.attempts > 0 ? 100 - leftdatasuccessPercentage : 0;
      const rightSpot = [5, 6, 10, 11, 15, 16];

      const rightdata = saveShootingGameSpot.spotSelection
        .filter((item) => rightSpot.includes(item.spot))
        .reduce(
          (acc, obj) => {
            acc.makes += obj.makes || 0;
            acc.attempts += obj.attempts || 0;
            return acc;
          },
          { makes: 0, attempts: 0 }
        ); // Initialize the accumulator with default values

      const rightdatasuccessPercentage =
        rightdata.attempts > 0
          ? (rightdata.makes / rightdata.attempts) * 100
          : 0;

      const rightdatafailurePercentage =
        rightdata.attempts > 0 ? 100 - rightdatasuccessPercentage : 0;
      const centerSpot = [5, 6, 10, 11, 15, 16];

      const centerdata = saveShootingGameSpot.spotSelection
        .filter((item) => centerSpot.includes(item.spot))
        .reduce(
          (acc, obj) => {
            acc.makes += obj.makes || 0;
            acc.attempts += obj.attempts || 0;
            return acc;
          },
          { makes: 0, attempts: 0 }
        ); // Initialize the accumulator with default values

      const centerdatasuccessPercentage =
        centerdata.attempts > 0
          ? (centerdata.makes / centerdata.attempts) * 100
          : 0;

      const centerdatafailurePercentage =
        centerdata.attempts > 0 ? 100 - centerdatasuccessPercentage : 0;

      const shortMakesAndAttempt = {
        Makes: shortdata.makes,
        Attempts: shortdata.attempts,
        shorts: shortdatasuccessPercentage.toFixed(2),
        freeThrow: shortdatafailurePercentage.toFixed(2),
      };

      const midMakesAndAttempt = {
        Makes: middata.makes,
        Attempts: middata.attempts,
        shorts: middatasuccessPercentage.toFixed(2),
        freeThrow: middatafailurePercentage.toFixed(2),
      };
      const threeMakesAndAttempt = {
        Makes: threedata.makes,
        Attempts: threedata.attempts,
        shorts: threedatasuccessPercentage.toFixed(2),
        freeThrow: threedatafailurePercentage.toFixed(2),
      };

      const leftMakesAndAttempt = {
        Makes: leftdata.makes,
        Attempts: leftdata.attempts,
        shorts: shortdatasuccessPercentage.toFixed(2),
        freeThrow: shortdatafailurePercentage.toFixed(2),
      };

      const rightMakesAndAttempt = {
        Makes: rightdata.makes,
        Attempts: rightdata.attempts,
        shorts: rightdatasuccessPercentage.toFixed(2),
        freeThrow: rightdatafailurePercentage.toFixed(2),
      };

      const centerMakesAndAttempt = {
        Makes: centerdata.makes,
        Attempts: centerdata.attempts,
        shorts: centerdatasuccessPercentage.toFixed(2),
        freeThrow: centerdatafailurePercentage.toFixed(2),
      };

      // const saveShootingGameSpotTime = new Date(saveShootingGameSpot.playingAt);

      const spotNameResponse = {
        Total: totalMakesAndAttempt,
        AroundTheRim: aroundTheRimMakesAndAttempt,
        Short: shortMakesAndAttempt,
        Mid: midMakesAndAttempt,
        Three: threeMakesAndAttempt,
        Left: leftMakesAndAttempt,
        Right: rightMakesAndAttempt,
        Center: centerMakesAndAttempt,
        // AmountOfTime:saveShootingGameSpotTime.toLocaleTimeString()
      };

      // Convert to an array of objects without numeric keys
      const objectsArray = Object.values(saveShootingGameSpot.spotSelection);

      // Transform into a single object where each value is an array element
      const resultObject = { values: objectsArray };

      const spotChartResponse = {
        ...resultObject,
      };

      return res.status(200).json({
        success: true,
        message: "Shooting game saved successfully",
        data: {
          spotResponse,
          penaltyResponse,
          spotNameResponse,
          spotChartResponse,
        },
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "spot selection or penalty spot not provide",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const BulkEntryShot = async (req, res) => {
  const { makes, attempts, gameType, Method, totalWorkOutTime } = req.body;
  const { user_id } = req.user;

  const userfind = await authModel.findOne({ _id: user_id });

  if (!userfind) {
    return res.status(400).json({
      success: false,
      message: "user not found",
    });
  }
  const newStartTime = Date.now();

  const spotSelection = req.body.spotSelection;
  const penaltySpot = req.body.penaltySpot;

  // return ""

  if (spotSelection && penaltySpot.length === 0) {
    const newStartTimeSpot = Date.now();

    // Validate spotSelection
    if (!Array.isArray(spotSelection)) {
      return res.status(400).json({
        success: false,
        message: "spotSelection should be an array.",
      });
    }

    // Iterate through the spotSelection array

    for (const spot of spotSelection) {
      const makes = parseInt(spot.makes, 10);
      const attempts = parseInt(spot.attempts, 10);
      if (makes > attempts) {
        return res.status(400).json({
          success: false,
          message: "Makes cannot be greater than attempts.",
        });
      }
    }

    const spotResults = [];

    // Iterate through the spotSelection array to calculate spot statistics

    for (const spot of spotSelection) {
      const makes = spot.makes;
      const attempts = spot.attempts;
      const spotAvg = (makes / attempts) * 100;
      const spotFreeThrow = 100 - spotAvg;

      const spotStat = {
        spot: spot.spot,
        makes: makes,
        attempts: attempts,
        shorts: `${Math.round(spotAvg)}%`,
        freeThrow: `${Math.round(spotFreeThrow)}%`,
      };

      spotResults.push(spotStat);
    }

    // Calculate overall statistics

    let total_makes_spot = 0;
    let total_attempts_spot = 0;

    for (const spotStat of spotResults) {
      total_makes_spot += spotStat.makes;
      total_attempts_spot += spotStat.attempts;
    }

    const overallAvgSpot =
      total_attempts_spot !== 0
        ? (total_makes_spot / total_attempts_spot) * 100
        : 0;
    const overallFreeThrowSpot = 100 - overallAvgSpot;

    // Check if newMakes and newAttempts are valid numbers

    if (isNaN(total_makes_spot) || isNaN(total_attempts_spot)) {
      console.log(
        "Invalid values for makes or attempts:",
        total_makes_spot,
        total_attempts_spot
      );
      return res.status(400).json({
        success: false,
        message: "Invalid values for makes or attempts.",
      });
    }

    let timePartsSpot = totalWorkOutTime.split(":");
    let hoursSpot = parseInt(timePartsSpot[0]);
    let minutesSpot = parseInt(timePartsSpot[1]);
    let secondsSpot = parseInt(timePartsSpot[2]);
    let totalTimeInSecondsSpot =
      hoursSpot * 3600 + minutesSpot * 60 + secondsSpot;

    const totalTimeInMillisecondsSpot = totalTimeInSecondsSpot * 1000;

    // Create a shooting game model and save it

    const shootinggamespot = new shootingGameModel({
      gameType,
      Method,
      authId: user_id,
      playingAt: newStartTimeSpot,
      makes: total_makes_spot,
      attempts: total_attempts_spot,
      shorts: `${Math.round(overallAvgSpot)}%`,
      freeThrow: `${Math.round(overallFreeThrowSpot)}%`,
      spotSelection: spotResults,
      totalWorkOutTime: totalTimeInMillisecondsSpot,
    });

    const saveShootingGameSpot = await shootinggamespot.save();

    //save shooting history

    const createHistory = new shootingHistoryModel({
      spotId: saveShootingGameSpot._id,
      authId: user_id,
      workoutTime: totalTimeInMillisecondsSpot,
      sessionTime: newStartTimeSpot,
      totalSpotMakes: total_makes_spot,
      totalSpotAttempt: total_attempts_spot,
      totalPenaltyMakes: 0,
      totalPenaltyAttempt: 0,
      totalWorkOutTime: totalTimeInMillisecondsSpot,
      Method,
      gameType,
      totalSpotSuccess: `${Math.round(overallAvgSpot)}%`,
      totalPenaltySuccess: `0.00%`,
    });

    const saveHistory = await createHistory.save();

    if (!saveShootingGameSpot) {
      //   loggerError.error("Failed to save shooting game");
      return res.status(400).json({
        success: false,
        message: "Failed to save shooting game",
      });
    }

    const analyticsEntrySpot = new activityModel({
      shootingId: saveShootingGameSpot._id,
      createdBy: user_id,
      shootingCreatedAt: newStartTimeSpot, // Store time in milliseconds
    });

    const saveAnalyticsEntrySpot = await analyticsEntrySpot.save();

    const spotResponse = {
      _id: saveShootingGameSpot._id,
      authId: saveShootingGameSpot.authId,
      gameType: saveShootingGameSpot.gameType,
      Method: saveShootingGameSpot.Method,
      playingAt: saveShootingGameSpot.playingAt,
      makes: saveShootingGameSpot.makes,
      attempts: saveShootingGameSpot.attempts,
      shorts: saveShootingGameSpot.shorts,
      freeThrow: saveShootingGameSpot.freeThrow,
      totalWorkOutTime: saveShootingGameSpot.totalWorkOutTime,
    };

    const totalMakesAndAttempt = {
      Makes: saveShootingGameSpot.makes,
      Attempts: saveShootingGameSpot.attempts,
      shorts: saveShootingGameSpot.shorts,
      freeThrow: saveShootingGameSpot.freeThrow,
    };

    const aroundTheRimsuccessPercentage =
      saveShootingGameSpot.spotSelection.find((obj) => obj.spot == 1).attempts >
      0
        ? (saveShootingGameSpot.spotSelection.find((obj) => obj.spot == 1)
            .makes /
            saveShootingGameSpot.spotSelection.find((obj) => obj.spot == 1)
              .attempts) *
          100
        : 0;

    const aroundTheRimfailurePercentage =
      saveShootingGameSpot.spotSelection.find((obj) => obj.spot == 1).attempts >
      0
        ? 100 - aroundTheRimsuccessPercentage
        : 0;

    const aroundTheRimMakesAndAttempt = {
      Makes: saveShootingGameSpot.spotSelection.find((obj) => obj.spot == 1)
        .makes,
      Attempts: saveShootingGameSpot.spotSelection.find((obj) => obj.spot == 1)
        .attempts,
      shorts: aroundTheRimsuccessPercentage.toFixed(2),
      freeThrow: aroundTheRimfailurePercentage.toFixed(2),
    };

    const shortSpot = [2, 3, 4, 5, 6];

    const shortdata = saveShootingGameSpot.spotSelection
      .filter((item) => shortSpot.includes(item.spot))
      .reduce(
        (acc, obj) => {
          acc.makes += obj.makes || 0;
          acc.attempts += obj.attempts || 0;
          return acc;
        },
        { makes: 0, attempts: 0 }
      ); // Initialize the accumulator with default values

    const shortdatasuccessPercentage =
      shortdata.attempts > 0 ? (shortdata.makes / shortdata.attempts) * 100 : 0;

    const shortdatafailurePercentage =
      shortdata.attempts > 0 ? 100 - shortdatasuccessPercentage : 0;
    const midSpot = [7, 8, 9, 10, 11];

    const middata = saveShootingGameSpot.spotSelection
      .filter((item) => midSpot.includes(item.spot))
      .reduce(
        (acc, obj) => {
          acc.makes += obj.makes || 0;
          acc.attempts += obj.attempts || 0;
          return acc;
        },
        { makes: 0, attempts: 0 }
      ); // Initialize the accumulator with default values

    const middatasuccessPercentage =
      middata.attempts > 0 ? (middata.makes / middata.attempts) * 100 : 0;

    const middatafailurePercentage =
      middata.attempts > 0 ? 100 - middatasuccessPercentage : 0;
    const threeSpot = [12, 13, 14, 15, 16];

    const threedata = saveShootingGameSpot.spotSelection
      .filter((item) => threeSpot.includes(item.spot))
      .reduce(
        (acc, obj) => {
          acc.makes += obj.makes || 0;
          acc.attempts += obj.attempts || 0;
          return acc;
        },
        { makes: 0, attempts: 0 }
      ); // Initialize the accumulator with default values

    const threedatasuccessPercentage =
      threedata.attempts > 0 ? (threedata.makes / threedata.attempts) * 100 : 0;

    const threedatafailurePercentage =
      threedata.attempts > 0 ? 100 - threedatasuccessPercentage : 0;
    const leftSpot = [2, 3, 7, 8, 12, 13];

    const leftdata = saveShootingGameSpot.spotSelection
      .filter((item) => leftSpot.includes(item.spot))
      .reduce(
        (acc, obj) => {
          acc.makes += obj.makes || 0;
          acc.attempts += obj.attempts || 0;
          return acc;
        },
        { makes: 0, attempts: 0 }
      ); // Initialize the accumulator with default values

    const leftdatasuccessPercentage =
      leftdata.attempts > 0 ? (leftdata.makes / leftdata.attempts) * 100 : 0;

    const leftdatafailurePercentage =
      leftdata.attempts > 0 ? 100 - leftdatasuccessPercentage : 0;
    const rightSpot = [5, 6, 10, 11, 15, 16];

    const rightdata = saveShootingGameSpot.spotSelection
      .filter((item) => rightSpot.includes(item.spot))
      .reduce(
        (acc, obj) => {
          acc.makes += obj.makes || 0;
          acc.attempts += obj.attempts || 0;
          return acc;
        },
        { makes: 0, attempts: 0 }
      ); // Initialize the accumulator with default values

    const rightdatasuccessPercentage =
      rightdata.attempts > 0 ? (rightdata.makes / rightdata.attempts) * 100 : 0;

    const rightdatafailurePercentage =
      rightdata.attempts > 0 ? 100 - rightdatasuccessPercentage : 0;

    const centerSpot = [1, 4, 9, 14];

    const centerdata = saveShootingGameSpot.spotSelection
      .filter((item) => centerSpot.includes(item.spot))
      .reduce(
        (acc, obj) => {
          acc.makes += obj.makes || 0;
          acc.attempts += obj.attempts || 0;
          return acc;
        },
        { makes: 0, attempts: 0 }
      ); // Initialize the accumulator with default values

    const centerdatasuccessPercentage =
      centerdata.attempts > 0
        ? (centerdata.makes / centerdata.attempts) * 100
        : 0;

    const centerdatafailurePercentage =
      centerdata.attempts > 0 ? 100 - centerdatasuccessPercentage : 0;

    const shortMakesAndAttempt = {
      Makes: shortdata.makes,
      Attempts: shortdata.attempts,
      shorts: shortdatasuccessPercentage.toFixed(2),
      freeThrow: shortdatafailurePercentage.toFixed(2),
    };

    const midMakesAndAttempt = {
      Makes: middata.makes,
      Attempts: middata.attempts,
      shorts: middatasuccessPercentage.toFixed(2),
      freeThrow: middatafailurePercentage.toFixed(2),
    };
    const threeMakesAndAttempt = {
      Makes: threedata.makes,
      Attempts: threedata.attempts,
      shorts: threedatasuccessPercentage.toFixed(2),
      freeThrow: threedatafailurePercentage.toFixed(2),
    };

    const leftMakesAndAttempt = {
      Makes: leftdata.makes,
      Attempts: leftdata.attempts,
      shorts: leftdatasuccessPercentage.toFixed(2),
      freeThrow: leftdatafailurePercentage.toFixed(2),
    };

    const rightMakesAndAttempt = {
      Makes: rightdata.makes,
      Attempts: rightdata.attempts,
      shorts: rightdatasuccessPercentage.toFixed(2),
      freeThrow: rightdatafailurePercentage.toFixed(2),
    };

    const centerMakesAndAttempt = {
      Makes: centerdata.makes,
      Attempts: centerdata.attempts,
      shorts: centerdatasuccessPercentage.toFixed(2),
      freeThrow: centerdatafailurePercentage.toFixed(2),
    };

    // const saveShootingGameSpotTime = new Date(saveShootingGameSpot.playingAt);

    const spotNameResponse = {
      Total: totalMakesAndAttempt,
      AroundTheRim: aroundTheRimMakesAndAttempt,
      Short: shortMakesAndAttempt,
      Mid: midMakesAndAttempt,
      Three: threeMakesAndAttempt,
      Left: leftMakesAndAttempt,
      Right: rightMakesAndAttempt,
      Center: centerMakesAndAttempt,
      // AmountOfTime:saveShootingGameSpotTime.toLocaleTimeString()
    };

    // Convert to an array of objects without numeric keys
    const objectsArray = Object.values(saveShootingGameSpot.spotSelection);

    // Transform into a single object where each value is an array element
    const resultObject = { values: objectsArray };

    const spotChartResponse = {
      ...resultObject,
    };

    return res.status(200).json({
      success: true,
      message: "shooting game successfully",
      data: { spotResponse, spotNameResponse, spotChartResponse },
    });
  } else if (penaltySpot && spotSelection.length === 0) {
    console.log("penalty called");

    const newStartTimePenalty = Date.now();
    //   const penaltySpot = req.body.penaltySpot;

    // Validate spotSelection
    if (!Array.isArray(penaltySpot)) {
      return res.status(400).json({
        success: false,
        message: "penaltySpot should be an array.",
      });
    }

    // Iterate through the penaltySpot array

    for (const spot of penaltySpot) {
      const makes = parseInt(spot.makes, 10);
      const attempts = parseInt(spot.attempts, 10);
      if (makes > attempts) {
        return res.status(400).json({
          success: false,
          message: "Makes cannot be greater than attempts.",
        });
      }
      // if(spotMakes>5 && spotAttempts>5){
      //     return res.status(400).json({
      //         success: false,
      //         message: "Makes and attempts cannot be greater than 5",
      //     });
      // }
    }

    const penaltyResults = [];

    // Iterate through the penaltySpot array to calculate spot statistics

    for (const spot of penaltySpot) {
      const makes = spot.makes;
      const attempts = spot.attempts;
      const spotAvg = (makes / attempts) * 100;
      const spotFreeThrow = 100 - spotAvg;

      const spotStat = {
        spot: spot.spot,
        makes: makes,
        attempts: attempts,
        penaltyShorts: `${Math.round(spotAvg)}%`,
        freeThrow: `${Math.round(spotFreeThrow)}%`,
      };

      penaltyResults.push(spotStat);
    }

    // Calculate overall statistics

    let total_makes_penalty = 0;
    let total_attempts_penalty = 0;

    for (const spotStat of penaltyResults) {
      total_makes_penalty += spotStat.makes;
      total_attempts_penalty += spotStat.attempts;
    }

    const overallAvgPenalty =
      total_attempts_penalty !== 0
        ? (total_makes_penalty / total_attempts_penalty) * 100
        : 0;
    const overallFreeThrowPenalty = 100 - overallAvgPenalty;

    // Check if newMakes and newAttempts are valid numbers

    if (isNaN(total_makes_penalty) || isNaN(total_attempts_penalty)) {
      console.log(
        "Invalid values for makes or attempts:",
        total_makes_penalty,
        total_attempts_penalty
      );
      return res.status(400).json({
        success: false,
        message: "Invalid values for makes or attempts.",
      });
    }

    let timePartsPenalty = totalWorkOutTime.split(":");
    let hoursPenalty = parseInt(timePartsPenalty[0]);
    let minutesPenalty = parseInt(timePartsPenalty[1]);
    let secondsPenalty = parseInt(timePartsPenalty[2]);
    let totalTimeInSecondsPenalty =
      hoursPenalty * 3600 + minutesPenalty * 60 + secondsPenalty;

    const totalTimeInMillisecondsPenalty = totalTimeInSecondsPenalty * 1000;

    // Create a shooting game model and save it

    const shootinggamepenalty = new shootingGameModel({
      gameType,
      Method,
      authId: user_id,
      playingAt: newStartTimePenalty,
      makes: total_makes_penalty,
      attempts: total_attempts_penalty,
      penaltyShorts: `${Math.round(overallAvgPenalty)}%`,
      freeThrow: `${Math.round(overallFreeThrowPenalty)}%`,
      penaltySpot: penaltyResults,
      totalWorkOutTime: totalTimeInMillisecondsPenalty,
      isPenalty: true,
    });

    // Save shooting game
    const saveShootingGamePenalty = await shootinggamepenalty.save();

    if (!saveShootingGamePenalty) {
      // loggerError.error("Failed to save shooting game");
      return res.status(400).json({
        success: false,
        message: "Failed to save shooting game",
      });
    }
    //save shooting history

    const createHistory = new shootingHistoryModel({
      penaltyId: saveShootingGamePenalty._id,
      authId: user_id,
      workoutTime: totalTimeInMillisecondsPenalty,
      sessionTime: newStartTimePenalty,
      totalSpotMakes: 0,
      totalSpotAttempt: 0,
      totalPenaltyMakes: total_makes_penalty,
      totalPenaltyAttempt: total_attempts_penalty,
      totalWorkOutTime: totalTimeInMillisecondsPenalty,
      Method,
      gameType,
      totalSpotSuccess: `0.00%`,
      totalPenaltySuccess: `${Math.round(overallAvgPenalty)}%`,
    });

    const saveHistory = await createHistory.save();

    const analyticsEntryPenalty = new activityModel({
      shootingId: saveShootingGamePenalty._id,
      createdBy: user_id,
      shootingCreatedAt: newStartTimePenalty, // Store time in milliseconds
    });

    const saveAnalyticsEntryPenalty = await analyticsEntryPenalty.save();

    const penaltyResponse = {
      _id: saveShootingGamePenalty._id,
      authId: saveShootingGamePenalty.authId,
      gameType: saveShootingGamePenalty.gameType,
      Method: saveShootingGamePenalty.Method,
      playingAt: saveShootingGamePenalty.playingAt,
      makes: saveShootingGamePenalty.makes,
      attempts: saveShootingGamePenalty.attempts,
      penaltyShorts: saveShootingGamePenalty.penaltyShorts,
      freeThrow: saveShootingGamePenalty.freeThrow,
      totalWorkOutTime: saveShootingGamePenalty.totalWorkOutTime,
    };

    return res.status(200).json({
      success: true,
      message: "shooting game successfully",
      data: penaltyResponse,
    });
  } else if (spotSelection && penaltySpot) {
    console.log("spot and penalty called");

    const newStartTimeSpot = Date.now();

    // Validate spotSelection
    if (!Array.isArray(spotSelection)) {
      return res.status(400).json({
        success: false,
        message: "spotSelection should be an array.",
      });
    }

    // Iterate through the spotSelection array

    for (const spot of spotSelection) {
      const makes = parseInt(spot.makes, 10);
      const attempts = parseInt(spot.attempts, 10);
      if (makes > attempts) {
        return res.status(400).json({
          success: false,
          message: "Makes cannot be greater than attempts.",
        });
      }
    }

    const spotResults = [];

    // Iterate through the spotSelection array to calculate spot statistics

    for (const spot of spotSelection) {
      const makes = spot.makes;
      const attempts = spot.attempts;
      const spotAvg = (makes / attempts) * 100;
      const spotFreeThrow = 100 - spotAvg;

      const spotStat = {
        spot: spot.spot,
        makes: makes,
        attempts: attempts,
        shorts: `${Math.round(spotAvg)}%`,
        freeThrow: `${Math.round(spotFreeThrow)}`,
      };

      spotResults.push(spotStat);
    }

    // Calculate overall statistics

    let total_makes_spot = 0;
    let total_attempts_spot = 0;

    for (const spotStat of spotResults) {
      total_makes_spot += spotStat.makes;
      total_attempts_spot += spotStat.attempts;
    }

    const overallAvgSpot =
      total_attempts_spot !== 0
        ? (total_makes_spot / total_attempts_spot) * 100
        : 0;
    const overallFreeThrowSpot = 100 - overallAvgSpot;

    // Check if newMakes and newAttempts are valid numbers

    if (isNaN(total_makes_spot) || isNaN(total_attempts_spot)) {
      console.log(
        "Invalid values for makes or attempts:",
        total_makes_spot,
        total_attempts_spot
      );
      return res.status(400).json({
        success: false,
        message: "Invalid values for makes or attempts.",
      });
    }

    let timePartsSpot = totalWorkOutTime.split(":");
    let hoursSpot = parseInt(timePartsSpot[0]);
    let minutesSpot = parseInt(timePartsSpot[1]);
    let secondsSpot = parseInt(timePartsSpot[2]);
    let totalTimeInSecondsSpot =
      hoursSpot * 3600 + minutesSpot * 60 + secondsSpot;

    const totalTimeInMillisecondsSpot = totalTimeInSecondsSpot * 1000;

    // const saveAnalyticsEntrySpot = await analyticsEntrySpot.save();

    const newStartTimePenalty = Date.now();
    //   const penaltySpot = req.body.penaltySpot;

    // Validate spotSelection
    if (!Array.isArray(penaltySpot)) {
      return res.status(400).json({
        success: false,
        message: "penaltySpot should be an array.",
      });
    }

    // Iterate through the penaltySpot array

    for (const spot of penaltySpot) {
      const makes = parseInt(spot.makes, 10);
      const attempts = parseInt(spot.attempts, 10);
      if (makes > attempts) {
        return res.status(400).json({
          success: false,
          message: "Makes cannot be greater than attempts.",
        });
      }
      // if(spotMakes>5 && spotAttempts>5){
      //     return res.status(400).json({
      //         success: false,
      //         message: "Makes and attempts cannot be greater than 5",
      //     });
      // }
    }

    const penaltyResults = [];

    // Iterate through the penaltySpot array to calculate spot statistics

    for (const spot of penaltySpot) {
      const makes = spot.makes;
      const attempts = spot.attempts;
      const spotAvg = (makes / attempts) * 100;
      const spotFreeThrow = 100 - spotAvg;

      const spotStat = {
        spot: spot.spot,
        makes: makes,
        attempts: attempts,
        penaltyShorts: `${Math.round(spotAvg)}`,
        freeThrow: `${Math.round(spotFreeThrow)}`,
      };

      penaltyResults.push(spotStat);
    }

    // Calculate overall statistics

    let total_makes_penalty = 0;
    let total_attempts_penalty = 0;

    for (const spotStat of penaltyResults) {
      total_makes_penalty += spotStat.makes;
      total_attempts_penalty += spotStat.attempts;
    }

    const overallAvgPenalty =
      total_attempts_penalty !== 0
        ? (total_makes_penalty / total_attempts_penalty) * 100
        : 0;
    const overallFreeThrowPenalty = 100 - overallAvgPenalty;

    // Check if newMakes and newAttempts are valid numbers

    if (isNaN(total_makes_penalty) || isNaN(total_attempts_penalty)) {
      console.log(
        "Invalid values for makes or attempts:",
        total_makes_penalty,
        total_attempts_penalty
      );
      return res.status(400).json({
        success: false,
        message: "Invalid values for makes or attempts.",
      });
    }

    let timePartsPenalty = totalWorkOutTime.split(":");
    let hoursPenalty = parseInt(timePartsPenalty[0]);
    let minutesPenalty = parseInt(timePartsPenalty[1]);
    let secondsPenalty = parseInt(timePartsPenalty[2]);
    let totalTimeInSecondsPenalty =
      hoursPenalty * 3600 + minutesPenalty * 60 + secondsPenalty;

    const totalTimeInMillisecondsPenalty = totalTimeInSecondsPenalty * 1000;

    // Create a shooting game model for spot and save it

    const shootinggamespot = new shootingGameModel({
      gameType,
      Method,
      authId: user_id,
      playingAt: newStartTime,
      makes: total_makes_spot,
      attempts: total_attempts_spot,
      shorts: `${Math.round(overallAvgSpot)}%`,
      freeThrow: `${Math.round(overallFreeThrowSpot)}%`,
      spotSelection: spotResults,
      totalWorkOutTime: totalTimeInMillisecondsPenalty,
      isPenalty: true,
    });

    // Save shooting game
    const saveShootingGameSpot = await shootinggamespot.save();

    if (!saveShootingGameSpot) {
      // loggerError.error("Failed to save shooting game");
      return res.status(400).json({
        success: false,
        message: "Failed to save shooting game",
      });
    }

    const analyticsEntrySpot = new activityModel({
      shootingId: saveShootingGameSpot._id,
      createdBy: user_id,
      shootingCreatedAt: newStartTime, // Store time in milliseconds
    });

    const saveAnalyticsEntrySpot = await analyticsEntrySpot.save();

    // Create a shooting game model and save it

    const shootinggamepenalty = new shootingGameModel({
      gameType,
      Method,
      authId: user_id,
      playingAt: newStartTime,
      makes: total_makes_penalty,
      attempts: total_attempts_penalty,
      penaltyShorts: `${Math.round(overallAvgPenalty)}%`,
      freeThrow: `${Math.round(overallFreeThrowPenalty)}%`,
      penaltySpot: penaltyResults,
      totalWorkOutTime: totalTimeInMillisecondsPenalty,
      isPenalty: true,
    });

    // Save shooting game
    const saveShootingGamePenalty = await shootinggamepenalty.save();

    if (!saveShootingGamePenalty) {
      // loggerError.error("Failed to save shooting game");
      return res.status(400).json({
        success: false,
        message: "Failed to save shooting game",
      });
    }

    const analyticsEntryPenalty = new activityModel({
      shootingId: saveShootingGamePenalty._id,
      createdBy: user_id,
      shootingCreatedAt: newStartTime, // Store time in milliseconds
    });

    const saveAnalyticsEntryPenalty = await analyticsEntryPenalty.save();

    //save shooting history

    const createHistory = new shootingHistoryModel({
      spotId: saveShootingGameSpot._id,
      penaltyId: saveShootingGamePenalty._id,
      authId: user_id,
      workoutTime: totalTimeInMillisecondsPenalty,
      sessionTime: newStartTime,
      totalSpotMakes: total_makes_spot,
      totalSpotAttempt: total_attempts_spot,
      totalPenaltyMakes: total_makes_penalty,
      totalPenaltyAttempt: total_attempts_penalty,
      totalWorkOutTime: totalTimeInMillisecondsPenalty,
      Method,
      gameType,
      totalSpotSuccess: `${Math.floor(overallAvgSpot)}%`,
      totalPenaltySuccess: `${Math.floor(overallAvgPenalty)}%`,
    });

    const saveHistory = await createHistory.save();

    const spotResponse = {
      _id: saveShootingGameSpot._id,
      authId: saveShootingGameSpot.authId,
      gameType: saveShootingGameSpot.gameType,
      Method: saveShootingGameSpot.Method,
      playingAt: saveShootingGameSpot.playingAt,
      makes: saveShootingGameSpot.makes,
      attempts: saveShootingGameSpot.attempts,
      shorts: saveShootingGameSpot.shorts,
      freeThrow: saveShootingGameSpot.freeThrow,
      totalWorkOutTime: saveShootingGameSpot.totalWorkOutTime,
    };

    const penaltyResponse = {
      _id: saveShootingGamePenalty._id,
      authId: saveShootingGamePenalty.authId,
      gameType: saveShootingGamePenalty.gameType,
      Method: saveShootingGamePenalty.Method,
      playingAt: saveShootingGamePenalty.playingAt,
      makes: saveShootingGamePenalty.makes,
      attempts: saveShootingGamePenalty.attempts,
      penaltyShorts: saveShootingGamePenalty.penaltyShorts,
      freeThrow: saveShootingGamePenalty.freeThrow,
      totalWorkOutTime: saveShootingGamePenalty.totalWorkOutTime,
    };

    const totalMakesAndAttempt = {
      Makes: saveShootingGameSpot.makes,
      Attempts: saveShootingGameSpot.attempts,
      shorts: saveShootingGameSpot.shorts,
      freeThrow: saveShootingGameSpot.freeThrow,
    };

    const aroundTheRimsuccessPercentage =
      saveShootingGameSpot.spotSelection.find((obj) => obj.spot == 1).attempts >
      0
        ? (saveShootingGameSpot.spotSelection.find((obj) => obj.spot == 1)
            .makes /
            saveShootingGameSpot.spotSelection.find((obj) => obj.spot == 1)
              .attempts) *
          100
        : 0;

    const aroundTheRimfailurePercentage =
      saveShootingGameSpot.spotSelection.find((obj) => obj.spot == 1).attempts >
      0
        ? 100 - aroundTheRimsuccessPercentage
        : 0;

    const aroundTheRimMakesAndAttempt = {
      Makes: saveShootingGameSpot.spotSelection.find((obj) => obj.spot == 1)
        .makes,
      Attempts: saveShootingGameSpot.spotSelection.find((obj) => obj.spot == 1)
        .attempts,
      shorts: aroundTheRimsuccessPercentage.toFixed(2),
      freeThrow: aroundTheRimfailurePercentage.toFixed(2),
    };

    const shortSpot = [2, 3, 4, 5, 6];

    const shortdata = saveShootingGameSpot.spotSelection
      .filter((item) => shortSpot.includes(item.spot))
      .reduce(
        (acc, obj) => {
          acc.makes += obj.makes || 0;
          acc.attempts += obj.attempts || 0;
          return acc;
        },
        { makes: 0, attempts: 0 }
      ); // Initialize the accumulator with default values

    const shortdatasuccessPercentage =
      shortdata.attempts > 0 ? (shortdata.makes / shortdata.attempts) * 100 : 0;

    const shortdatafailurePercentage =
      shortdata.attempts > 0 ? 100 - shortdatasuccessPercentage : 0;
    const midSpot = [7, 8, 9, 10, 11];

    const middata = saveShootingGameSpot.spotSelection
      .filter((item) => midSpot.includes(item.spot))
      .reduce(
        (acc, obj) => {
          acc.makes += obj.makes || 0;
          acc.attempts += obj.attempts || 0;
          return acc;
        },
        { makes: 0, attempts: 0 }
      ); // Initialize the accumulator with default values

    const middatasuccessPercentage =
      middata.attempts > 0 ? (middata.makes / middata.attempts) * 100 : 0;

    const middatafailurePercentage =
      middata.attempts > 0 ? 100 - middatasuccessPercentage : 0;
    const threeSpot = [12, 13, 14, 15, 16];

    const threedata = saveShootingGameSpot.spotSelection
      .filter((item) => threeSpot.includes(item.spot))
      .reduce(
        (acc, obj) => {
          acc.makes += obj.makes || 0;
          acc.attempts += obj.attempts || 0;
          return acc;
        },
        { makes: 0, attempts: 0 }
      ); // Initialize the accumulator with default values

    const threedatasuccessPercentage =
      threedata.attempts > 0 ? (threedata.makes / threedata.attempts) * 100 : 0;

    const threedatafailurePercentage =
      threedata.attempts > 0 ? 100 - threedatasuccessPercentage : 0;
    const leftSpot = [2, 3, 7, 8, 12, 13];

    const leftdata = saveShootingGameSpot.spotSelection
      .filter((item) => leftSpot.includes(item.spot))
      .reduce(
        (acc, obj) => {
          acc.makes += obj.makes || 0;
          acc.attempts += obj.attempts || 0;
          return acc;
        },
        { makes: 0, attempts: 0 }
      ); // Initialize the accumulator with default values

    const leftdatasuccessPercentage =
      leftdata.attempts > 0 ? (leftdata.makes / leftdata.attempts) * 100 : 0;

    const leftdatafailurePercentage =
      leftdata.attempts > 0 ? 100 - leftdatasuccessPercentage : 0;
    const rightSpot = [5, 6, 10, 11, 15, 16];

    const rightdata = saveShootingGameSpot.spotSelection
      .filter((item) => rightSpot.includes(item.spot))
      .reduce(
        (acc, obj) => {
          acc.makes += obj.makes || 0;
          acc.attempts += obj.attempts || 0;
          return acc;
        },
        { makes: 0, attempts: 0 }
      ); // Initialize the accumulator with default values

    const rightdatasuccessPercentage =
      rightdata.attempts > 0 ? (rightdata.makes / rightdata.attempts) * 100 : 0;

    const rightdatafailurePercentage =
      rightdata.attempts > 0 ? 100 - rightdatasuccessPercentage : 0;
    const centerSpot = [5, 6, 10, 11, 15, 16];

    const centerdata = saveShootingGameSpot.spotSelection
      .filter((item) => centerSpot.includes(item.spot))
      .reduce(
        (acc, obj) => {
          acc.makes += obj.makes || 0;
          acc.attempts += obj.attempts || 0;
          return acc;
        },
        { makes: 0, attempts: 0 }
      ); // Initialize the accumulator with default values

    const centerdatasuccessPercentage =
      centerdata.attempts > 0
        ? (centerdata.makes / centerdata.attempts) * 100
        : 0;

    const centerdatafailurePercentage =
      centerdata.attempts > 0 ? 100 - centerdatasuccessPercentage : 0;

    const shortMakesAndAttempt = {
      Makes: shortdata.makes,
      Attempts: shortdata.attempts,
      shorts: shortdatasuccessPercentage.toFixed(2),
      freeThrow: shortdatafailurePercentage.toFixed(2),
    };

    const midMakesAndAttempt = {
      Makes: middata.makes,
      Attempts: middata.attempts,
      shorts: middatasuccessPercentage.toFixed(2),
      freeThrow: middatafailurePercentage.toFixed(2),
    };
    const threeMakesAndAttempt = {
      Makes: threedata.makes,
      Attempts: threedata.attempts,
      shorts: threedatasuccessPercentage.toFixed(2),
      freeThrow: threedatafailurePercentage.toFixed(2),
    };

    const leftMakesAndAttempt = {
      Makes: leftdata.makes,
      Attempts: leftdata.attempts,
      shorts: leftdatasuccessPercentage.toFixed(2),
      freeThrow: leftdatafailurePercentage.toFixed(2),
    };

    const rightMakesAndAttempt = {
      Makes: rightdata.makes,
      Attempts: rightdata.attempts,
      shorts: rightdatasuccessPercentage.toFixed(2),
      freeThrow: rightdatafailurePercentage.toFixed(2),
    };

    const centerMakesAndAttempt = {
      Makes: centerdata.makes,
      Attempts: centerdata.attempts,
      shorts: centerdatasuccessPercentage.toFixed(2),
      freeThrow: centerdatafailurePercentage.toFixed(2),
    };

    // const saveShootingGameSpotTime = new Date(saveShootingGameSpot.playingAt);

    const spotNameResponse = {
      Total: totalMakesAndAttempt,
      AroundTheRim: aroundTheRimMakesAndAttempt,
      Short: shortMakesAndAttempt,
      Mid: midMakesAndAttempt,
      Three: threeMakesAndAttempt,
      Left: leftMakesAndAttempt,
      Right: rightMakesAndAttempt,
      Center: centerMakesAndAttempt,
      // AmountOfTime:saveShootingGameSpotTime.toLocaleTimeString()
    };

    // Convert to an array of objects without numeric keys
    const objectsArray = Object.values(saveShootingGameSpot.spotSelection);

    // Transform into a single object where each value is an array element
    const resultObject = { values: objectsArray };

    const spotChartResponse = {
      ...resultObject,
    };

    return res.status(200).json({
      success: true,
      message: "Shooting game saved successfully",
      data: {
        spotResponse,
        penaltyResponse,
        spotNameResponse,
        spotChartResponse,
      },
    });
  } else {
    return res.status(400).json({
      success: false,
      message: "spot selection or penalty spot not provide",
    });
  }
};
