import exporess from "express";
import cors from "cors";
import logger from "./config/logger";
import userRouter from "./routes/user.router";

const app = exporess();

//middlewares
app.use(cors());
app.use(exporess.json());

//root route
app.get("/", (req, res) => {
  logger.info("Root route running");
  res.send("Hospital Api running");
});

//user routes
app.use("/api/users", userRouter);

export default app;
