import express from "express";
import { check, body } from "express-validator";
import {
  submitDoctorNote,
  getDoctorNotes,
} from "../controllers/doctor-note.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const doctorNoteRouter = express.Router();

doctorNoteRouter.post(
  "/submit-note",
  authMiddleware as any,
  [
    check("patientId", "Patient ID is required").not().isEmpty(),
    body("note", "Note content cannot be empty").not().isEmpty(),
  ],
  submitDoctorNote as any
);

doctorNoteRouter.get(
  "/notes/:patientId",
  authMiddleware as any,
  [check("patientId", "Invalid patient ID").not().isEmpty()],
  getDoctorNotes as any
);

export default doctorNoteRouter;
