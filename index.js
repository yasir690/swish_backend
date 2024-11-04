import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dbConnect from "./db/connectivity.js";
import { authRouter } from "./router/authRouter.js";
import { goalRouter } from "./router/goalRouter.js";
import { shootingRouter } from "./router/shootingRouter.js";
import { adminRouter } from "./router/adminRouter.js";
import { libraryRouter } from "./router/libraryRouter.js";
import { purchaseRouter } from "./router/purchaseRouter.js";
import { privacyRouter } from "./router/privacyRouter.js";
import { notificationRouter } from "./router/notificationRouter.js";
import { friendsRouter } from "./router/friendRouter.js";
import { handlePayment } from "./utils/paymentStatus.js";
// import { handlePayment} from "./utils/paymentStatus.js";
const apiPrefix = process.env.API_PRIFEX;
const port = process.env.PORT || 4000;

const app = express();

// Allow requests from all origins using wildcard (*)
app.use(cors({ origin: "*" }));
app.use(express.static("public"));

//web hooks call

app.use(bodyParser.json());
// Configure bodyParser to handle post requests
app.use(bodyParser.urlencoded({ extended: true }));
app.post("/webhook", handlePayment);

app.use(apiPrefix, authRouter);
app.use(apiPrefix, goalRouter);
app.use(apiPrefix, shootingRouter);
app.use(apiPrefix, adminRouter);
app.use(apiPrefix, libraryRouter);
app.use(apiPrefix, purchaseRouter);
app.use(apiPrefix, privacyRouter);
app.use(apiPrefix, notificationRouter);
app.use(apiPrefix, friendsRouter);

dbConnect();

app.get("/", (req, res) => {
  res.send("Swish server is up");
});
app.get("/checkserver", (req, res) => {
  res.send("welcome to application server is up and working on ec2...");
});

app.listen(port, (req, res) => {
  console.log(`server is running at ${port}`);
});
