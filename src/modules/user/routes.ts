import express from "express";
import * as userController from "./controller";
import { registerSchema, loginSchema } from "./validation";
import validateRequest from "../../utils/validateRequest";
import { verifyToken } from "../../utils/jwt";

const router = express.Router();

router.post(
  "/sign-up",
  validateRequest(registerSchema),
  userController.register
);

router.post("/sign-in", validateRequest(loginSchema), userController.login);

router.get("/", verifyToken, userController.getAll);

router.get("/auth/check", userController.authCheck)

export default router;
