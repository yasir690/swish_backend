import express from "express";
import * as userController from "../controller/authController.js";
export const authRouter = express.Router();
import auth from "../middleware/auth.js";
import limiter from "../middleware/throttleservice.js";

//register router
authRouter.post("/userRegister", limiter, userController.userRegister);

//login router

authRouter.post("/userLogin", limiter, userController.userLogin);

//parent response router
authRouter.get("/parentResponse", limiter, auth, userController.parentResponse);

//update profile router

authRouter.put("/updateProfile", limiter, auth, userController.updateProfile);

//forget password router
authRouter.post("/forgetPassword", limiter, userController.forgetPassword);

//verify otp router
authRouter.post("/verifyOtp", limiter, userController.verifyOtp);

//reset password router
authRouter.post("/resetPassword", limiter, auth, userController.resetPassword);

//change password router
authRouter.put("/changePassword", limiter, auth, userController.changePassword);

//invitation child router

authRouter.post("/inviteChild", limiter, auth, userController.inviteChild);

//invite friend router
authRouter.post("/inviteFriend", limiter, auth, userController.inviteFriend);

//get user by id router

authRouter.get("/verifyUser/:id", limiter, userController.verifyUser);

//verify child router
authRouter.get("/verifyChild/:id", limiter, userController.verifyChild);

//child analytics router
authRouter.get(
  "/childAnalytics/:id",
  limiter,
  auth,
  userController.childAnalytics
);

//user delete router
authRouter.delete("/deleteUser", limiter, auth, userController.userDelete);

//user feed back router
authRouter.post("/feedBack", limiter, auth, userController.feedBack);
