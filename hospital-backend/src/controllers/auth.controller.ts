import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { validationResult } from "express-validator";
import User from "../models/user.model";
import logger from "../config/logger";
import jwt from "jsonwebtoken";

export const register = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });

  const { name, email, password, role, specialization, doctorId } = req.body;

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      msg: "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character.",
    });
  }

  try {
    let userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ msg: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    if (role === "doctor") {
      if (!specialization)
        return res
          .status(400)
          .json({ msg: "Specialization is required for doctors" });

      const newDoctor = new User({
        name,
        email,
        password: hashedPassword,
        role,
        specialization,
      });
      await newDoctor.save();
      logger.info(`New doctor registered: ${email}`);

      return res.status(201).json({
        msg: "Doctor registered successfully. No patients assigned yet.",
        assignedPatients: [],
      });
    }

    if (role === "patient") {
      const newPatient = new User({
        name,
        email,
        password: hashedPassword,
        role,
        doctorId: null,
      });
      await newPatient.save();
      logger.info(`New patient registered: ${email}`);

      const doctors = await User.find({ role: "doctor" }).select(
        "name email specialization"
      );

      return res.status(201).json({
        msg: "Patient registered successfully. Please select a doctor.",
        doctors,
      });
    }

    // Explicitly return a message for invalid roles
    return res.status(400).json({ msg: "Invalid role specified" });
  } catch (err) {
    logger.error("Error in registration: " + err);
    res.status(500).send("Server error");
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.REFRESH_TOKEN_SECRET!,
      { expiresIn: "7d" }
    );

    user.refreshToken = refreshToken;
    await user.save();

    let response: {
      accessToken: string;
      refreshToken: string;
      msg: string;
      role: "doctor" | "patient";
      doctors?: any;
      assignedPatients?: any;
      assignedDoctor?: any;
    } = { accessToken, refreshToken, msg: "Login successful", role: user.role };

    if (user.role === "patient") {
      if (!user.doctorId) {
        const doctors = await User.find({ role: "doctor" }).select(
          "name email specialization"
        );
        response.msg = "Please select a doctor.";
        response = { ...response, doctors };
      } else {
        const doctor = await User.findById(user.doctorId).select(
          "name email specialization"
        );
        response.msg = `Welcome to your dashboard, ${user.name}`;
        response = {
          ...response,
          assignedDoctor: doctor,
        };
      }
    }

    if (user.role === "doctor") {
      const assignedPatients = await User.find({ doctorId: user.id }).select(
        "name email"
      );

      response.msg = `Welcome to your dashboard, Dr. ${user.name}`;
      response = { ...response, assignedPatients };
    }

    res.status(200).json(response);
  } catch (err) {
    logger.error("Error in login: " + err);
    res.status(500).send("Server error");
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken)
    return res.status(400).json({ msg: "Refresh token is required" });

  try {
    const user = await User.findOne({ refreshToken });
    if (!user) return res.status(400).json({ msg: "Invalid refresh token" });

    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET!,
      (err: any, decoded: any) => {
        if (err) return res.status(400).json({ msg: "Invalid refresh token" });

        const accessToken = jwt.sign(
          { userId: decoded.userId, role: user.role },
          process.env.JWT_SECRET!,
          { expiresIn: "1h" }
        );

        res.status(200).json({ accessToken });
      }
    );
  } catch (err) {
    logger.error("Error refreshing token: " + err);
    res.status(500).send("Server error");
  }
};

export const logout = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken)
    return res.status(400).json({ msg: "Refresh token is required" });

  try {
    const user = await User.findOne({ refreshToken });
    if (!user) return res.status(400).json({ msg: "Invalid refresh token" });

    user.refreshToken = "";
    await user.save();

    res.status(200).json({ msg: "Logged out successfully" });
  } catch (err) {
    logger.error("Error in logout: " + err);
    res.status(500).send("Server error");
  }
};

export const selectDoctor = async (req: Request, res: Response) => {
  const { doctorId } = req.body;
  const user = (req as any).user;

  if (!user || !user.userId) {
    return res.status(401).json({ msg: "Unauthorized: No user ID found" });
  }

  try {
    const patient = await User.findById(user.userId);
    if (!patient || patient.role !== "patient") {
      return res.status(400).json({ msg: "Invalid patient" });
    }

    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== "doctor") {
      return res.status(400).json({ msg: "Invalid doctor" });
    }

    patient.doctorId = doctorId;
    await patient.save();

    res.status(200).json({
      msg: "Doctor selected successfully. Welcome to your dashboard!",
      dashboard: `Welcome, ${patient.name}`,
    });
  } catch (err) {
    logger.error("Error selecting doctor: " + err);
    res.status(500).send("Server error");
  }
};
