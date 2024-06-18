import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

const validateRequest =
  (schema: ZodSchema<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      return res.status(400).json((error as any).errors);
    }
  };

export default validateRequest;
