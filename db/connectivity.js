import mongoose from "mongoose";
import dbConfig from "../config/dbConfig.js";
import { config } from "dotenv";
config();

const dbConnect = async () => {
  try {
    // const connectionString = process.env.NODE_ENV === 'local' ? dbConfig.localdb : dbConfig.db;

    await mongoose.connect(dbConfig.db, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // connectTimeoutMS: 30000, // 30 seconds to establish the initial connection
      // serverSelectionTimeoutMS: 30000 // 30 seconds to select a suitable server for operations
    });
    console.log("MongoDb Connected....");
  } catch (error) {
    console.log(error.message);
  }
};

export default dbConnect;
