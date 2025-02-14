import express from "express";
import { check, body } from "express-validator";
import {
  register,
  login,
  refreshToken,
  logout,
  selectDoctor,
} from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const userRouter = express.Router();

userRouter.post(
  "/register",
  [
    check("name", "Name is required").not().isEmpty(),
    check("email", "Enter a valid email").isEmail(),
    check("password", "Password must be at least 8 characters long").isLength({
      min: 8,
    }),
    check("role", "Role must be either patient or doctor").isIn([
      "patient",
      "doctor",
    ]),
    body("specialization")
      .if(body("role").equals("doctor"))
      .notEmpty()
      .withMessage("Specialization is required for doctors"),
  ],
  register as any
);

userRouter.post(
  "/login",
  [
    check("email", "Enter a valid email").isEmail(),
    check("password", "Password is required").not().isEmpty(),
  ],
  login as any
);

userRouter.post("/refresh-token", refreshToken as any); // Add this line
userRouter.post("/logout", logout as any); // Add this line
userRouter.post("/select-doctor", authMiddleware as any, selectDoctor as any);

export default userRouter;
