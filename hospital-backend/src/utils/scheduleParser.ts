export const parsePlanToSchedule = (plan: string[]): Date[] => {
  const schedule: Date[] = [];

  // Log the plan array for debugging
  console.log("Plan Array:", plan);

  plan.forEach((action) => {
    // Ensure action is a string
    if (typeof action !== "string") {
      console.error("Invalid action type:", action);
      return; // Skip invalid actions
    }

    // Extract duration and frequency from the action (e.g., "daily for 7 days")
    const durationMatch = action.match(/(\d+)\s*(day|week|month)/i);
    const frequencyMatch = action.match(
      /(daily|every \d+ days|weekly|monthly)/i
    );

    if (durationMatch && frequencyMatch) {
      const duration = parseInt(durationMatch[1], 10); // Number of days/weeks/months
      const unit = durationMatch[2].toLowerCase(); // "day", "week", or "month"
      const frequency = frequencyMatch[0].toLowerCase(); // "daily", "every 2 days", etc.

      let interval = 1; // Default interval for "daily"
      if (frequency.startsWith("every")) {
        interval = parseInt(frequency.match(/\d+/)![0], 10); // Extract interval (e.g., 2 for "every 2 days")
      }

      for (let i = 0; i < duration; i++) {
        const date = new Date();
        if (unit === "day") date.setDate(date.getDate() + i * interval);
        else if (unit === "week")
          date.setDate(date.getDate() + i * 7 * interval);
        else if (unit === "month")
          date.setMonth(date.getMonth() + i * interval);
        date.setHours(9, 0, 0, 0); // Set reminder for 9 AM
        schedule.push(date);
      }
    }
  });

  return schedule;
};
