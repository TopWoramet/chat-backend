import { NextFunction, Request, Response } from "express";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  let message = err.message;

  if (statusCode === 500) {
    message = "Internal Server Error";
  }

  res.status(statusCode).json({ message });
};
