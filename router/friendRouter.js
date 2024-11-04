import { Router } from "express";

import auth from "../middleware/auth.js";

import * as friendsController from "../controller/friendController.js";
import limiter from "../middleware/throttleservice.js";

export const friendsRouter = Router();

friendsRouter.post(
  "/addFriendRequest",
  limiter,
  auth,
  friendsController.addFriendRequest
);

friendsRouter.post(
  "/RequestAcceptOrReject",
  limiter,
  auth,
  friendsController.RequestAcceptOrReject
);

friendsRouter.get(
  "/getAllFriends",
  limiter,
  auth,
  friendsController.getAllFriends
);

friendsRouter.get(
  "/getUserBySearchName",
  limiter,
  auth,
  friendsController.getUserBySearchName
);

friendsRouter.get(
  "/getStatsOfFriend/:friendId",
  limiter,
  auth,
  friendsController.getStatsOfFriend
);

friendsRouter.get(
  "/getStatsOfFriend/:Id",
  limiter,
  auth,
  friendsController.getStatsOfFriend
);

friendsRouter.get(
  "/getAllPendingRequest",
  limiter,
  auth,
  friendsController.getAllPendingRequest
);
