import { Request, Response } from "express";
import { validationResult } from "express-validator";
import DoctorNote from "../models/doctor-note.model";
import User from "../models/user.model";
import logger from "../config/logger";
import { getActionableSteps } from "../services/gemini.service";
import { encrypt, decrypt } from "../utils/encryption";
import { parsePlanToSchedule } from "../utils/scheduleParser";
import { scheduleReminders } from "../services/reminder.service";

export const submitDoctorNote = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { patientId, note } = req.body;
  const user = (req as any).user;

  try {
    // Validate doctor
    const doctor = await User.findById(user.userId);
    if (!doctor || doctor.role !== "doctor") {
      return res.status(403).json({ msg: "Access denied. Doctors only." });
    }

    // Validate patient
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== "patient") {
      return res.status(404).json({ msg: "Patient not found" });
    }

    // Encrypt note before saving
    const encryptedNote = encrypt(note, user.userId, patientId);

    // Create and save doctor's note
    const newDoctorNote = new DoctorNote({
      doctorId: user.userId,
      patientId,
      note: encryptedNote, // Store encrypted note
    });

    await newDoctorNote.save();

    // Extract actionable steps
    const { checklist, plan } = await getActionableSteps(note);

    // Schedule reminders based on the plan
    const schedule: Date[] = parsePlanToSchedule(plan);
    await scheduleReminders(user.userId, patientId, schedule);

    res.status(201).json({
      msg: "Doctor's note submitted successfully",
      actionableSteps: { checklist, plan },
    });
  } catch (err) {
    logger.error("Error submitting doctor's note: " + err);
    res.status(500).json({ msg: "Server error" });
  }
};

export const getDoctorNotes = async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { patientId } = req.params;

  try {
    let notes;

    if (user.role === "doctor") {
      const doctor = await User.findById(user.userId);
      if (!doctor) {
        return res.status(403).json({ msg: "Access denied. Doctors only." });
      }

      const patient = await User.findById(patientId);
      if (!patient || patient.doctorId?.toString() !== doctor.id.toString()) {
        return res.status(400).json({ msg: "Invalid patient selection" });
      }

      notes = await DoctorNote.find({ doctorId: doctor.id, patientId }).sort({
        createdAt: -1,
      });
    } else if (user.role === "patient" && user.userId === patientId) {
      notes = await DoctorNote.find({ patientId: user.userId }).sort({
        createdAt: -1,
      });
    } else {
      return res.status(403).json({ msg: "Access denied." });
    }

    if (!notes.length) {
      return res.status(404).json({ msg: "No doctor's notes found." });
    }

    const decryptedNotes = notes.map((note) => {
      try {
        return {
          ...note.toObject(),
          note: decrypt(
            note.note,
            note.doctorId.toString(),
            note.patientId.toString()
          ),
        };
      } catch (error) {
        logger.error("Error decrypting note:", error);
        return {
          ...note.toObject(),
          note: "[Decryption failed]",
        };
      }
    });

    res.status(200).json(decryptedNotes);
  } catch (err) {
    logger.error("Error fetching doctor notes:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

export const getActionableStepsForPatient = async (
  req: Request,
  res: Response
) => {
  const { patientId } = req.params;
  const user = (req as any).user;

  try {
    // Ensure the user is authorized to access this data
    if (user.role !== "doctor" && user.userId !== patientId) {
      return res.status(403).json({ msg: "Unauthorized access" });
    }

    // Fetch the latest doctor's note for the patient
    const latestNote = await DoctorNote.findOne({ patientId }).sort({
      createdAt: -1,
    });

    if (!latestNote) {
      return res.status(404).json({ msg: "No notes found for this patient" });
    }

    // Decrypt the note and extract actionable steps
    const decryptedNote = decrypt(
      latestNote.note,
      latestNote.doctorId.toString(),
      latestNote.patientId.toString()
    );

    const actionableSteps = await getActionableSteps(decryptedNote);

    res.status(200).json(actionableSteps);
  } catch (err) {
    logger.error("Error fetching actionable steps: " + err);
    res.status(500).send("Server error");
  }
};
