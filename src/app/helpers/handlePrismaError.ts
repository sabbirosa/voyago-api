import { Prisma } from "@prisma/client";
import {
  TGenericErrorResponse,
} from "../interfaces/error.types";

export const handlePrismaError = (
  err: Prisma.PrismaClientKnownRequestError
): TGenericErrorResponse => {

  // Handle unique constraint violations
  if (err.code === "P2002") {
    const target = err.meta?.target as string[] | undefined;
    const field = target?.[0] || "field";
    return {
      statusCode: 400,
      message: `${field} already exists`,
      errorSources: [
        {
          path: field,
          message: `${field} must be unique`,
        },
      ],
    };
  }

  // Handle record not found
  if (err.code === "P2025") {
    return {
      statusCode: 404,
      message: err.meta?.cause as string || "Record not found",
    };
  }

  // Handle foreign key constraint violations
  if (err.code === "P2003") {
    return {
      statusCode: 400,
      message: "Invalid reference: related record does not exist",
    };
  }

  // Handle invalid input
  if (err.code === "P2000") {
    return {
      statusCode: 400,
      message: "Invalid input value",
    };
  }

  // Default Prisma error
  return {
    statusCode: 400,
    message: err.message || "Database error occurred",
  };
};

