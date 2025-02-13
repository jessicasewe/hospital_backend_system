import exporess from "express";
import cors from "cors";
import logger from "./config/logger";

const app = exporess();

//middlewares
app.use(cors());
app.use(exporess.json());

//root route
app.get("/", (req, res) => {
  logger.info("Root route running");
  res.send("Hospital Api running");
});

export default app;
