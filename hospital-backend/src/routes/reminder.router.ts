import express from "express";
import { check, body } from "express-validator";
import {
  getRemindersForPatient,
  markReminderAsCompleted,
  rescheduleReminder,
} from "../controllers/reminder.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const reminderRouter = express.Router();

reminderRouter.get(
  "/reminders/:patientId",
  authMiddleware as any,
  [check("patientId", "Invalid patient ID").not().isEmpty()],
  getRemindersForPatient as any
);

reminderRouter.put(
  "/reminders/:reminderId/complete",
  authMiddleware as any,
  [check("reminderId", "Invalid reminder ID").not().isEmpty()],
  markReminderAsCompleted as any
);

reminderRouter.put(
  "/reminders/:reminderId/reschedule",
  authMiddleware as any,
  [
    check("reminderId", "Invalid reminder ID").not().isEmpty(),
    body("newDate", "New date is required").not().isEmpty(),
  ],
  rescheduleReminder as any
);

export default reminderRouter;
