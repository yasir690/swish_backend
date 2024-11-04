import * as adminController from "../controller/adminController.js";
import express from "express";
export const adminRouter = express();
import auth from "../middleware/auth.js";
import limiter from "../middleware/throttleservice.js";

//upload library video router
adminRouter.post(
  "/uploadLibraryVideo",
  limiter,
  auth,
  adminController.uploadLibraryVideos
);

//delete library video router

adminRouter.delete(
  "/deleteLibraryVideo/:id",
  limiter,
  auth,
  adminController.deleteLibraryVideos
);

//get library video router

adminRouter.get(
  "/getLibraryVideo",
  limiter,
  auth,
  adminController.getLibraryVideo
);

//get users router

adminRouter.get("/getAllUser", limiter, auth, adminController.getAllUser);

//get delete user router
adminRouter.delete(
  "/deleteUser/:id",
  limiter,
  auth,
  adminController.deleteUser
);

//get single user router
adminRouter.get("/getUserById/:id", limiter, auth, adminController.getUserById);

//get user analytics router
adminRouter.get(
  "/allUserAnalytics",
  limiter,
  auth,
  adminController.getUsersAnalytics
);

//get single user analytics router
adminRouter.get(
  "/singleUserAnalytics/:id",
  limiter,
  auth,
  adminController.getSingleUserAnalytics
);

//upload guide router
adminRouter.post("/uploadGuide", limiter, auth, adminController.uploadGuide);

//get guide router
adminRouter.get("/getGuide", limiter, auth, adminController.getGuide);

//update guide router
adminRouter.put("/updateGuide/:id", limiter, auth, adminController.updateGuide);

//payment history router
// adminRouter.get(
//   "/paymentHistory",
//   limiter,
//   auth,
//   adminController.paymentHistory
// );

//get all payment router
adminRouter.get("/getAllPayment", limiter, auth, adminController.getAllPayment);

//get single payment router
// adminRouter.get(
//   "/getPayment/:paymentId",
//   limiter,
//   auth,
//   adminController.getPaymentById
// );

//user disabled router
adminRouter.get(
  "/userDisabled/:userId",
  limiter,
  auth,
  adminController.userDisabled
);

//get android and ios user router
adminRouter.get(
  "/getAndroidIosUser",
  limiter,
  auth,
  adminController.getAndroidAndIosUser
);

//token valid router
adminRouter.get("/tokenValid", limiter, auth, adminController.tokenValid);

//create privacy router
adminRouter.post(
  "/createPrivacy",
  limiter,
  auth,
  adminController.createPrivacy
);

//get privacy router

adminRouter.get("/getPrivacy", limiter, auth, adminController.getPrivacy);

//update privacy router

adminRouter.put(
  "/updatePrivacy/:id",
  limiter,
  auth,
  adminController.updatePrivacy
);

//delete privacy router

adminRouter.delete(
  "/deletePrivacy/:id",
  limiter,
  auth,
  adminController.deletePrivacy
);

//send notification router

adminRouter.post(
  "/SendNotification",
  limiter,
  auth,
  adminController.SendNotification
);

//count user router
adminRouter.get("/countUser", limiter, auth, adminController.countUser);

//get user feed back router
adminRouter.get(
  "/getUserFeedBack",
  limiter,
  auth,
  adminController.getUserFeedBack
);

adminRouter.post(
  "/changePassword",
  limiter,
  auth,
  adminController.changePassword
);
