import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { ZodError, ZodObject } from "zod";

export const validateRequest =
  (schema: ZodObject<any, any>) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(httpStatus.BAD_REQUEST).json({
          success: false,
          message: "Validation error",
          errors: error.issues,
        });
        return;
      }
      next(error);
    }
  };
