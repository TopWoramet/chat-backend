import { NextFunction, Request, Response } from "express";
import * as userService from "./services";
import asyncHandler from "../../utils/asyncHandler";
import { verifyJwtToken } from "../../utils/jwt";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const user = await userService.register(req.body);
  res.status(201).json(user);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const data = await userService.login(req.body);
  res.status(200).json(data);
});

export const getAll = asyncHandler(async (req: Request, res: Response) => {
  const data = await userService.getAll();
  res.status(200).json(data);
});

export const authCheck = asyncHandler(async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    verifyJwtToken(token);
    res.status(200).json({ authenticated: true });
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
});
