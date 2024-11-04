import * as privacyController from "../controller/privacyController.js";
import express from "express";
export const privacyRouter = express();
import auth from "../middleware/auth.js";

import limiter from "../middleware/throttleservice.js";

//get privacy router
privacyRouter.get("/privacy", limiter, auth, privacyController.getPrivacy);
