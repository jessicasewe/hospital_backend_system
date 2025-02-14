import exporess from "express";
import cors from "cors";
import logger from "./config/logger";
import userRouter from "./routes/user.router";
import doctorNoteRouter from "./routes/doctor-note.router";
import reminderRouter from "./routes/reminder.router";

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

//doctor-note routes
app.use("/api", doctorNoteRouter);

//reminder routes
app.use("/api", reminderRouter);

export default app;
