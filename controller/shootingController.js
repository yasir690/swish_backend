import authModel from "../model/authModel.js";
import purchaseModel from "../model/purchaseModel.js";
import shootingGameModel from "../model/shootingGameModel.js";
// import { loggerInfo, loggerError } from "../utils/log.js";
import moment from "moment";
import { SingleShotEntry, BulkEntryShot } from "../utils/shootingHandlers.js";
import shootingHistoryModel from "../model/shootingHistoryModel.js";
import mongoose from "mongoose";
import activityModel from "../model/activityAnalyticsModel.js";

//play shooting

export const playShootingGame = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { Method } = req.body;

    const userfind = await authModel.findOne({ _id: user_id });

    if (!userfind) {
      return res
        .status(400)
        .json({
          success: false,
          message: "user not found",
        })
        .populate("parentId");
    }

    console.log(userfind, "userfind");

    const userType = userfind.userType;

    if (userType === "parent") {
      return res.status(400).json({
        success: false,
        message: "parent not allowed to play shooting",
      });
    }

    if (userType === "child") {
      console.log("child login");

      const childpurchase = await purchaseModel.findOne({
        parentId: userfind.parentId,
      });
      console.log(childpurchase, "childpurchase");

      if (!childpurchase) {
        return res.status(400).json({
          success: false,
          message: "subscription not found",
        });
      }

      if (childpurchase) {
        console.log("child purchase called");

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
            if (Method === "SingleShotEntry") {
              return SingleShotEntry(req, res);
            } else if (Method === "BulkEntry") {
              return BulkEntryShot(req, res);
            } else {
              return res.status(400).json({
                success: false,
                message: "Invalid game method",
              });
            }
          }
        }

        //if subscription type is basic

        if (
          childpurchase.subscriptionLevel === "BASIC" ||
          childpurchase.subscriptionLevel === "BASIC_PLUS" ||
          childpurchase.subscriptionLevel === "BASIC_PREMIUM"
        ) {
          console.log("called basic or BASIC_PLUS or BASIC_PREMIUM");

          if (Method === "SingleShotEntry") {
            return SingleShotEntry(req, res);
          } else if (Method === "BulkEntry") {
            return BulkEntryShot(req, res);
          } else {
            return res.status(400).json({
              success: false,
              message: "invalid game method",
            });
          }
        }
      }
    }

    if (userType === "mySelf") {
      console.log("my self login");

      const mySelfpurchase = await purchaseModel.findOne({
        mySelfId: userfind._id,
      });

      if (!mySelfpurchase) {
        return res.status(400).json({
          success: false,
          message: "subscription not found",
        });
      }
      console.log(mySelfpurchase, "mySelfpurchase");

      if (mySelfpurchase) {
        console.log("my self purchase called");

        // // Get the current timestamp in milliseconds
        const currentTimestamp = Date.now();

        //if subscription type is free
        if (mySelfpurchase.subscriptionLevel === "FREE") {
          // Calculate the remaining time in milliseconds
          console.log("called free");
          console.log(currentTimestamp, "currentTimestamp");
          console.log(mySelfpurchase.expirationDate, "purchase.expirationDate");
          const remainingTime =
            mySelfpurchase.expirationDate - currentTimestamp;

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
            if (Method === "SingleShotEntry") {
              return SingleShotEntry(req, res);
            } else if (Method === "BulkEntry") {
              return BulkEntryShot(req, res);
            } else {
              return res.status(400).json({
                success: false,
                message: "Invalid game method",
              });
            }
          }
        }

        //if subscription type is basic

        if (
          mySelfpurchase.subscriptionLevel === "BASIC" ||
          mySelfpurchase.subscriptionLevel === "BASIC_PLUS" ||
          mySelfpurchase.subscriptionLevel === "BASIC_PREMIUM"
        ) {
          console.log("called basic or silver or gold");

          if (Method === "SingleShotEntry") {
            return SingleShotEntry(req, res);
          } else if (Method === "BulkEntry") {
            return BulkEntryShot(req, res);
          } else {
            return res.status(400).json({
              success: false,
              message: "invalid game method",
            });
          }
        }
      }
    }
  } catch (error) {
    // loggerError.error("Internal server error", error.message);
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//spot graph

export const showDataInSpotGraph = async (req, res) => {
  try {
    console.log("called spot");

    const { user_id } = req.user;
    const validTimeframes = ["day", "week", "month", "year"];

    const findchild = await authModel.findOne({ _id: user_id });

    if (!findchild) {
      return res.status(400).json({
        success: false,
        message: "User Not Found",
      });
    }

    const dataByTimeframe = {};

    for (const timeframe of validTimeframes) {
      const currentDate = moment();
      let startDate;
      let endDate;

      if (timeframe === "day") {
        startDate = currentDate.clone().startOf("day");
        endDate = currentDate.clone().endOf("day");
      } else if (timeframe === "week") {
        startDate = currentDate.clone().startOf("week");
        endDate = currentDate.clone().endOf("week");
      } else if (timeframe === "month") {
        startDate = currentDate.clone().startOf("month");
        endDate = currentDate.clone().endOf("month");
      } else if (timeframe === "year") {
        startDate = currentDate.clone().startOf("year");
        endDate = currentDate.clone().endOf("year");
      }

      const shootinggamedata = await shootingGameModel.find({
        authId: user_id,
        playingAt: {
          $gte: startDate,
          $lte: endDate,
        },
      });

      if (!shootinggamedata || shootinggamedata.length === 0) {
        dataByTimeframe[timeframe] = [];
      } else {
        const uniqueSpots = new Set();
        const spotDataMap = new Map();

        for (const game of shootinggamedata) {
          for (const spotSelection of game.spotSelection) {
            const spot = spotSelection.spot;
            uniqueSpots.add(spot);
            if (spotDataMap.has(spot)) {
              const currentData = spotDataMap.get(spot);
              currentData.makes += spotSelection.makes;
              currentData.attempts += spotSelection.attempts;
            } else {
              spotDataMap.set(spot, {
                makes: spotSelection.makes,
                attempts: spotSelection.attempts,
              });
            }
          }
        }

        const spotResults = [];

        // Include statistics for each spot
        for (let spot = 1; spot <= 16; spot++) {
          const stats = spotDataMap.get(spot) || { makes: 0, attempts: 0 };
          const makes = stats.makes;
          const attempts = stats.attempts;

          const shotAvg = attempts !== 0 ? (makes / attempts) * 100 : "";
          const spotFreeThrow = attempts !== 0 ? 100 - shotAvg : "";
          const roundValueShotAvg = attempts !== 0 ? Math.round(shotAvg) : "";
          const roundValueFreeThrow =
            attempts !== 0 ? Math.round(spotFreeThrow) : "";

          const spotStats = {
            spot,
            makes,
            attempts,
            shorts: roundValueShotAvg !== "" ? `${roundValueShotAvg}%` : "", // Adjusted
            freeThrow:
              roundValueFreeThrow !== "" ? `${roundValueFreeThrow}%` : "", // Adjusted
          };
          spotResults.push(spotStats);
        }

        for (const spot of Array.from(uniqueSpots)) {
          if (!spotResults.some((result) => result.spot === spot)) {
            spotResults.push({
              spot,
              makes: 0,
              attempts: 0,
              shorts: "", // Set to empty string
              freeThrow: "", // Set to empty string
            });
          }
        }
        console.log(spotResults);
        dataByTimeframe[timeframe] = spotResults;
      }
    }

    return res.status(200).json({
      success: true,
      message: "Shooting Data Found Successfully",
      data: dataByTimeframe,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//date graph

export const showDataInGraph = async (req, res) => {
  try {
    console.log("called data graph");

    const { user_id } = req.user;
    const findchild = await authModel.findOne({ _id: user_id });

    if (!findchild) {
      return res.status(400).json({
        success: false,
        message: "User Not Found",
      });
    }

    const currentDate = moment();
    const startDateDay = currentDate.clone().startOf("day");
    const endDateDay = currentDate.clone().endOf("day");

    const weekStartDate = currentDate.clone().startOf("week");
    const weekEndDate = currentDate.clone().endOf("week");

    const monthStartDate = currentDate.clone().startOf("month");
    const monthEndDate = currentDate.clone().endOf("month");

    const yearStartDate = currentDate.clone().startOf("year");
    const yearEndDate = currentDate.clone().endOf("year");

    // Fetch all relevant data at once
    const shootinggamedata = await shootingGameModel
      .find({
        authId: user_id,
        playingAt: {
          $gte: yearStartDate,
          $lte: endDateDay,
        },
      })
      .exec();

    // Helper function to calculate stats
    function calculateStats(data) {
      const totalStats = {
        makes: 0,
        attempts: 0,
        shorts: "0.00%",
        freeThrow: "0.00%",
      };

      data.forEach((game) => {
        game.spotSelection.forEach((spotSelection) => {
          totalStats.makes += spotSelection.makes;
          totalStats.attempts += spotSelection.attempts;
        });
      });

      if (totalStats.attempts > 0) {
        const shotAvg = (totalStats.makes / totalStats.attempts) * 100;
        const shotFreeThrow = 100 - shotAvg;
        totalStats.shorts = `${shotAvg.toFixed(2)}%`;
        totalStats.freeThrow = `${shotFreeThrow.toFixed(2)}%`;
      } else if (totalStats.attempts === 1) {
        totalStats.shorts = totalStats.makes === 1 ? "100%" : "0.00%";
        totalStats.freeThrow = totalStats.makes === 0 ? "100%" : "0.00%";
      }

      return totalStats;
    }

    // Process data for each timeframe
    function processTimeframe(startDate, endDate, data) {
      const results = [];
      let currentDate = startDate.clone();

      while (currentDate <= endDate) {
        // Ensure `currentDate` and `d.playingAt` are compared correctly
        const startOfDay = currentDate.clone().startOf("day");
        const endOfDay = currentDate.clone().endOf("day");

        // Filter data for the current date
        const dayData = data.filter((d) => {
          const playingAtMoment = moment(d.playingAt);
          return playingAtMoment.isBetween(startOfDay, endOfDay, null, "[)");
        });

        // Add stats for the current date
        results.push({
          date: currentDate.format("YYYY-MM-DD"),
          day: currentDate.format("dddd"),
          ...calculateStats(dayData),
        });

        // Move to the next day
        currentDate = currentDate.add(1, "day");
      }

      return results;
    }

    const shootingStatsByTimeframe = {
      day: processTimeframe(startDateDay, endDateDay, shootinggamedata),
      week: processTimeframe(weekStartDate, weekEndDate, shootinggamedata),
      month: processTimeframe(monthStartDate, monthEndDate, shootinggamedata),
      year: processTimeframe(yearStartDate, yearEndDate, shootinggamedata),
    };

    return res.status(200).json({
      success: true,
      message: "Shooting Data Found Successfully",
      data: shootingStatsByTimeframe,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const showDataInDropDownSpotBase = async (req, res) => {
  try {
    const { user_id } = req.user;

    const user = await authModel.findOne({ _id: user_id });
    const { spotfilter, duration } = req.query;

    console.log("req.query:", req.query);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "user not found",
      });
    }

    // Define shootingStatsByTimeframe here as an object
    const shootingStatsByTimeframe = {
      day: [], // Initialize day as an array
      week: [], // Initialize week as an array
      month: [], // Initialize month as an array
      year: [], // Initialize year as an array
    };

    const currentDate = moment();

    async function calculateShootingStats(
      user_id,
      startDate,
      endDate,
      spotSelection
    ) {
      const shootinggamedata = await shootingGameModel.find({
        authId: user_id,
        playingAt: {
          $gte: startDate,
          $lte: endDate,
        },
      });

      const spotStats = {}; // Object to store stats for each spot

      if (shootinggamedata && shootinggamedata.length > 0) {
        for (const game of shootinggamedata) {
          for (const spot of spotSelection) {
            const spotSelectionData = game.spotSelection.find(
              (s) => s.spot === spot
            );
            if (spotSelectionData) {
              if (!spotStats[spot]) {
                spotStats[spot] = {
                  makes: 0,
                  attempts: 0,
                  shorts: "0.00%",
                  freeThrow: "0.00%",
                };
              }
              spotStats[spot].makes += spotSelectionData.makes;
              spotStats[spot].attempts += spotSelectionData.attempts;
            }
          }
        }
      }

      // Calculate percentages for each spot
      for (const spot in spotStats) {
        const stats = spotStats[spot];
        if (stats.attempts === 1) {
          stats.shorts = stats.makes === 1 ? "100%" : "0.00%";
          stats.freeThrow = stats.makes === 0 ? "100%" : "0.00%";
        } else if (stats.attempts > 0) {
          const shotAvg = (stats.makes / stats.attempts) * 100;
          const shotFreeThrow = 100 - shotAvg;
          stats.shorts = `${shotAvg.toFixed(2)}%`;
          stats.freeThrow = `${shotFreeThrow.toFixed(2)}%`;
        }
      }

      return spotStats;
    }

    async function calculatePenaltyShootingStats(user_id, startDate, endDate) {
      const shootinggamedata = await shootingGameModel.find({
        authId: user_id,
        playingAt: {
          $gte: startDate,
          $lte: endDate,
        },
      });

      const overallStats = {
        makes: 0,
        attempts: 0,
        shorts: "0.00%",
        freeThrow: "0.00%",
      };

      if (shootinggamedata && shootinggamedata.length > 0) {
        for (const game of shootinggamedata) {
          for (const penaltySelectionData of game.penaltySpot) {
            overallStats.makes += penaltySelectionData.makes;
            overallStats.attempts += penaltySelectionData.attempts;
          }
        }
      }

      // Calculate percentages
      if (overallStats.attempts > 0) {
        const shotAvg = (overallStats.makes / overallStats.attempts) * 100;
        const shotFreeThrow = 100 - shotAvg;
        overallStats.shorts = `${shotAvg.toFixed(2)}%`;
        overallStats.freeThrow = `${shotFreeThrow.toFixed(2)}%`;
      }

      return overallStats;
    }

    if (spotfilter) {
      const lowercaseSpotFilter = spotfilter.toLowerCase();

      if (lowercaseSpotFilter === "freethrow") {
        if (duration && duration.toLowerCase() === "day") {
          console.log("freethrow with day");

          const startDateDay = currentDate.clone().startOf("day");

          const shootingStatsForDayPromise = calculatePenaltyShootingStats(
            user_id,
            startDateDay,
            currentDate
          );

          const shootingStatsForDay = await shootingStatsForDayPromise;

          let totalMakes = 0;
          let totalAttempts = 0;

          console.log(shootingStatsForDay, "shootingStatsForDay");

          totalMakes += shootingStatsForDay.makes;
          totalAttempts += shootingStatsForDay.attempts;

          let shortPercentage =
            totalAttempts > 0
              ? ((totalMakes / totalAttempts) * 100).toFixed(2) + "%"
              : "0.00%";
          let freeThrowPercentage =
            totalAttempts > 0
              ? (100 - parseFloat(shortPercentage)).toFixed(2) + "%"
              : "0.00%";

          // Constructing the final single object
          const consolidatedStats = {
            date: currentDate.format("YYYY-MM-DD"),
            day: currentDate.format("dddd"),
            makes: totalMakes,
            attempts: totalAttempts,
            short: shortPercentage,
            freethrow: freeThrowPercentage,
          };

          // Adding consolidated stats to shootingStatsByTimeframe.day
          shootingStatsByTimeframe.day.push(consolidatedStats);

          // Add your logic for 'aroundtherim' with 'month' here
          return res.status(200).json({
            success: true,
            message: "spot data found successfully",
            data: shootingStatsByTimeframe.day,
          });
        }
        if (duration && duration.toLowerCase() === "week") {
          console.log("freethrow with week");

          // Calculate shootingStats for the week
          const weekStartDate = currentDate.clone().startOf("week");
          const weekEndDate = currentDate.clone().endOf("week");
          const startDateofWeek = new Date(weekStartDate).getDate();
          const endDateofWeek = new Date(weekEndDate).getDate();
          console.log(startDateofWeek, "startDateofWeek");
          console.log(endDateofWeek, "endDateofWeek");
          console.log(weekEndDate.format("YYYY-MM-DD"));
          const daysInWeek = weekEndDate.diff(weekStartDate, "days") + 1;
          const weekPromises = [];
          for (let i = 0; i < daysInWeek; i++) {
            const startDate = weekStartDate.clone().add(i, "days");
            const endDate = weekStartDate.clone().add(i, "days").endOf("day");
            weekPromises.push(
              calculatePenaltyShootingStats(user_id, startDate, endDate)
            );
          }

          const shootingStatsForWeek = await Promise.all(weekPromises);

          console.log(shootingStatsForWeek, "shootingStatsForWeek");

          const dataForWeek = shootingStatsForWeek.map((stats, index) => {
            // Initialize totals
            let totalMakes = stats.makes || 0;
            let totalAttempts = stats.attempts || 0;

            // Calculate shooting percentages
            let shortPercentage =
              totalAttempts > 0
                ? ((totalMakes / totalAttempts) * 100).toFixed(2) + "%"
                : "0.00%";
            let freeThrowPercentage =
              totalAttempts > 0
                ? (100 - parseFloat(shortPercentage)).toFixed(2) + "%"
                : "0.00%";

            return {
              date: weekStartDate
                .clone()
                .add(index, "days")
                .format("YYYY-MM-DD"),
              day: weekStartDate.clone().add(index, "days").format("dddd"),
              makes: totalMakes,
              attempts: totalAttempts,
              short: shortPercentage,
              freeThrow: freeThrowPercentage,
            };
          });

          // Add your logic for 'aroundtherim' with 'month' here
          return res.status(200).json({
            success: true,
            message: "spot data found successfully",
            data: dataForWeek,
          });
        }
        if (duration && duration.toLowerCase() === "month") {
          console.log("freethrow with month");
          // Calculate shootingStats for the month
          const monthStartDate = currentDate.clone().startOf("month");
          const monthEndDate = currentDate.clone().endOf("month");

          const daysInMonth = monthEndDate.diff(monthStartDate, "days") + 1;
          const monthPromises = [];

          for (let i = 0; i < daysInMonth; i++) {
            const startDate = monthStartDate.clone().add(i, "days");
            const endDate = monthStartDate.clone().add(i, "days").endOf("day");
            monthPromises.push(
              calculatePenaltyShootingStats(user_id, startDate, endDate)
            );
          }

          const shootingStatsForMonth = await Promise.all(monthPromises);

          const dataForMonth = shootingStatsForMonth.map((stats, index) => {
            // Initialize totals
            let totalMakes = stats.makes || 0;
            let totalAttempts = stats.attempts || 0;

            // Calculate shooting percentages
            let shortPercentage =
              totalAttempts > 0
                ? ((totalMakes / totalAttempts) * 100).toFixed(2) + "%"
                : "0.00%";
            let freeThrowPercentage =
              totalAttempts > 0
                ? (100 - parseFloat(shortPercentage)).toFixed(2) + "%"
                : "0.00%";

            return {
              date: monthStartDate
                .clone()
                .add(index, "days")
                .format("YYYY-MM-DD"),
              day: monthStartDate.clone().add(index, "days").format("dddd"),
              makes: totalMakes,
              attempts: totalAttempts,
              short: shortPercentage,
              freeThrow: freeThrowPercentage,
            };
          });

          // Add your logic for 'aroundtherim' with 'month' here
          return res.status(200).json({
            success: true,
            message: "spot data found successfully",
            data: dataForMonth,
          });
        }
        if (duration && duration.toLowerCase() === "year") {
          console.log("freethrow with year");
          // Add your logic for 'all' with 'month' here

          // Calculate shootingStats for the year
          const yearStartDate = currentDate.clone().startOf("year");
          const yearEndDate = currentDate.clone().endOf("year");

          const daysInYear = yearEndDate.diff(yearStartDate, "days") + 1;
          const yearPromises = [];

          for (let i = 0; i < daysInYear; i++) {
            const startDate = yearStartDate.clone().add(i, "days");
            const endDate = yearStartDate.clone().add(i, "days").endOf("day");
            yearPromises.push(
              calculatePenaltyShootingStats(user_id, startDate, endDate)
            );
          }

          const shootingStatsForYear = await Promise.all(yearPromises);

          const dataForYear = shootingStatsForYear.map((stats, index) => {
            // Initialize totals
            let totalMakes = stats.makes || 0;
            let totalAttempts = stats.attempts || 0;

            // Calculate shooting percentages
            let shortPercentage =
              totalAttempts > 0
                ? ((totalMakes / totalAttempts) * 100).toFixed(2) + "%"
                : "0.00%";
            let freeThrowPercentage =
              totalAttempts > 0
                ? (100 - parseFloat(shortPercentage)).toFixed(2) + "%"
                : "0.00%";

            return {
              date: yearStartDate
                .clone()
                .add(index, "days")
                .format("YYYY-MM-DD"),
              day: yearStartDate.clone().add(index, "days").format("dddd"),
              makes: totalMakes,
              attempts: totalAttempts,
              short: shortPercentage,
              freeThrow: freeThrowPercentage,
            };
          });

          return res.status(200).json({
            success: true,
            message: "spot data found successfully",
            data: dataForYear,
          });
        }
      } else if (lowercaseSpotFilter === "all") {
        if (duration && duration.toLowerCase() === "day") {
          const spotAllSelection = [
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
          ];

          const startDateDay = currentDate.clone().startOf("day");

          const shootingStatsForDayPromise = calculateShootingStats(
            user_id,
            startDateDay,
            currentDate,
            spotAllSelection
          );

          const shootingStatsForDay = await shootingStatsForDayPromise;

          //  shootingStatsByTimeframe.day.push({
          //       date: currentDate.format("YYYY-MM-DD"),
          //       day: currentDate.format("dddd"),
          //       ...shootingStatsForDay,
          //     });

          // Summing makes and attempts for all spots
          let totalMakes = 0;
          let totalAttempts = 0;

          for (let i = 1; i <= 16; i++) {
            if (shootingStatsForDay[i]) {
              totalMakes += shootingStatsForDay[i].makes || 0;
              totalAttempts += shootingStatsForDay[i].attempts || 0;
              delete shootingStatsForDay[i]; // Remove individual spot data
            }
          }
          // Calculating shooting percentages
          // Calculating shooting percentages
          let shortPercentage =
            totalAttempts > 0
              ? ((totalMakes / totalAttempts) * 100).toFixed(2) + "%"
              : "0.00%";
          let freeThrowPercentage =
            totalAttempts > 0
              ? (100 - parseFloat(shortPercentage)).toFixed(2) + "%"
              : "0.00%";

          // Constructing the final single object
          const consolidatedStats = {
            date: currentDate.format("YYYY-MM-DD"),
            day: currentDate.format("dddd"),
            makes: totalMakes,
            attempts: totalAttempts,
            short: shortPercentage,
            freethrow: freeThrowPercentage,
          };

          // Adding consolidated stats to shootingStatsByTimeframe.day
          shootingStatsByTimeframe.day.push(consolidatedStats);

          // Wait for the promise to resolve

          return res.status(200).json({
            success: true,
            message: "Stats found successfully",
            data: shootingStatsByTimeframe.day,
          });
        }
        if (duration && duration.toLowerCase() === "week") {
          console.log("All with week");

          const spotAllSelection = [
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
          ];

          // Calculate shootingStats for the week
          const weekStartDate = currentDate.clone().startOf("week");
          const weekEndDate = currentDate.clone().endOf("week");
          const startDateofWeek = new Date(weekStartDate).getDate();
          const endDateofWeek = new Date(weekEndDate).getDate();
          console.log(startDateofWeek, "startDateofWeek");
          console.log(endDateofWeek, "endDateofWeek");
          console.log(weekEndDate.format("YYYY-MM-DD"));
          const daysInWeek = weekEndDate.diff(weekStartDate, "days") + 1;
          const weekPromises = [];
          for (let i = 0; i < daysInWeek; i++) {
            const startDate = weekStartDate.clone().add(i, "days");
            const endDate = weekStartDate.clone().add(i, "days").endOf("day");
            weekPromises.push(
              calculateShootingStats(
                user_id,
                startDate,
                endDate,
                spotAllSelection
              )
            );
          }

          const shootingStatsForWeek = await Promise.all(weekPromises);

          const dataForWeek = shootingStatsForWeek.map((stats, index) => {
            let totalMakes = 0;
            let totalAttempts = 0;

            // Calculate total makes and attempts for the day
            for (let i = 1; i <= 16; i++) {
              if (stats[i]) {
                totalMakes += stats[i].makes || 0;
                totalAttempts += stats[i].attempts || 0;
                delete stats[i]; // Remove individual spot data
              }
            }

            // Calculate shooting percentages
            let shortPercentage =
              totalAttempts > 0
                ? ((totalMakes / totalAttempts) * 100).toFixed(2) + "%"
                : "0.00%";
            let freeThrowPercentage =
              totalAttempts > 0
                ? (100 - parseFloat(shortPercentage)).toFixed(2) + "%"
                : "0.00%";

            return {
              date: weekStartDate
                .clone()
                .add(index, "days")
                .format("YYYY-MM-DD"),
              day: weekStartDate.clone().add(index, "days").format("dddd"),
              makes: totalMakes,
              attempts: totalAttempts,
              short: shortPercentage,
              freeThrow: freeThrowPercentage,
            };
          });

          console.log(shootingStatsForWeek, "shootingStatsForWeek");

          return res.status(200).json({
            success: true,
            message: "Stats found successfully",
            data: dataForWeek,
          });
        }
        if (duration && duration.toLowerCase() === "month") {
          console.log("All with month");

          const spotAllSelection = [
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
          ];

          const monthStartDate = currentDate.clone().startOf("month");
          const monthEndDate = currentDate.clone().endOf("month");
          const startDateofMonth = new Date(monthStartDate).getDate();
          const endDateofMonth = new Date(monthEndDate).getDate();
          const daysInMonth = monthEndDate.diff(monthStartDate, "days") + 1;
          const monthPromises = [];
          //  console.log(monthEndDate,'monthEndDate')
          for (let i = 0; i < daysInMonth; i++) {
            const startDate = monthStartDate.clone().add(i, "days");
            const endDate = monthStartDate.clone().add(i, "days").endOf("day");
            monthPromises.push(
              calculateShootingStats(
                user_id,
                startDate,
                endDate,
                spotAllSelection
              )
            );
          }

          const shootingStatsForMonth = await Promise.all(monthPromises);

          // shootingStatsByTimeframe.month = shootingStatsForMonth.map(
          //   (stats, index) => ({
          //     date: monthStartDate.clone().add(index, "days").format("YYYY-MM-DD"),
          //     day: monthStartDate.clone().add(index, "days").format("dddd"),
          //     ...stats
          //   })
          // );

          const dataForMonth = shootingStatsForMonth.map((stats, index) => {
            let totalMakes = 0;
            let totalAttempts = 0;

            // Calculate total makes and attempts for the day
            for (let i = 1; i <= 16; i++) {
              if (stats[i]) {
                totalMakes += stats[i].makes || 0;
                totalAttempts += stats[i].attempts || 0;
                delete stats[i]; // Remove individual spot data
              }
            }

            // Calculate shooting percentages
            let shortPercentage =
              totalAttempts > 0
                ? ((totalMakes / totalAttempts) * 100).toFixed(2) + "%"
                : "0.00%";
            let freeThrowPercentage =
              totalAttempts > 0
                ? (100 - parseFloat(shortPercentage)).toFixed(2) + "%"
                : "0.00%";

            return {
              date: monthStartDate
                .clone()
                .add(index, "days")
                .format("YYYY-MM-DD"),
              day: monthStartDate.clone().add(index, "days").format("dddd"),
              makes: totalMakes,
              attempts: totalAttempts,
              short: shortPercentage,
              freeThrow: freeThrowPercentage,
            };
          });

          return res.status(200).json({
            success: true,
            message: "Stats found successfully",
            data: dataForMonth,
          });
        }
        if (duration && duration.toLowerCase() === "year") {
          console.log("All with year");

          const spotAllSelection = [
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
          ];

          // Add your logic for 'all' with 'month' here
          const yearStartDate = currentDate.clone().startOf("year");
          const yearEndDate = currentDate.clone().endOf("year");
          console.log(yearStartDate, "yearStartDate");
          console.log(yearEndDate, "yearEndDate");
          const startDateofYear = new Date(yearStartDate).getDate();
          const endDateofYear = new Date(yearEndDate).getDate();
          console.log(endDateofYear, "endDateofYear");
          // Calculate number of days in the current year
          const daysInYear = yearEndDate.diff(yearStartDate, "days") + 1;
          const yearPromises = [];
          for (let i = 0; i < daysInYear; i++) {
            const startDate = yearStartDate.clone().add(i, "days");
            const endDate = yearStartDate.clone().add(i, "days").endOf("day");
            yearPromises.push(
              calculateShootingStats(
                user_id,
                startDate,
                endDate,
                spotAllSelection
              )
            );
          }

          const shootingStatsForYear = await Promise.all(yearPromises);

          // shootingStatsByTimeframe.year = shootingStatsForYear.map(
          //   (stats, index) => ({
          //     date: yearStartDate.clone().add(index, "days").format("YYYY-MM-DD"),
          //     day: yearStartDate.clone().add(index, "days").format("dddd"),
          //     ...stats
          //   })
          // );

          const dataForYear = shootingStatsForYear.map((stats, index) => {
            let totalMakes = 0;
            let totalAttempts = 0;

            // Calculate total makes and attempts for the month
            for (let i = 1; i <= 16; i++) {
              if (stats[i]) {
                totalMakes += stats[i].makes || 0;
                totalAttempts += stats[i].attempts || 0;
                delete stats[i]; // Remove individual spot data
              }
            }

            // Calculate shooting percentages
            let shortPercentage =
              totalAttempts > 0
                ? ((totalMakes / totalAttempts) * 100).toFixed(2) + "%"
                : "0.00%";
            let freeThrowPercentage =
              totalAttempts > 0
                ? (100 - parseFloat(shortPercentage)).toFixed(2) + "%"
                : "0.00%";

            return {
              date: yearStartDate
                .clone()
                .add(index, "days")
                .format("YYYY-MM-DD"),
              month: yearStartDate.clone().add(index, "days").format("MMMM"),
              makes: totalMakes,
              attempts: totalAttempts,
              short: shortPercentage,
              freeThrow: freeThrowPercentage,
            };
          });

          return res.status(200).json({
            success: true,
            message: "Stats found successfully",
            data: dataForYear,
          });
        }
      } else if (spotfilter === "Around the rim") {
        if (duration && duration.toLowerCase() === "day") {
          console.log("aroundtherim with day");
          const spotAroundTheRimSelection = [1];

          const startDateDay = currentDate.clone().startOf("day");

          const shootingStatsForDayPromise = calculateShootingStats(
            user_id,
            startDateDay,
            currentDate,
            spotAroundTheRimSelection
          );

          const shootingStatsForDay = await shootingStatsForDayPromise;

          let totalMakes = 0;
          let totalAttempts = 0;

          console.log(shootingStatsForDay, "shootingStatsForDay");

          for (let key in shootingStatsForDay) {
            if (shootingStatsForDay.hasOwnProperty(key)) {
              totalMakes += shootingStatsForDay[key].makes || 0; // Accumulate makes, default to 0 if undefined
              totalAttempts += shootingStatsForDay[key].attempts || 0; // Accumulate attempts, default to 0 if undefined
            }
          }

          let shortPercentage =
            totalAttempts > 0
              ? ((totalMakes / totalAttempts) * 100).toFixed(2) + "%"
              : "0.00%";
          let freeThrowPercentage =
            totalAttempts > 0
              ? (100 - parseFloat(shortPercentage)).toFixed(2) + "%"
              : "0.00%";

          // Constructing the final single object
          const consolidatedStats = {
            date: currentDate.format("YYYY-MM-DD"),
            day: currentDate.format("dddd"),
            makes: totalMakes,
            attempts: totalAttempts,
            short: shortPercentage,
            freethrow: freeThrowPercentage,
          };

          // Adding consolidated stats to shootingStatsByTimeframe.day
          shootingStatsByTimeframe.day.push(consolidatedStats);

          // Add your logic for 'aroundtherim' with 'month' here
          return res.status(200).json({
            success: true,
            message: "spot data found successfully",
            data: shootingStatsByTimeframe.day,
          });
        }
        if (duration && duration.toLowerCase() === "week") {
          console.log("aroundtherim with week");

          const spotAroundTheRimSelection = [1];

          // Calculate shootingStats for the week
          const weekStartDate = currentDate.clone().startOf("week");
          const weekEndDate = currentDate.clone().endOf("week");
          const startDateofWeek = new Date(weekStartDate).getDate();
          const endDateofWeek = new Date(weekEndDate).getDate();
          console.log(startDateofWeek, "startDateofWeek");
          console.log(endDateofWeek, "endDateofWeek");
          console.log(weekEndDate.format("YYYY-MM-DD"));
          const daysInWeek = weekEndDate.diff(weekStartDate, "days") + 1;
          const weekPromises = [];
          for (let i = 0; i < daysInWeek; i++) {
            const startDate = weekStartDate.clone().add(i, "days");
            const endDate = weekStartDate.clone().add(i, "days").endOf("day");
            weekPromises.push(
              calculateShootingStats(
                user_id,
                startDate,
                endDate,
                spotAroundTheRimSelection
              )
            );
          }

          const shootingStatsForWeek = await Promise.all(weekPromises);

          console.log(shootingStatsForWeek, "shootingStatsForWeek");

          const dataForWeek = shootingStatsForWeek.map((stats, index) => {
            let totalMakes = 0;
            let totalAttempts = 0;

            // Check if stats has data for spot 1 ('1')
            if (stats["1"]) {
              totalMakes += stats["1"].makes || 0;
              totalAttempts += stats["1"].attempts || 0;
            }

            // Calculate shooting percentages
            let shortPercentage =
              totalAttempts > 0
                ? ((totalMakes / totalAttempts) * 100).toFixed(2) + "%"
                : "0.00%";
            let freeThrowPercentage =
              totalAttempts > 0
                ? (100 - parseFloat(shortPercentage)).toFixed(2) + "%"
                : "0.00%";

            return {
              date: weekStartDate
                .clone()
                .add(index, "days")
                .format("YYYY-MM-DD"),
              day: weekStartDate.clone().add(index, "days").format("dddd"),
              makes: totalMakes,
              attempts: totalAttempts,
              short: shortPercentage,
              freeThrow: freeThrowPercentage,
            };
          });

          // Add your logic for 'aroundtherim' with 'month' here
          return res.status(200).json({
            success: true,
            message: "spot data found successfully",
            data: dataForWeek,
          });
        }
        if (duration && duration.toLowerCase() === "month") {
          console.log("aroundtherim with month");

          const spotAroundTheRimSelection = [1]; // Example spot selection

          // Calculate shootingStats for the month
          const monthStartDate = currentDate.clone().startOf("month");
          const monthEndDate = currentDate.clone().endOf("month");

          const daysInMonth = monthEndDate.diff(monthStartDate, "days") + 1;
          const monthPromises = [];

          for (let i = 0; i < daysInMonth; i++) {
            const startDate = monthStartDate.clone().add(i, "days");
            const endDate = monthStartDate.clone().add(i, "days").endOf("day");
            monthPromises.push(
              calculateShootingStats(
                user_id,
                startDate,
                endDate,
                spotAroundTheRimSelection
              )
            );
          }

          const shootingStatsForMonth = await Promise.all(monthPromises);

          const dataForMonth = shootingStatsForMonth.map((stats, index) => {
            let totalMakes = 0;
            let totalAttempts = 0;

            // Check if stats has data for spot 1 ('1')
            if (stats["1"]) {
              totalMakes += stats["1"].makes || 0;
              totalAttempts += stats["1"].attempts || 0;
            }

            // Calculate shooting percentages
            let shortPercentage =
              totalAttempts > 0
                ? ((totalMakes / totalAttempts) * 100).toFixed(2) + "%"
                : "0.00%";
            let freeThrowPercentage =
              totalAttempts > 0
                ? (100 - parseFloat(shortPercentage)).toFixed(2) + "%"
                : "0.00%";

            return {
              date: monthStartDate
                .clone()
                .add(index, "days")
                .format("YYYY-MM-DD"),
              day: monthStartDate.clone().add(index, "days").format("dddd"),
              makes: totalMakes,
              attempts: totalAttempts,
              short: shortPercentage,
              freeThrow: freeThrowPercentage,
            };
          });

          return res.status(200).json({
            success: true,
            message: "Spot data found successfully for the month",
            data: dataForMonth,
          });
        }

        if (duration && duration.toLowerCase() === "year") {
          console.log("aroundtherim with year");

          const spotAroundTheRimSelection = [1]; // Example spot selection

          // Calculate shootingStats for the year
          const yearStartDate = currentDate.clone().startOf("year");
          const yearEndDate = currentDate.clone().endOf("year");

          const daysInYear = yearEndDate.diff(yearStartDate, "days") + 1;
          const yearPromises = [];

          for (let i = 0; i < daysInYear; i++) {
            const startDate = yearStartDate.clone().add(i, "days");
            const endDate = yearStartDate.clone().add(i, "days").endOf("day");
            yearPromises.push(
              calculateShootingStats(
                user_id,
                startDate,
                endDate,
                spotAroundTheRimSelection
              )
            );
          }

          const shootingStatsForYear = await Promise.all(yearPromises);

          const dataForYear = shootingStatsForYear.map((stats, index) => {
            let totalMakes = 0;
            let totalAttempts = 0;

            // Check if stats has data for spot 1 ('1')
            if (stats["1"]) {
              totalMakes += stats["1"].makes || 0;
              totalAttempts += stats["1"].attempts || 0;
            }

            // Calculate shooting percentages
            let shortPercentage =
              totalAttempts > 0
                ? ((totalMakes / totalAttempts) * 100).toFixed(2) + "%"
                : "0.00%";
            let freeThrowPercentage =
              totalAttempts > 0
                ? (100 - parseFloat(shortPercentage)).toFixed(2) + "%"
                : "0.00%";

            return {
              date: yearStartDate
                .clone()
                .add(index, "days")
                .format("YYYY-MM-DD"),
              day: yearStartDate.clone().add(index, "days").format("dddd"),
              makes: totalMakes,
              attempts: totalAttempts,
              short: shortPercentage,
              freeThrow: freeThrowPercentage,
            };
          });

          return res.status(200).json({
            success: true,
            message: "Spot data found successfully for the year",
            data: dataForYear,
          });
        }
      } else if (lowercaseSpotFilter === "short") {
        if (duration && duration.toLowerCase() === "day") {
          console.log("short with day");

          const spotShortSelection = [2, 3, 4, 5, 6];

          const startDateDay = currentDate.clone().startOf("day");

          const shootingStatsForDayPromise = calculateShootingStats(
            user_id,
            startDateDay,
            currentDate,
            spotShortSelection
          );

          const shootingStatsForDay = await shootingStatsForDayPromise;

          let totalMakes = 0;
          let totalAttempts = 0;

          console.log(shootingStatsForDay, "shootingStatsForDay");

          for (let key in shootingStatsForDay) {
            if (shootingStatsForDay.hasOwnProperty(key)) {
              totalMakes += shootingStatsForDay[key].makes || 0; // Accumulate makes, default to 0 if undefined
              totalAttempts += shootingStatsForDay[key].attempts || 0; // Accumulate attempts, default to 0 if undefined
            }
          }
          let shortPercentage =
            totalAttempts > 0
              ? ((totalMakes / totalAttempts) * 100).toFixed(2) + "%"
              : "0.00%";
          let freeThrowPercentage =
            totalAttempts > 0
              ? (100 - parseFloat(shortPercentage)).toFixed(2) + "%"
              : "0.00%";

          // Constructing the final single object
          const consolidatedStats = {
            date: currentDate.format("YYYY-MM-DD"),
            day: currentDate.format("dddd"),
            makes: totalMakes,
            attempts: totalAttempts,
            short: shortPercentage,
            freethrow: freeThrowPercentage,
          };

          // Adding consolidated stats to shootingStatsByTimeframe.day
          shootingStatsByTimeframe.day.push(consolidatedStats);

          // Add your logic for 'aroundtherim' with 'month' here
          return res.status(200).json({
            success: true,
            message: "spot data found successfully",
            data: shootingStatsByTimeframe.day,
          });
        }
        if (duration && duration.toLowerCase() === "week") {
          console.log("short with week");
          const spotShortSelection = [2, 3, 4, 5, 6];

          // Calculate shootingStats for the week
          const weekStartDate = currentDate.clone().startOf("week");
          const weekEndDate = currentDate.clone().endOf("week");
          const startDateofWeek = new Date(weekStartDate).getDate();
          const endDateofWeek = new Date(weekEndDate).getDate();
          console.log(startDateofWeek, "startDateofWeek");
          console.log(endDateofWeek, "endDateofWeek");
          console.log(weekEndDate.format("YYYY-MM-DD"));
          const daysInWeek = weekEndDate.diff(weekStartDate, "days") + 1;
          const weekPromises = [];
          for (let i = 0; i < daysInWeek; i++) {
            const startDate = weekStartDate.clone().add(i, "days");
            const endDate = weekStartDate.clone().add(i, "days").endOf("day");
            weekPromises.push(
              calculateShootingStats(
                user_id,
                startDate,
                endDate,
                spotShortSelection
              )
            );
          }

          const shootingStatsForWeek = await Promise.all(weekPromises);

          console.log(shootingStatsForWeek, "shootingStatsForWeek");

          const dataForWeek = shootingStatsForWeek.map((stats, index) => {
            let totalMakes = 0;
            let totalAttempts = 0;

            for (let key in stats) {
              if (stats.hasOwnProperty(key)) {
                totalMakes += stats[key].makes || 0; // Accumulate makes, default to 0 if undefined
                totalAttempts += stats[key].attempts || 0; // Accumulate attempts, default to 0 if undefined
              }
            }

            // Calculate shooting percentages
            let shortPercentage =
              totalAttempts > 0
                ? ((totalMakes / totalAttempts) * 100).toFixed(2) + "%"
                : "0.00%";
            let freeThrowPercentage =
              totalAttempts > 0
                ? (100 - parseFloat(shortPercentage)).toFixed(2) + "%"
                : "0.00%";

            return {
              date: weekStartDate
                .clone()
                .add(index, "days")
                .format("YYYY-MM-DD"),
              day: weekStartDate.clone().add(index, "days").format("dddd"),
              makes: totalMakes,
              attempts: totalAttempts,
              short: shortPercentage,
              freeThrow: freeThrowPercentage,
            };
          });

          return res.status(200).json({
            success: true,
            message: "spot data found successfully",
            data: dataForWeek,
          });
        }
        if (duration && duration.toLowerCase() === "month") {
          console.log("short with month");

          const spotShortSelection = [2, 3, 4, 5, 6];

          // Calculate shootingStats for the month
          const monthStartDate = currentDate.clone().startOf("month");
          const monthEndDate = currentDate.clone().endOf("month");

          const daysInMonth = monthEndDate.diff(monthStartDate, "days") + 1;
          const monthPromises = [];

          for (let i = 0; i < daysInMonth; i++) {
            const startDate = monthStartDate.clone().add(i, "days");
            const endDate = monthStartDate.clone().add(i, "days").endOf("day");
            monthPromises.push(
              calculateShootingStats(
                user_id,
                startDate,
                endDate,
                spotShortSelection
              )
            );
          }

          const shootingStatsForMonth = await Promise.all(monthPromises);

          const dataForMonth = shootingStatsForMonth.map((stats, index) => {
            let totalMakes = 0;
            let totalAttempts = 0;

            for (let key in stats) {
              if (stats.hasOwnProperty(key)) {
                totalMakes += stats[key].makes || 0; // Accumulate makes, default to 0 if undefined
                totalAttempts += stats[key].attempts || 0; // Accumulate attempts, default to 0 if undefined
              }
            }

            // Calculate shooting percentages
            let shortPercentage =
              totalAttempts > 0
                ? ((totalMakes / totalAttempts) * 100).toFixed(2) + "%"
                : "0.00%";
            let freeThrowPercentage =
              totalAttempts > 0
                ? (100 - parseFloat(shortPercentage)).toFixed(2) + "%"
                : "0.00%";

            return {
              date: monthStartDate
                .clone()
                .add(index, "days")
                .format("YYYY-MM-DD"),
              day: monthStartDate.clone().add(index, "days").format("dddd"),
              makes: totalMakes,
              attempts: totalAttempts,
              short: shortPercentage,
              freeThrow: freeThrowPercentage,
            };
          });

          return res.status(200).json({
            success: true,
            message: "spot data found successfully",
            data: dataForMonth,
          });
        }
        if (duration && duration.toLowerCase() === "year") {
          console.log("short with year");

          const spotShortSelection = [2, 3, 4, 5, 6];

          // Calculate shootingStats for the year
          const yearStartDate = currentDate.clone().startOf("year");
          const yearEndDate = currentDate.clone().endOf("year");

          const daysInYear = yearEndDate.diff(yearStartDate, "days") + 1;
          const yearPromises = [];

          for (let i = 0; i < daysInYear; i++) {
            const startDate = yearStartDate.clone().add(i, "days");
            const endDate = yearStartDate.clone().add(i, "days").endOf("day");
            yearPromises.push(
              calculateShootingStats(
                user_id,
                startDate,
                endDate,
                spotShortSelection
              )
            );
          }

          const shootingStatsForYear = await Promise.all(yearPromises);

          const dataForYear = shootingStatsForYear.map((stats, index) => {
            let totalMakes = 0;
            let totalAttempts = 0;

            for (let key in stats) {
              if (stats.hasOwnProperty(key)) {
                totalMakes += stats[key].makes || 0; // Accumulate makes, default to 0 if undefined
                totalAttempts += stats[key].attempts || 0; // Accumulate attempts, default to 0 if undefined
              }
            }

            // Calculate shooting percentages
            let shortPercentage =
              totalAttempts > 0
                ? ((totalMakes / totalAttempts) * 100).toFixed(2) + "%"
                : "0.00%";
            let freeThrowPercentage =
              totalAttempts > 0
                ? (100 - parseFloat(shortPercentage)).toFixed(2) + "%"
                : "0.00%";

            return {
              date: yearStartDate
                .clone()
                .add(index, "days")
                .format("YYYY-MM-DD"),
              day: yearStartDate.clone().add(index, "days").format("dddd"),
              makes: totalMakes,
              attempts: totalAttempts,
              short: shortPercentage,
              freeThrow: freeThrowPercentage,
            };
          });

          // Add your logic for 'aroundtherim' with 'month' here
          return res.status(200).json({
            success: true,
            message: "spot data found successfully",
            data: dataForYear,
          });
        }
      } else if (lowercaseSpotFilter === "mid") {
        if (duration && duration.toLowerCase() === "day") {
          console.log("mid with day");

          const spotMidSelection = [7, 8, 9, 10, 11];

          const startDateDay = currentDate.clone().startOf("day");

          const shootingStatsForDayPromise = calculateShootingStats(
            user_id,
            startDateDay,
            currentDate,
            spotMidSelection
          );

          const shootingStatsForDay = await shootingStatsForDayPromise;

          let totalMakes = 0;
          let totalAttempts = 0;

          console.log(shootingStatsForDay, "shootingStatsForDay");

          for (let key in shootingStatsForDay) {
            if (shootingStatsForDay.hasOwnProperty(key)) {
              totalMakes += shootingStatsForDay[key].makes || 0; // Accumulate makes, default to 0 if undefined
              totalAttempts += shootingStatsForDay[key].attempts || 0; // Accumulate attempts, default to 0 if undefined
            }
          }
          let shortPercentage =
            totalAttempts > 0
              ? ((totalMakes / totalAttempts) * 100).toFixed(2) + "%"
              : "0.00%";
          let freeThrowPercentage =
            totalAttempts > 0
              ? (100 - parseFloat(shortPercentage)).toFixed(2) + "%"
              : "0.00%";

          // Constructing the final single object
          const consolidatedStats = {
            date: currentDate.format("YYYY-MM-DD"),
            day: currentDate.format("dddd"),
            makes: totalMakes,
            attempts: totalAttempts,
            short: shortPercentage,
            freethrow: freeThrowPercentage,
          };

          // Adding consolidated stats to shootingStatsByTimeframe.day
          shootingStatsByTimeframe.day.push(consolidatedStats);

          // Add your logic for 'aroundtherim' with 'month' here
          return res.status(200).json({
            success: true,
            message: "spot data found successfully",
            data: shootingStatsByTimeframe.day,
          });
        }
        if (duration && duration.toLowerCase() === "week") {
          console.log("mid with week");

          const spotMidSelection = [7, 8, 9, 10, 11];

          // Calculate shootingStats for the week
          const weekStartDate = currentDate.clone().startOf("week");
          const weekEndDate = currentDate.clone().endOf("week");
          const startDateofWeek = new Date(weekStartDate).getDate();
          const endDateofWeek = new Date(weekEndDate).getDate();
          console.log(startDateofWeek, "startDateofWeek");
          console.log(endDateofWeek, "endDateofWeek");
          console.log(weekEndDate.format("YYYY-MM-DD"));
          const daysInWeek = weekEndDate.diff(weekStartDate, "days") + 1;
          const weekPromises = [];
          for (let i = 0; i < daysInWeek; i++) {
            const startDate = weekStartDate.clone().add(i, "days");
            const endDate = weekStartDate.clone().add(i, "days").endOf("day");
            weekPromises.push(
              calculateShootingStats(
                user_id,
                startDate,
                endDate,
                spotMidSelection
              )
            );
          }

          const shootingStatsForWeek = await Promise.all(weekPromises);

          console.log(shootingStatsForWeek, "shootingStatsForWeek");

          const dataForWeek = shootingStatsForWeek.map((stats, index) => {
            let totalMakes = 0;
            let totalAttempts = 0;

            for (let key in stats) {
              if (stats.hasOwnProperty(key)) {
                totalMakes += stats[key].makes || 0; // Accumulate makes, default to 0 if undefined
                totalAttempts += stats[key].attempts || 0; // Accumulate attempts, default to 0 if undefined
              }
            }

            // Calculate shooting percentages
            let shortPercentage =
              totalAttempts > 0
                ? ((totalMakes / totalAttempts) * 100).toFixed(2) + "%"
                : "0.00%";
            let freeThrowPercentage =
              totalAttempts > 0
                ? (100 - parseFloat(shortPercentage)).toFixed(2) + "%"
                : "0.00%";

            return {
              date: weekStartDate
                .clone()
                .add(index, "days")
                .format("YYYY-MM-DD"),
              day: weekStartDate.clone().add(index, "days").format("dddd"),
              makes: totalMakes,
              attempts: totalAttempts,
              short: shortPercentage,
              freeThrow: freeThrowPercentage,
            };
          });

          return res.status(200).json({
            success: true,
            message: "spot data found successfully",
            data: dataForWeek,
          });
        }
        if (duration && duration.toLowerCase() === "month") {
          console.log("mid with month");

          const spotMidSelection = [7, 8, 9, 10, 11];
          const monthStartDate = currentDate.clone().startOf("month");
          const monthEndDate = currentDate.clone().endOf("month");

          const daysInMonth = monthEndDate.diff(monthStartDate, "days") + 1;
          const monthPromises = [];

          for (let i = 0; i < daysInMonth; i++) {
            const startDate = monthStartDate.clone().add(i, "days");
            const endDate = monthStartDate.clone().add(i, "days").endOf("day");
            monthPromises.push(
              calculateShootingStats(
                user_id,
                startDate,
                endDate,
                spotMidSelection
              )
            );
          }

          const shootingStatsForMonth = await Promise.all(monthPromises);

          const dataForMonth = shootingStatsForMonth.map((stats, index) => {
            let totalMakes = 0;
            let totalAttempts = 0;

            for (let key in stats) {
              if (stats.hasOwnProperty(key)) {
                totalMakes += stats[key].makes || 0; // Accumulate makes, default to 0 if undefined
                totalAttempts += stats[key].attempts || 0; // Accumulate attempts, default to 0 if undefined
              }
            }

            // Calculate shooting percentages
            let shortPercentage =
              totalAttempts > 0
                ? ((totalMakes / totalAttempts) * 100).toFixed(2) + "%"
                : "0.00%";
            let freeThrowPercentage =
              totalAttempts > 0
                ? (100 - parseFloat(shortPercentage)).toFixed(2) + "%"
                : "0.00%";

            return {
              date: monthStartDate
                .clone()
                .add(index, "days")
                .format("YYYY-MM-DD"),
              day: monthStartDate.clone().add(index, "days").format("dddd"),
              makes: totalMakes,
              attempts: totalAttempts,
              short: shortPercentage,
              freeThrow: freeThrowPercentage,
            };
          });

          return res.status(200).json({
            success: true,
            message: "spot data found successfully",
            data: dataForMonth,
          });
        }
        if (duration && duration.toLowerCase() === "year") {
          console.log("mid with year");

          const spotMidSelection = [7, 8, 9, 10, 11];

          // Calculate shootingStats for the year
          const yearStartDate = currentDate.clone().startOf("year");
          const yearEndDate = currentDate.clone().endOf("year");

          const daysInYear = yearEndDate.diff(yearStartDate, "days") + 1;
          const yearPromises = [];

          for (let i = 0; i < daysInYear; i++) {
            const startDate = yearStartDate.clone().add(i, "days");
            const endDate = yearStartDate.clone().add(i, "days").endOf("day");
            yearPromises.push(
              calculateShootingStats(
                user_id,
                startDate,
                endDate,
                spotMidSelection
              )
            );
          }

          const shootingStatsForYear = await Promise.all(yearPromises);

          const dataForYear = shootingStatsForYear.map((stats, index) => {
            let totalMakes = 0;
            let totalAttempts = 0;

            for (let key in stats) {
              if (stats.hasOwnProperty(key)) {
                totalMakes += stats[key].makes || 0; // Accumulate makes, default to 0 if undefined
                totalAttempts += stats[key].attempts || 0; // Accumulate attempts, default to 0 if undefined
              }
            }

            // Calculate shooting percentages
            let shortPercentage =
              totalAttempts > 0
                ? ((totalMakes / totalAttempts) * 100).toFixed(2) + "%"
                : "0.00%";
            let freeThrowPercentage =
              totalAttempts > 0
                ? (100 - parseFloat(shortPercentage)).toFixed(2) + "%"
                : "0.00%";

            return {
              date: yearStartDate
                .clone()
                .add(index, "days")
                .format("YYYY-MM-DD"),
              day: yearStartDate.clone().add(index, "days").format("dddd"),
              makes: totalMakes,
              attempts: totalAttempts,
              short: shortPercentage,
              freeThrow: freeThrowPercentage,
            };
          });

          // Add your logic for 'aroundtherim' with 'month' here
          return res.status(200).json({
            success: true,
            message: "spot data found successfully",
            data: dataForYear,
          });
        }
      } else if (lowercaseSpotFilter === "three") {
        if (duration && duration.toLowerCase() === "day") {
          console.log("three with day");
          const spotThreeSelection = [12, 13, 14, 15, 16];

          const startDateDay = currentDate.clone().startOf("day");

          const shootingStatsForDayPromise = calculateShootingStats(
            user_id,
            startDateDay,
            currentDate,
            spotThreeSelection
          );

          const shootingStatsForDay = await shootingStatsForDayPromise;

          let totalMakes = 0;
          let totalAttempts = 0;

          console.log(shootingStatsForDay, "shootingStatsForDay");

          for (let key in shootingStatsForDay) {
            if (shootingStatsForDay.hasOwnProperty(key)) {
              totalMakes += shootingStatsForDay[key].makes || 0; // Accumulate makes, default to 0 if undefined
              totalAttempts += shootingStatsForDay[key].attempts || 0; // Accumulate attempts, default to 0 if undefined
            }
          }
          let shortPercentage =
            totalAttempts > 0
              ? ((totalMakes / totalAttempts) * 100).toFixed(2) + "%"
              : "0.00%";
          let freeThrowPercentage =
            totalAttempts > 0
              ? (100 - parseFloat(shortPercentage)).toFixed(2) + "%"
              : "0.00%";

          // Constructing the final single object
          const consolidatedStats = {
            date: currentDate.format("YYYY-MM-DD"),
            day: currentDate.format("dddd"),
            makes: totalMakes,
            attempts: totalAttempts,
            short: shortPercentage,
            freethrow: freeThrowPercentage,
          };

          // Adding consolidated stats to shootingStatsByTimeframe.day
          shootingStatsByTimeframe.day.push(consolidatedStats);

          // Add your logic for 'aroundtherim' with 'month' here
          return res.status(200).json({
            success: true,
            message: "spot data found successfully",
            data: shootingStatsByTimeframe.day,
          });
        }
        if (duration && duration.toLowerCase() === "week") {
          console.log("three with week");
          const spotThreeSelection = [12, 13, 14, 15, 16];

          // Calculate shootingStats for the week
          const weekStartDate = currentDate.clone().startOf("week");
          const weekEndDate = currentDate.clone().endOf("week");
          const startDateofWeek = new Date(weekStartDate).getDate();
          const endDateofWeek = new Date(weekEndDate).getDate();
          console.log(startDateofWeek, "startDateofWeek");
          console.log(endDateofWeek, "endDateofWeek");
          console.log(weekEndDate.format("YYYY-MM-DD"));
          const daysInWeek = weekEndDate.diff(weekStartDate, "days") + 1;
          const weekPromises = [];
          for (let i = 0; i < daysInWeek; i++) {
            const startDate = weekStartDate.clone().add(i, "days");
            const endDate = weekStartDate.clone().add(i, "days").endOf("day");
            weekPromises.push(
              calculateShootingStats(
                user_id,
                startDate,
                endDate,
                spotThreeSelection
              )
            );
          }

          const shootingStatsForWeek = await Promise.all(weekPromises);

          console.log(shootingStatsForWeek, "shootingStatsForWeek");

          const dataForWeek = shootingStatsForWeek.map((stats, index) => {
            let totalMakes = 0;
            let totalAttempts = 0;

            for (let key in stats) {
              if (stats.hasOwnProperty(key)) {
                totalMakes += stats[key].makes || 0; // Accumulate makes, default to 0 if undefined
                totalAttempts += stats[key].attempts || 0; // Accumulate attempts, default to 0 if undefined
              }
            }

            // Calculate shooting percentages
            let shortPercentage =
              totalAttempts > 0
                ? ((totalMakes / totalAttempts) * 100).toFixed(2) + "%"
                : "0.00%";
            let freeThrowPercentage =
              totalAttempts > 0
                ? (100 - parseFloat(shortPercentage)).toFixed(2) + "%"
                : "0.00%";

            return {
              date: weekStartDate
                .clone()
                .add(index, "days")
                .format("YYYY-MM-DD"),
              day: weekStartDate.clone().add(index, "days").format("dddd"),
              makes: totalMakes,
              attempts: totalAttempts,
              short: shortPercentage,
              freeThrow: freeThrowPercentage,
            };
          });

          return res.status(200).json({
            success: true,
            message: "spot data found successfully",
            data: dataForWeek,
          });
        }
        if (duration && duration.toLowerCase() === "month") {
          console.log("three with month");
          const spotThreeSelection = [12, 13, 14, 15, 16];

          const monthStartDate = currentDate.clone().startOf("month");
          const monthEndDate = currentDate.clone().endOf("month");

          const daysInMonth = monthEndDate.diff(monthStartDate, "days") + 1;
          const monthPromises = [];

          for (let i = 0; i < daysInMonth; i++) {
            const startDate = monthStartDate.clone().add(i, "days");
            const endDate = monthStartDate.clone().add(i, "days").endOf("day");
            monthPromises.push(
              calculateShootingStats(
                user_id,
                startDate,
                endDate,
                spotThreeSelection
              )
            );
          }

          const shootingStatsForMonth = await Promise.all(monthPromises);

          const dataForMonth = shootingStatsForMonth.map((stats, index) => {
            let totalMakes = 0;
            let totalAttempts = 0;

            for (let key in stats) {
              if (stats.hasOwnProperty(key)) {
                totalMakes += stats[key].makes || 0; // Accumulate makes, default to 0 if undefined
                totalAttempts += stats[key].attempts || 0; // Accumulate attempts, default to 0 if undefined
              }
            }

            // Calculate shooting percentages
            let shortPercentage =
              totalAttempts > 0
                ? ((totalMakes / totalAttempts) * 100).toFixed(2) + "%"
                : "0.00%";
            let freeThrowPercentage =
              totalAttempts > 0
                ? (100 - parseFloat(shortPercentage)).toFixed(2) + "%"
                : "0.00%";

            return {
              date: monthStartDate
                .clone()
                .add(index, "days")
                .format("YYYY-MM-DD"),
              day: monthStartDate.clone().add(index, "days").format("dddd"),
              makes: totalMakes,
              attempts: totalAttempts,
              short: shortPercentage,
              freeThrow: freeThrowPercentage,
            };
          });

          return res.status(200).json({
            success: true,
            message: "spot data found successfully",
            data: dataForMonth,
          });
        }
        if (duration && duration.toLowerCase() === "year") {
          console.log("three with year");
          const spotThreeSelection = [12, 13, 14, 15, 16];

          // Calculate shootingStats for the year
          const yearStartDate = currentDate.clone().startOf("year");
          const yearEndDate = currentDate.clone().endOf("year");

          const daysInYear = yearEndDate.diff(yearStartDate, "days") + 1;
          const yearPromises = [];

          for (let i = 0; i < daysInYear; i++) {
            const startDate = yearStartDate.clone().add(i, "days");
            const endDate = yearStartDate.clone().add(i, "days").endOf("day");
            yearPromises.push(
              calculateShootingStats(
                user_id,
                startDate,
                endDate,
                spotThreeSelection
              )
            );
          }

          const shootingStatsForYear = await Promise.all(yearPromises);

          const dataForYear = shootingStatsForYear.map((stats, index) => {
            let totalMakes = 0;
            let totalAttempts = 0;

            for (let key in stats) {
              if (stats.hasOwnProperty(key)) {
                totalMakes += stats[key].makes || 0; // Accumulate makes, default to 0 if undefined
                totalAttempts += stats[key].attempts || 0; // Accumulate attempts, default to 0 if undefined
              }
            }

            // Calculate shooting percentages
            let shortPercentage =
              totalAttempts > 0
                ? ((totalMakes / totalAttempts) * 100).toFixed(2) + "%"
                : "0.00%";
            let freeThrowPercentage =
              totalAttempts > 0
                ? (100 - parseFloat(shortPercentage)).toFixed(2) + "%"
                : "0.00%";

            return {
              date: yearStartDate
                .clone()
                .add(index, "days")
                .format("YYYY-MM-DD"),
              day: yearStartDate.clone().add(index, "days").format("dddd"),
              makes: totalMakes,
              attempts: totalAttempts,
              short: shortPercentage,
              freeThrow: freeThrowPercentage,
            };
          });

          // Add your logic for 'aroundtherim' with 'month' here
          return res.status(200).json({
            success: true,
            message: "spot data found successfully",
            data: dataForYear,
          });
        }
      } else if (lowercaseSpotFilter === "right") {
        if (duration && duration.toLowerCase() === "day") {
          console.log("right with day");
          const spotRightSelection = [5, 6, 10, 11, 15, 16];

          const startDateDay = currentDate.clone().startOf("day");

          const shootingStatsForDayPromise = calculateShootingStats(
            user_id,
            startDateDay,
            currentDate,
            spotRightSelection
          );

          const shootingStatsForDay = await shootingStatsForDayPromise;

          let totalMakes = 0;
          let totalAttempts = 0;

          console.log(shootingStatsForDay, "shootingStatsForDay");

          for (let key in shootingStatsForDay) {
            if (shootingStatsForDay.hasOwnProperty(key)) {
              totalMakes += shootingStatsForDay[key].makes || 0; // Accumulate makes, default to 0 if undefined
              totalAttempts += shootingStatsForDay[key].attempts || 0; // Accumulate attempts, default to 0 if undefined
            }
          }
          let shortPercentage =
            totalAttempts > 0
              ? ((totalMakes / totalAttempts) * 100).toFixed(2) + "%"
              : "0.00%";
          let freeThrowPercentage =
            totalAttempts > 0
              ? (100 - parseFloat(shortPercentage)).toFixed(2) + "%"
              : "0.00%";

          // Constructing the final single object
          const consolidatedStats = {
            date: currentDate.format("YYYY-MM-DD"),
            day: currentDate.format("dddd"),
            makes: totalMakes,
            attempts: totalAttempts,
            short: shortPercentage,
            freethrow: freeThrowPercentage,
          };

          // Adding consolidated stats to shootingStatsByTimeframe.day
          shootingStatsByTimeframe.day.push(consolidatedStats);

          // Add your logic for 'aroundtherim' with 'month' here
          return res.status(200).json({
            success: true,
            message: "spot data found successfully",
            data: shootingStatsByTimeframe.day,
          });
        }
        if (duration && duration.toLowerCase() === "week") {
          console.log("right with week");
          const spotRightSelection = [5, 6, 10, 11, 15, 16];

          // Calculate shootingStats for the week
          const weekStartDate = currentDate.clone().startOf("week");
          const weekEndDate = currentDate.clone().endOf("week");
          const startDateofWeek = new Date(weekStartDate).getDate();
          const endDateofWeek = new Date(weekEndDate).getDate();
          console.log(startDateofWeek, "startDateofWeek");
          console.log(endDateofWeek, "endDateofWeek");
          console.log(weekEndDate.format("YYYY-MM-DD"));
          const daysInWeek = weekEndDate.diff(weekStartDate, "days") + 1;
          const weekPromises = [];
          for (let i = 0; i < daysInWeek; i++) {
            const startDate = weekStartDate.clone().add(i, "days");
            const endDate = weekStartDate.clone().add(i, "days").endOf("day");
            weekPromises.push(
              calculateShootingStats(
                user_id,
                startDate,
                endDate,
                spotRightSelection
              )
            );
          }

          const shootingStatsForWeek = await Promise.all(weekPromises);

          console.log(shootingStatsForWeek, "shootingStatsForWeek");

          const dataForWeek = shootingStatsForWeek.map((stats, index) => {
            let totalMakes = 0;
            let totalAttempts = 0;

            for (let key in stats) {
              if (stats.hasOwnProperty(key)) {
                totalMakes += stats[key].makes || 0; // Accumulate makes, default to 0 if undefined
                totalAttempts += stats[key].attempts || 0; // Accumulate attempts, default to 0 if undefined
              }
            }

            // Calculate shooting percentages
            let shortPercentage =
              totalAttempts > 0
                ? ((totalMakes / totalAttempts) * 100).toFixed(2) + "%"
                : "0.00%";
            let freeThrowPercentage =
              totalAttempts > 0
                ? (100 - parseFloat(shortPercentage)).toFixed(2) + "%"
                : "0.00%";

            return {
              date: weekStartDate
                .clone()
                .add(index, "days")
                .format("YYYY-MM-DD"),
              day: weekStartDate.clone().add(index, "days").format("dddd"),
              makes: totalMakes,
              attempts: totalAttempts,
              short: shortPercentage,
              freeThrow: freeThrowPercentage,
            };
          });

          return res.status(200).json({
            success: true,
            message: "spot data found successfully",
            data: dataForWeek,
          });
        }
        if (duration && duration.toLowerCase() === "month") {
          console.log("right with month");
          const spotRightSelection = [5, 6, 10, 11, 15, 16];

          const monthStartDate = currentDate.clone().startOf("month");
          const monthEndDate = currentDate.clone().endOf("month");

          const daysInMonth = monthEndDate.diff(monthStartDate, "days") + 1;
          const monthPromises = [];

          for (let i = 0; i < daysInMonth; i++) {
            const startDate = monthStartDate.clone().add(i, "days");
            const endDate = monthStartDate.clone().add(i, "days").endOf("day");
            monthPromises.push(
              calculateShootingStats(
                user_id,
                startDate,
                endDate,
                spotRightSelection
              )
            );
          }

          const shootingStatsForMonth = await Promise.all(monthPromises);

          const dataForMonth = shootingStatsForMonth.map((stats, index) => {
            let totalMakes = 0;
            let totalAttempts = 0;

            for (let key in stats) {
              if (stats.hasOwnProperty(key)) {
                totalMakes += stats[key].makes || 0; // Accumulate makes, default to 0 if undefined
                totalAttempts += stats[key].attempts || 0; // Accumulate attempts, default to 0 if undefined
              }
            }

            // Calculate shooting percentages
            let shortPercentage =
              totalAttempts > 0
                ? ((totalMakes / totalAttempts) * 100).toFixed(2) + "%"
                : "0.00%";
            let freeThrowPercentage =
              totalAttempts > 0
                ? (100 - parseFloat(shortPercentage)).toFixed(2) + "%"
                : "0.00%";

            return {
              date: monthStartDate
                .clone()
                .add(index, "days")
                .format("YYYY-MM-DD"),
              day: monthStartDate.clone().add(index, "days").format("dddd"),
              makes: totalMakes,
              attempts: totalAttempts,
              short: shortPercentage,
              freeThrow: freeThrowPercentage,
            };
          });

          return res.status(200).json({
            success: true,
            message: "spot data found successfully",
            data: dataForMonth,
          });
        }
        if (duration && duration.toLowerCase() === "year") {
          console.log("right with year");
          const spotRightSelection = [5, 6, 10, 11, 15, 16];

          // Calculate shootingStats for the year
          const yearStartDate = currentDate.clone().startOf("year");
          const yearEndDate = currentDate.clone().endOf("year");

          const daysInYear = yearEndDate.diff(yearStartDate, "days") + 1;
          const yearPromises = [];

          for (let i = 0; i < daysInYear; i++) {
            const startDate = yearStartDate.clone().add(i, "days");
            const endDate = yearStartDate.clone().add(i, "days").endOf("day");
            yearPromises.push(
              calculateShootingStats(
                user_id,
                startDate,
                endDate,
                spotRightSelection
              )
            );
          }

          const shootingStatsForYear = await Promise.all(yearPromises);

          const dataForYear = shootingStatsForYear.map((stats, index) => {
            let totalMakes = 0;
            let totalAttempts = 0;

            for (let key in stats) {
              if (stats.hasOwnProperty(key)) {
                totalMakes += stats[key].makes || 0; // Accumulate makes, default to 0 if undefined
                totalAttempts += stats[key].attempts || 0; // Accumulate attempts, default to 0 if undefined
              }
            }

            // Calculate shooting percentages
            let shortPercentage =
              totalAttempts > 0
                ? ((totalMakes / totalAttempts) * 100).toFixed(2) + "%"
                : "0.00%";
            let freeThrowPercentage =
              totalAttempts > 0
                ? (100 - parseFloat(shortPercentage)).toFixed(2) + "%"
                : "0.00%";

            return {
              date: yearStartDate
                .clone()
                .add(index, "days")
                .format("YYYY-MM-DD"),
              day: yearStartDate.clone().add(index, "days").format("dddd"),
              makes: totalMakes,
              attempts: totalAttempts,
              short: shortPercentage,
              freeThrow: freeThrowPercentage,
            };
          });

          // Add your logic for 'aroundtherim' with 'month' here
          return res.status(200).json({
            success: true,
            message: "spot data found successfully",
            data: dataForYear,
          });
        }
      } else if (lowercaseSpotFilter === "left") {
        if (duration && duration.toLowerCase() === "day") {
          console.log("left with day");
          const spotLeftSelection = [2, 3, 7, 8, 12, 13];

          const startDateDay = currentDate.clone().startOf("day");

          const shootingStatsForDayPromise = calculateShootingStats(
            user_id,
            startDateDay,
            currentDate,
            spotLeftSelection
          );

          const shootingStatsForDay = await shootingStatsForDayPromise;

          let totalMakes = 0;
          let totalAttempts = 0;

          console.log(shootingStatsForDay, "shootingStatsForDay");

          for (let key in shootingStatsForDay) {
            if (shootingStatsForDay.hasOwnProperty(key)) {
              totalMakes += shootingStatsForDay[key].makes || 0; // Accumulate makes, default to 0 if undefined
              totalAttempts += shootingStatsForDay[key].attempts || 0; // Accumulate attempts, default to 0 if undefined
            }
          }
          let shortPercentage =
            totalAttempts > 0
              ? ((totalMakes / totalAttempts) * 100).toFixed(2) + "%"
              : "0.00%";
          let freeThrowPercentage =
            totalAttempts > 0
              ? (100 - parseFloat(shortPercentage)).toFixed(2) + "%"
              : "0.00%";

          // Constructing the final single object
          const consolidatedStats = {
            date: currentDate.format("YYYY-MM-DD"),
            day: currentDate.format("dddd"),
            makes: totalMakes,
            attempts: totalAttempts,
            short: shortPercentage,
            freethrow: freeThrowPercentage,
          };

          // Adding consolidated stats to shootingStatsByTimeframe.day
          shootingStatsByTimeframe.day.push(consolidatedStats);

          // Add your logic for 'aroundtherim' with 'month' here
          return res.status(200).json({
            success: true,
            message: "spot data found successfully",
            data: shootingStatsByTimeframe.day,
          });
        }
        if (duration && duration.toLowerCase() === "week") {
          console.log("left with week");

          const spotLeftSelection = [2, 3, 7, 8, 12, 13];

          // Calculate shootingStats for the week
          const weekStartDate = currentDate.clone().startOf("week");
          const weekEndDate = currentDate.clone().endOf("week");
          const startDateofWeek = new Date(weekStartDate).getDate();
          const endDateofWeek = new Date(weekEndDate).getDate();
          console.log(startDateofWeek, "startDateofWeek");
          console.log(endDateofWeek, "endDateofWeek");
          console.log(weekEndDate.format("YYYY-MM-DD"));
          const daysInWeek = weekEndDate.diff(weekStartDate, "days") + 1;
          const weekPromises = [];
          for (let i = 0; i < daysInWeek; i++) {
            const startDate = weekStartDate.clone().add(i, "days");
            const endDate = weekStartDate.clone().add(i, "days").endOf("day");
            weekPromises.push(
              calculateShootingStats(
                user_id,
                startDate,
                endDate,
                spotLeftSelection
              )
            );
          }

          const shootingStatsForWeek = await Promise.all(weekPromises);

          console.log(shootingStatsForWeek, "shootingStatsForWeek");

          const dataForWeek = shootingStatsForWeek.map((stats, index) => {
            let totalMakes = 0;
            let totalAttempts = 0;

            for (let key in stats) {
              if (stats.hasOwnProperty(key)) {
                totalMakes += stats[key].makes || 0; // Accumulate makes, default to 0 if undefined
                totalAttempts += stats[key].attempts || 0; // Accumulate attempts, default to 0 if undefined
              }
            }

            // Calculate shooting percentages
            let shortPercentage =
              totalAttempts > 0
                ? ((totalMakes / totalAttempts) * 100).toFixed(2) + "%"
                : "0.00%";
            let freeThrowPercentage =
              totalAttempts > 0
                ? (100 - parseFloat(shortPercentage)).toFixed(2) + "%"
                : "0.00%";

            return {
              date: weekStartDate
                .clone()
                .add(index, "days")
                .format("YYYY-MM-DD"),
              day: weekStartDate.clone().add(index, "days").format("dddd"),
              makes: totalMakes,
              attempts: totalAttempts,
              short: shortPercentage,
              freeThrow: freeThrowPercentage,
            };
          });

          return res.status(200).json({
            success: true,
            message: "spot data found successfully",
            data: dataForWeek,
          });
        }
        if (duration && duration.toLowerCase() === "month") {
          console.log("left with month");

          const spotLeftSelection = [2, 3, 7, 8, 12, 13];

          const monthStartDate = currentDate.clone().startOf("month");
          const monthEndDate = currentDate.clone().endOf("month");

          const daysInMonth = monthEndDate.diff(monthStartDate, "days") + 1;
          const monthPromises = [];

          for (let i = 0; i < daysInMonth; i++) {
            const startDate = monthStartDate.clone().add(i, "days");
            const endDate = monthStartDate.clone().add(i, "days").endOf("day");
            monthPromises.push(
              calculateShootingStats(
                user_id,
                startDate,
                endDate,
                spotLeftSelection
              )
            );
          }

          const shootingStatsForMonth = await Promise.all(monthPromises);

          const dataForMonth = shootingStatsForMonth.map((stats, index) => {
            let totalMakes = 0;
            let totalAttempts = 0;

            for (let key in stats) {
              if (stats.hasOwnProperty(key)) {
                totalMakes += stats[key].makes || 0; // Accumulate makes, default to 0 if undefined
                totalAttempts += stats[key].attempts || 0; // Accumulate attempts, default to 0 if undefined
              }
            }

            // Calculate shooting percentages
            let shortPercentage =
              totalAttempts > 0
                ? ((totalMakes / totalAttempts) * 100).toFixed(2) + "%"
                : "0.00%";
            let freeThrowPercentage =
              totalAttempts > 0
                ? (100 - parseFloat(shortPercentage)).toFixed(2) + "%"
                : "0.00%";

            return {
              date: monthStartDate
                .clone()
                .add(index, "days")
                .format("YYYY-MM-DD"),
              day: monthStartDate.clone().add(index, "days").format("dddd"),
              makes: totalMakes,
              attempts: totalAttempts,
              short: shortPercentage,
              freeThrow: freeThrowPercentage,
            };
          });

          return res.status(200).json({
            success: true,
            message: "spot data found successfully",
            data: dataForMonth,
          });
        }
        if (duration && duration.toLowerCase() === "year") {
          console.log("left with year");

          const spotLeftSelection = [2, 3, 7, 8, 12, 13];

          // Calculate shootingStats for the year
          const yearStartDate = currentDate.clone().startOf("year");
          const yearEndDate = currentDate.clone().endOf("year");

          const daysInYear = yearEndDate.diff(yearStartDate, "days") + 1;
          const yearPromises = [];

          for (let i = 0; i < daysInYear; i++) {
            const startDate = yearStartDate.clone().add(i, "days");
            const endDate = yearStartDate.clone().add(i, "days").endOf("day");
            yearPromises.push(
              calculateShootingStats(
                user_id,
                startDate,
                endDate,
                spotLeftSelection
              )
            );
          }

          const shootingStatsForYear = await Promise.all(yearPromises);

          const dataForYear = shootingStatsForYear.map((stats, index) => {
            let totalMakes = 0;
            let totalAttempts = 0;

            for (let key in stats) {
              if (stats.hasOwnProperty(key)) {
                totalMakes += stats[key].makes || 0; // Accumulate makes, default to 0 if undefined
                totalAttempts += stats[key].attempts || 0; // Accumulate attempts, default to 0 if undefined
              }
            }

            // Calculate shooting percentages
            let shortPercentage =
              totalAttempts > 0
                ? ((totalMakes / totalAttempts) * 100).toFixed(2) + "%"
                : "0.00%";
            let freeThrowPercentage =
              totalAttempts > 0
                ? (100 - parseFloat(shortPercentage)).toFixed(2) + "%"
                : "0.00%";

            return {
              date: yearStartDate
                .clone()
                .add(index, "days")
                .format("YYYY-MM-DD"),
              day: yearStartDate.clone().add(index, "days").format("dddd"),
              makes: totalMakes,
              attempts: totalAttempts,
              short: shortPercentage,
              freeThrow: freeThrowPercentage,
            };
          });

          // Add your logic for 'aroundtherim' with 'month' here
          return res.status(200).json({
            success: true,
            message: "spot data found successfully",
            data: dataForYear,
          });
        }
      } else if (lowercaseSpotFilter === "center") {
        if (duration && duration.toLowerCase() === "day") {
          console.log("center with day");
          const spotCenterSelection = [1, 4, 9, 14];

          const startDateDay = currentDate.clone().startOf("day");

          const shootingStatsForDayPromise = calculateShootingStats(
            user_id,
            startDateDay,
            currentDate,
            spotCenterSelection
          );

          const shootingStatsForDay = await shootingStatsForDayPromise;

          let totalMakes = 0;
          let totalAttempts = 0;

          console.log(shootingStatsForDay, "shootingStatsForDay");

          for (let key in shootingStatsForDay) {
            if (shootingStatsForDay.hasOwnProperty(key)) {
              totalMakes += shootingStatsForDay[key].makes || 0; // Accumulate makes, default to 0 if undefined
              totalAttempts += shootingStatsForDay[key].attempts || 0; // Accumulate attempts, default to 0 if undefined
            }
          }
          let shortPercentage =
            totalAttempts > 0
              ? ((totalMakes / totalAttempts) * 100).toFixed(2) + "%"
              : "0.00%";
          let freeThrowPercentage =
            totalAttempts > 0
              ? (100 - parseFloat(shortPercentage)).toFixed(2) + "%"
              : "0.00%";

          // Constructing the final single object
          const consolidatedStats = {
            date: currentDate.format("YYYY-MM-DD"),
            day: currentDate.format("dddd"),
            makes: totalMakes,
            attempts: totalAttempts,
            short: shortPercentage,
            freethrow: freeThrowPercentage,
          };

          // Adding consolidated stats to shootingStatsByTimeframe.day
          shootingStatsByTimeframe.day.push(consolidatedStats);

          // Add your logic for 'aroundtherim' with 'month' here
          return res.status(200).json({
            success: true,
            message: "spot data found successfully",
            data: shootingStatsByTimeframe.day,
          });
        }
        if (duration && duration.toLowerCase() === "week") {
          console.log("center with week");
          const spotCenterSelection = [1, 4, 9, 14];
          // Calculate shootingStats for the week
          const weekStartDate = currentDate.clone().startOf("week");
          const weekEndDate = currentDate.clone().endOf("week");
          const startDateofWeek = new Date(weekStartDate).getDate();
          const endDateofWeek = new Date(weekEndDate).getDate();
          console.log(startDateofWeek, "startDateofWeek");
          console.log(endDateofWeek, "endDateofWeek");
          console.log(weekEndDate.format("YYYY-MM-DD"));
          const daysInWeek = weekEndDate.diff(weekStartDate, "days") + 1;
          const weekPromises = [];
          for (let i = 0; i < daysInWeek; i++) {
            const startDate = weekStartDate.clone().add(i, "days");
            const endDate = weekStartDate.clone().add(i, "days").endOf("day");
            weekPromises.push(
              calculateShootingStats(
                user_id,
                startDate,
                endDate,
                spotCenterSelection
              )
            );
          }

          const shootingStatsForWeek = await Promise.all(weekPromises);

          console.log(shootingStatsForWeek, "shootingStatsForWeek");

          const dataForWeek = shootingStatsForWeek.map((stats, index) => {
            let totalMakes = 0;
            let totalAttempts = 0;

            for (let key in stats) {
              if (stats.hasOwnProperty(key)) {
                totalMakes += stats[key].makes || 0; // Accumulate makes, default to 0 if undefined
                totalAttempts += stats[key].attempts || 0; // Accumulate attempts, default to 0 if undefined
              }
            }

            // Calculate shooting percentages
            let shortPercentage =
              totalAttempts > 0
                ? ((totalMakes / totalAttempts) * 100).toFixed(2) + "%"
                : "0.00%";
            let freeThrowPercentage =
              totalAttempts > 0
                ? (100 - parseFloat(shortPercentage)).toFixed(2) + "%"
                : "0.00%";

            return {
              date: weekStartDate
                .clone()
                .add(index, "days")
                .format("YYYY-MM-DD"),
              day: weekStartDate.clone().add(index, "days").format("dddd"),
              makes: totalMakes,
              attempts: totalAttempts,
              short: shortPercentage,
              freeThrow: freeThrowPercentage,
            };
          });

          return res.status(200).json({
            success: true,
            message: "spot data found successfully",
            data: dataForWeek,
          });
        }
        if (duration && duration.toLowerCase() === "month") {
          console.log("center with month");
          const spotCenterSelection = [1, 4, 9, 14];

          const monthStartDate = currentDate.clone().startOf("month");
          const monthEndDate = currentDate.clone().endOf("month");

          const daysInMonth = monthEndDate.diff(monthStartDate, "days") + 1;
          const monthPromises = [];

          for (let i = 0; i < daysInMonth; i++) {
            const startDate = monthStartDate.clone().add(i, "days");
            const endDate = monthStartDate.clone().add(i, "days").endOf("day");
            monthPromises.push(
              calculateShootingStats(
                user_id,
                startDate,
                endDate,
                spotCenterSelection
              )
            );
          }

          const shootingStatsForMonth = await Promise.all(monthPromises);

          const dataForMonth = shootingStatsForMonth.map((stats, index) => {
            let totalMakes = 0;
            let totalAttempts = 0;

            for (let key in stats) {
              if (stats.hasOwnProperty(key)) {
                totalMakes += stats[key].makes || 0; // Accumulate makes, default to 0 if undefined
                totalAttempts += stats[key].attempts || 0; // Accumulate attempts, default to 0 if undefined
              }
            }

            // Calculate shooting percentages
            let shortPercentage =
              totalAttempts > 0
                ? ((totalMakes / totalAttempts) * 100).toFixed(2) + "%"
                : "0.00%";
            let freeThrowPercentage =
              totalAttempts > 0
                ? (100 - parseFloat(shortPercentage)).toFixed(2) + "%"
                : "0.00%";

            return {
              date: monthStartDate
                .clone()
                .add(index, "days")
                .format("YYYY-MM-DD"),
              day: monthStartDate.clone().add(index, "days").format("dddd"),
              makes: totalMakes,
              attempts: totalAttempts,
              short: shortPercentage,
              freeThrow: freeThrowPercentage,
            };
          });

          return res.status(200).json({
            success: true,
            message: "spot data found successfully",
            data: dataForMonth,
          });
        }
        if (duration && duration.toLowerCase() === "year") {
          console.log("center with year");
          const spotCenterSelection = [1, 4, 9, 14];

          // Calculate shootingStats for the year
          const yearStartDate = currentDate.clone().startOf("year");
          const yearEndDate = currentDate.clone().endOf("year");

          const daysInYear = yearEndDate.diff(yearStartDate, "days") + 1;
          const yearPromises = [];

          for (let i = 0; i < daysInYear; i++) {
            const startDate = yearStartDate.clone().add(i, "days");
            const endDate = yearStartDate.clone().add(i, "days").endOf("day");
            yearPromises.push(
              calculateShootingStats(
                user_id,
                startDate,
                endDate,
                spotCenterSelection
              )
            );
          }

          const shootingStatsForYear = await Promise.all(yearPromises);

          const dataForYear = shootingStatsForYear.map((stats, index) => {
            let totalMakes = 0;
            let totalAttempts = 0;

            for (let key in stats) {
              if (stats.hasOwnProperty(key)) {
                totalMakes += stats[key].makes || 0; // Accumulate makes, default to 0 if undefined
                totalAttempts += stats[key].attempts || 0; // Accumulate attempts, default to 0 if undefined
              }
            }

            // Calculate shooting percentages
            let shortPercentage =
              totalAttempts > 0
                ? ((totalMakes / totalAttempts) * 100).toFixed(2) + "%"
                : "0.00%";
            let freeThrowPercentage =
              totalAttempts > 0
                ? (100 - parseFloat(shortPercentage)).toFixed(2) + "%"
                : "0.00%";

            return {
              date: yearStartDate
                .clone()
                .add(index, "days")
                .format("YYYY-MM-DD"),
              day: yearStartDate.clone().add(index, "days").format("dddd"),
              makes: totalMakes,
              attempts: totalAttempts,
              short: shortPercentage,
              freeThrow: freeThrowPercentage,
            };
          });

          // Add your logic for 'aroundtherim' with 'month' here
          return res.status(200).json({
            success: true,
            message: "spot data found successfully",
            data: dataForYear,
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          message: "Invalid dropdown value",
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "Dropdown data not provided",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//get all total shots

export const getALLSessionStats = async (req, res) => {
  try {
    const { user_id } = req.user;

    const user = await authModel.findOne({ _id: user_id });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    const totalShotsHistory = await shootingHistoryModel
      .find({
        authId: user_id,
      })
      .populate("spotId");

    return res.status(200).json({
      success: true,
      message: "shots history found successfully",
      data: totalShotsHistory,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteHistoryById = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { historyId } = req.params;
    const user = await authModel.findOne({ _id: user_id });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    const findHistory = await shootingHistoryModel.findById(historyId);

    if (!findHistory) {
      return res.status(400).json({
        success: false,
        message: "History not found",
      });
    }

    const deleteHistory = await shootingHistoryModel.findByIdAndDelete(
      historyId
    );

    if (!deleteHistory) {
      return res.status(400).json({
        success: false,
        message: "History not delete",
      });
    }

    if (deleteHistory.spotId && deleteHistory.penaltyId) {
      await shootingGameModel.findByIdAndDelete(deleteHistory.spotId);
      await shootingGameModel.findByIdAndDelete(deleteHistory.penaltyId);
      await activityModel.findOneAndDelete({
        shootingId: deleteHistory.spotId,
      });
      await activityModel.findOneAndDelete({
        shootingId: deleteHistory.penaltyId,
      });
    } else {
      if (deleteHistory.spotId) {
        await shootingGameModel.findByIdAndDelete(deleteHistory.spotId);
        await activityModel.findOneAndDelete({
          shootingId: deleteHistory.spotId,
        });
      }

      if (deleteHistory.penaltyId) {
        await shootingGameModel.findByIdAndDelete(deleteHistory.penaltyId);
        await activityModel.findOneAndDelete({
          shootingId: deleteHistory.penaltyId,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "history delete successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteAllHistory = async (req, res) => {
  try {
    const { user_id } = req.user;
    const user = await authModel.findOne({ _id: user_id });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    await shootingHistoryModel.deleteMany({ authId: user_id });
    await shootingGameModel.deleteMany({ authId: user_id });
    await activityModel.deleteMany({ createdBy: user_id });

    return res.status(200).json({
      success: true,
      message: "all history delete successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
