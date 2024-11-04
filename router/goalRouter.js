import express from "express";
import * as goalController from "../controller/goalController.js";
export const goalRouter = express.Router();

import auth from "../middleware/auth.js";
import limiter from "../middleware/throttleservice.js";

//create goal router
goalRouter.post("/createGoal", limiter, auth, goalController.createGoals);

//get all shooting stats

goalRouter.get(
  "/getAllShootingStats",
  limiter,
  auth,
  goalController.getAllShootingStats
);

//get analytics router
goalRouter.get("/getAnalytics", limiter, auth, goalController.getAnalytics);

//update goals router
goalRouter.put("/updateGoals/:id", limiter, auth, goalController.updateGoals);

//get data by date router
goalRouter.get("/getgoalsbydate", limiter, auth, goalController.getdatabydate);
