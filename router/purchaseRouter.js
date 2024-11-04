import express from "express";

import * as purchaseController from "../controller/purchaseController.js";

export const purchaseRouter = express.Router();
import auth from "../middleware/auth.js";
import limiter from "../middleware/throttleservice.js";

//get purchase by user id
purchaseRouter.get(
  "/getPurchaseByUser",
  limiter,
  auth,

  purchaseController.getPurchaseByUser
);

//upgrade subscription
purchaseRouter.put(
  "/upgradePurchase/:subscriptionId",
  auth,
  limiter,
  purchaseController.upgradeSubscription
);
