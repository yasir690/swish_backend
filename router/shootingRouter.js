import express from "express";
import * as shootingController from "../controller/shootingController.js";
export const shootingRouter = express.Router();

import auth from "../middleware/auth.js";
import limiter from "../middleware/throttleservice.js";

//play shooting game router
shootingRouter.post("/playshooting", auth, shootingController.playShootingGame);

//spot graph router
shootingRouter.get(
  "/showdatainspotgraph",
  limiter,
  auth,
  shootingController.showDataInSpotGraph
);

//date graph router
shootingRouter.get(
  "/shootingdataingraph",
  limiter,
  auth,
  shootingController.showDataInGraph
);

shootingRouter.get(
  "/showDataInDropDownSpotBase",
  limiter,
  auth,
  shootingController.showDataInDropDownSpotBase
);

shootingRouter.get(
  "/getALLSessionStats",
  limiter,
  auth,
  shootingController.getALLSessionStats
);

shootingRouter.delete(
  "/deleteHistory/:historyId",
  limiter,
  auth,
  shootingController.deleteHistoryById
);

shootingRouter.delete(
  "/deleteAllHistory",
  limiter,
  auth,
  shootingController.deleteAllHistory
);
