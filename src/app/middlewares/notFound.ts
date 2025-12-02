import { Request, Response, NextFunction } from "express";
import httpStatus from "http-status";

export const notFoundHandler = (req: Request, res: Response, _next: NextFunction) => {
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
};


