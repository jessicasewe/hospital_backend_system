import mongoose from "mongoose";
import dotenv from "dotenv";
import logger from "./logger";

dotenv.config();

export const connectDb = async () => {
  try {
    if (process.env.MONGO_URI) {
      await mongoose.connect(process.env.MONGO_URI);
      logger.info("Connected to MongoDB");
    }
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
};
