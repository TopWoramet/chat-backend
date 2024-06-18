import { Request, Response, NextFunction } from "express";

export const validationHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err && err.error) {
    res.status(400).json({
      type: err.type,
      message: err.error.toString(),
    });
  } else {
    next(err);
  }
};
