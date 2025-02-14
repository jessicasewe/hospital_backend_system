import cron from "node-cron";
import Reminder from "../models/reminder.model";
import { sendNotification } from "../utils/notificationService";
import logger from "../config/logger";

cron.schedule("*/1 * * * *", async () => {
  logger.info("Running scheduled reminder job...");

  try {
    const reminders = await Reminder.find({
      scheduledAt: { $lte: new Date() },
      status: "pending",
    });

    for (const reminder of reminders) {
      await sendNotification(reminder.patientId.toString(), reminder.message);
      reminder.status = "completed";
      await reminder.save();
    }

    logger.info(`Sent ${reminders.length} reminders`);
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Cron job error: ${error.message}`);
    } else {
      logger.error(`Cron job error: ${error}`);
    }
  }
});
