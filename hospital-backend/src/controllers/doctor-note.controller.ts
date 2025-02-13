import { Request, Response } from "express";
import { validationResult } from "express-validator";
import DoctorNote from "../models/doctor-note.model";
import User from "../models/user.model";
import logger from "../config/logger";

export const submitDoctorNote = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { patientId, note } = req.body;
  const user = (req as any).user;

  try {
    const doctor = await User.findById(user.userId);
    if (!doctor || doctor.role !== "doctor") {
      return res.status(403).json({ msg: "Access denied. Doctors only." });
    }

    const patient = await User.findById(patientId);
    if (!patient || patient.role !== "patient") {
      return res.status(404).json({ msg: "Patient not found" });
    }

    const newDoctorNote = new DoctorNote({
      doctorId: user.userId,
      patientId,
      note,
    });

    await newDoctorNote.save();
    logger.info(
      `Doctor ${doctor.email} submitted a note for patient ${patient.email}`
    );

    res.status(201).json({ msg: "Doctor's note submitted successfully" });
  } catch (err) {
    logger.error("Error submitting doctor's note: " + err);
    res.status(500).send("Server error");
  }
};

export const getDoctorNotes = async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { patientId } = req.params;

  try {
    const doctor = await User.findById(user.userId);
    if (!doctor || doctor.role !== "doctor") {
      return res.status(403).json({ msg: "Access denied. Doctors only." });
    }

    const patient = await User.findById(patientId);
    if (!patient || patient.doctorId?.toString() !== doctor.id.toString()) {
      return res.status(400).json({ msg: "Invalid patient selection" });
    }

    const notes = await DoctorNote.find({
      doctorId: doctor.id,
      patientId,
    }).sort({
      createdAt: -1,
    });

    if (!notes.length) {
      return res
        .status(404)
        .json({ msg: "No doctor's notes for this patient" });
    }

    logger.info(
      `Doctor ${doctor.email} retrieved notes for patient ${patient.email}`
    );

    res.status(200).json(notes);
  } catch (err) {
    logger.error("Error fetching doctor notes: " + err);
    res.status(500).json({ msg: "Server error" });
  }
};
