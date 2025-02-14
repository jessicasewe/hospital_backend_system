import Reminder from "../models/reminder.model";

export const scheduleReminders = async (
  doctorId: string,
  patientId: string,
  schedule: Date[]
) => {
  // Remove existing reminders for this patient
  await Reminder.deleteMany({ patientId });

  // Create new reminders
  const reminders = schedule.map((date) => ({
    patientId,
    doctorId,
    message: `Reminder: Follow the doctor's plan.`,
    scheduledAt: date,
    status: "pending",
  }));

  await Reminder.insertMany(reminders);
  return reminders;
};
