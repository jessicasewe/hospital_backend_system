import { Request, Response } from "express";
import { validationResult } from "express-validator";
import Reminder from "../models/reminder.model";
import logger from "../config/logger";

export const getRemindersForPatient = async (req: Request, res: Response) => {
  const { patientId } = req.params;
  const user = (req as any).user;

  try {
    // Ensure the user is authorized to access this data
    if (user.role !== "doctor" && user.userId !== patientId) {
      return res.status(403).json({ msg: "Unauthorized access" });
    }

    const reminders = await Reminder.find({ patientId }).sort({
      scheduledAt: 1,
    });

    res.status(200).json(reminders);
  } catch (err) {
    logger.error("Error fetching reminders: " + err);
    res.status(500).send("Server error");
  }
};

export const markReminderAsCompleted = async (req: Request, res: Response) => {
  const { reminderId } = req.params;

  try {
    const reminder = await Reminder.findById(reminderId);
    if (!reminder) {
      return res.status(404).json({ msg: "Reminder not found" });
    }

    reminder.status = "completed";
    await reminder.save();

    res.status(200).json({ msg: "Reminder marked as completed" });
  } catch (err) {
    logger.error("Error marking reminder as completed: " + err);
    res.status(500).send("Server error");
  }
};

export const rescheduleReminder = async (req: Request, res: Response) => {
  const { reminderId } = req.params;
  const { newDate } = req.body;

  try {
    const reminder = await Reminder.findById(reminderId);
    if (!reminder) {
      return res.status(404).json({ msg: "Reminder not found" });
    }

    reminder.scheduledAt = newDate;
    reminder.status = "pending";
    await reminder.save();

    res.status(200).json({ msg: "Reminder rescheduled successfully" });
  } catch (err) {
    logger.error("Error rescheduling reminder: " + err);
    res.status(500).send("Server error");
  }
};
