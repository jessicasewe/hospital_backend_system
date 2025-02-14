import logger from "../config/logger";

export const sendNotification = async (patientId: string, message: string) => {
  logger.info(`Sending reminder to Patient ${patientId}: ${message}`);
};
