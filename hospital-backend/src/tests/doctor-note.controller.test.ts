import request from "supertest";
import express from "express";
import {
  submitDoctorNote,
  getDoctorNotes,
  getActionableStepsForPatient,
} from "../controllers/doctor-note.controller";
import DoctorNote from "../models/doctor-note.model";
import User from "../models/user.model";
import { encrypt } from "../utils/encryption";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { authMiddleware } from "../middleware/auth.middleware";

jest.mock("../config/logger");

jest.mock("../services/gemini.service", () => ({
  getActionableSteps: jest.fn().mockResolvedValue({
    checklist: ["Buy a drug"],
    plan: ["Take Amoxicillin 500mg twice daily for 7 days"],
  }),
}));

// Mock the reminder service
jest.mock("../services/reminder.service", () => ({
  scheduleReminders: jest.fn().mockResolvedValue([]),
}));

const app = express();
app.use(express.json());
app.use(authMiddleware as express.RequestHandler);
app.post("/submit-note", submitDoctorNote as any);
app.get("/notes/:patientId", getDoctorNotes as any);
app.get("/actionable-steps/:patientId", getActionableStepsForPatient as any);

// Mock environment variables
process.env.JWT_SECRET = "test-secret";
process.env.ENCRYPTION_KEY = "test-encryption-key";

describe("DoctorNote Controller", () => {
  let doctor: any;
  let patient: any;
  let accessToken: string;

  beforeAll(async () => {
    // Connect to a test database
    await mongoose.connect("mongodb://localhost:27017/hospital-test");

    doctor = await User.create({
      name: "Dr. John Doe",
      email: "john.doe@example.com",
      password: "Password123!",
      role: "doctor",
      specialization: "Cardiology",
    });

    patient = await User.create({
      name: "Jane Doe",
      email: "jane.doe@example.com",
      password: "Password123!",
      role: "patient",
      doctorId: doctor._id,
    });

    accessToken = jwt.sign(
      { userId: doctor._id, role: doctor.role },
      process.env.JWT_SECRET!,
      {
        expiresIn: "1h",
      }
    );
  });

  afterAll(async () => {
    // Disconnect from the test database
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear the DoctorNote collection before each test
    await DoctorNote.deleteMany({});
  });

  describe("POST /submit-note", () => {
    it("should submit a doctor's note and return actionable steps", async () => {
      const res = await request(app)
        .post("/submit-note")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          patientId: patient._id,
          note: "Patient needs to take Amoxicillin 500mg twice daily for 7 days.",
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.msg).toEqual("Doctor's note submitted successfully");
      expect(res.body.actionableSteps).toEqual({
        checklist: ["Buy a drug"],
        plan: ["Take Amoxicillin 500mg twice daily for 7 days"],
      });
    });

    it("should return 403 if the user is not a doctor", async () => {
      const patientToken = jwt.sign(
        { userId: patient._id, role: patient.role },
        process.env.JWT_SECRET!,
        {
          expiresIn: "1h",
        }
      );

      const res = await request(app)
        .post("/submit-note")
        .set("Authorization", `Bearer ${patientToken}`)
        .send({
          patientId: patient._id,
          note: "Patient needs to take Amoxicillin 500mg twice daily for 7 days.",
        });

      expect(res.statusCode).toEqual(403);
      expect(res.body.msg).toEqual("Access denied. Doctors only.");
    });

    it("should return 404 if the patient is not found", async () => {
      const res = await request(app)
        .post("/submit-note")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          patientId: "invalid-patient-id",
          note: "Patient needs to take Amoxicillin 500mg twice daily for 7 days.",
        });

      expect(res.statusCode).toEqual(404);
      expect(res.body.msg).toEqual("Patient not found");
    });
  });

  describe("GET /notes/:patientId", () => {
    it("should get doctor's notes for a patient", async () => {
      // Submit a note first
      const encryptedNote = encrypt(
        "Patient needs to take Amoxicillin 500mg twice daily for 7 days.",
        doctor._id.toString(),
        patient._id.toString()
      );

      await DoctorNote.create({
        doctorId: doctor._id,
        patientId: patient._id,
        note: encryptedNote,
      });

      const res = await request(app)
        .get(`/notes/${patient._id}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].note).toEqual(
        "Patient needs to take Amoxicillin 500mg twice daily for 7 days."
      );
    });

    it("should return 403 if the user is not authorized", async () => {
      const unauthorizedToken = jwt.sign(
        { userId: "invalid-user-id", role: "patient" },
        process.env.JWT_SECRET!,
        {
          expiresIn: "1h",
        }
      );

      const res = await request(app)
        .get(`/notes/${patient._id}`)
        .set("Authorization", `Bearer ${unauthorizedToken}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body.msg).toEqual("Access denied.");
    });

    it("should return 404 if no notes are found", async () => {
      const res = await request(app)
        .get(`/notes/${patient._id}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.msg).toEqual("No doctor's notes found.");
    });
  });

  describe("GET /actionable-steps/:patientId", () => {
    it("should get actionable steps for a patient", async () => {
      // Submit a note first
      const encryptedNote = encrypt(
        "Patient needs to take Amoxicillin 500mg twice daily for 7 days.",
        doctor._id.toString(),
        patient._id.toString()
      );

      await DoctorNote.create({
        doctorId: doctor._id,
        patientId: patient._id,
        note: encryptedNote,
      });

      const res = await request(app)
        .get(`/actionable-steps/${patient._id}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual({
        checklist: ["Buy a drug"],
        plan: ["Take Amoxicillin 500mg twice daily for 7 days"],
      });
    });

    it("should return 403 if the user is not authorized", async () => {
      const unauthorizedToken = jwt.sign(
        { userId: "invalid-user-id", role: "patient" },
        process.env.JWT_SECRET!,
        {
          expiresIn: "1h",
        }
      );

      const res = await request(app)
        .get(`/actionable-steps/${patient._id}`)
        .set("Authorization", `Bearer ${unauthorizedToken}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body.msg).toEqual("Unauthorized access");
    });

    it("should return 404 if no notes are found", async () => {
      const res = await request(app)
        .get(`/actionable-steps/${patient._id}`)
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.msg).toEqual("No notes found for this patient");
    });
  });
});
