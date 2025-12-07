/* eslint-disable @typescript-eslint/no-explicit-any */
import { ErrorRequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import httpStatus from "http-status";
import { config } from "../config/env";
import { AppError } from "../errorHelpers/AppError";
import { handlerZodError } from "../helpers/handlerZodError";
import { handlePrismaError } from "../helpers/handlePrismaError";
import { handlerDuplicateError } from "../helpers/handleDuplicateError";
import { TErrorSources } from "../interfaces/error.types";

export const globalErrorHandler: ErrorRequestHandler = (
  err,
  _req,
  res,
  _next
) => {
  let statusCode: number = httpStatus.INTERNAL_SERVER_ERROR;
  let message = "Something went wrong";
  let errorSources: TErrorSources[] = [];

  if (config.nodeEnv === "development") {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const simplifiedError = handlerZodError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = simplifiedError.errorSources || [];
  }
  // Handle Prisma errors
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const simplifiedError = handlePrismaError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = simplifiedError.errorSources || [];
  }
  // Handle Prisma validation errors
  else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = httpStatus.BAD_REQUEST;
    message = "Invalid input data";
  }
  // Handle duplicate key errors (PostgreSQL unique constraint)
  else if ((err as any).code === "23505") {
    const simplifiedError = handlerDuplicateError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
  }
  // Handle foreign key constraint errors
  else if ((err as any).code === "23503") {
    statusCode = httpStatus.BAD_REQUEST;
    message = "Invalid reference: related record does not exist";
  }
  // Handle custom AppError
  else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }
  // Handle generic Error
  else if (err instanceof Error) {
    message = err.message;
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errorSources.length > 0 && { errorSources }),
    ...(config.nodeEnv === "development" && {
      stack: err instanceof Error ? err.stack : undefined,
      err: err instanceof Error ? err.message : err,
    }),
  });
};
