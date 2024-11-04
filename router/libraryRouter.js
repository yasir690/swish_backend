import express from "express";
import * as libraryController from "../controller/libraryController.js";
export const libraryRouter = express.Router();
import auth from "../middleware/auth.js";
import limiter from "../middleware/throttleservice.js";

//user library router
libraryRouter.get("/userLibrary", limiter, auth, libraryController.userLibrary);

//get guide router
libraryRouter.get("/getGuidance", limiter, auth, libraryController.getGuide);
