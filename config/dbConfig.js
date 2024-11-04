import { config } from "dotenv";

config();

const dbConfig = {
  db: process.env.DB_COLLECTION,
};

export default dbConfig;
