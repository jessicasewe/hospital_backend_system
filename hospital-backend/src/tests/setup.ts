import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config({ path: "./.env" });

beforeAll(async () => {
  await mongoose.connect(global.__MONGO_URI__);
});

afterAll(async () => {
  await mongoose.disconnect();
});
