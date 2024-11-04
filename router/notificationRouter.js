import express from "express";
import * as notificationController from "../controller/NotificationController.js";
export const notificationRouter = express.Router();
import auth from "../middleware/auth.js";
import limiter from "../middleware/throttleservice.js";

//get all notification router
notificationRouter.get(
  "/getAllNotification",
  limiter,
  auth,
  notificationController.getAllNotification
);

//read notification router
notificationRouter.put(
  "/readNotification/:id",
  limiter,
  auth,
  notificationController.readNotification
);

//notification on and off router
notificationRouter.put(
  "/notificationOnAndOff",
  limiter,
  auth,
  notificationController.notificationOnAndOff
);
