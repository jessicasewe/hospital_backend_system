import crypto from "crypto";
import dotenv from "dotenv";
import logger from "../config/logger";

dotenv.config();

const MASTER_KEY = process.env.ENCRYPTION_KEY;
const IV_LENGTH = 16;
const ALGORITHM = "aes-256-cbc";

if (!MASTER_KEY) {
  logger.error("Encryption master key is missing. Set ENCRYPTION_KEY in .env.");
  throw new Error(
    "Encryption master key is missing. Set ENCRYPTION_KEY in .env."
  );
}

const deriveKey = (doctorId: string, patientId: string): Buffer => {
  const uniqueString = `${doctorId}:${patientId}:${MASTER_KEY}`;
  return crypto.createHash("sha256").update(uniqueString).digest();
};

export const encrypt = (
  text: string,
  doctorId: string,
  patientId: string
): string => {
  if (!text) return "";

  const iv = crypto.randomBytes(IV_LENGTH);
  const key = deriveKey(doctorId, patientId);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  return `${iv.toString("hex")}:${encrypted}`;
};

export const decrypt = (
  encryptedText: string,
  doctorId: string,
  patientId: string
): string => {
  if (!encryptedText.includes(":")) {
    logger.warn("[Invalid encrypted format]");
    return "[Invalid encrypted format]";
  }

  try {
    const [ivHex, encryptedData] = encryptedText.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const key = deriveKey(doctorId, patientId);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Decryption error: ${error.message}`);
    } else {
      logger.error("Decryption error:", error);
    }
    return "[Decryption failed]";
  }
};
