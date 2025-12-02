import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { JwtPayload } from "jsonwebtoken";

import { config } from "../config/env";
import { prisma } from "../config/prisma";
import { AppError } from "../errorHelpers/AppError";
import { UserRole } from "../modules/auth/auth.interface";
import { verifyToken } from "../utils/jwt";

/**
 * Authentication middleware - verifies JWT token and attaches user to request
 */
export const checkAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from Authorization header (Bearer token) or from cookies
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : req.cookies?.accessToken;

    if (!token) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "Authentication required. Please login."
      );
    }

    // Verify token
    const verifiedToken = verifyToken(
      token,
      config.jwt.accessSecret
    ) as JwtPayload & {
      userId: string;
      email: string;
      role: UserRole;
    };

    if (
      !verifiedToken?.userId ||
      !verifiedToken?.email ||
      !verifiedToken?.role
    ) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "Invalid token. Please login again."
      );
    }

    // Verify user still exists in database
    const user = await prisma.user.findUnique({
      where: { id: verifiedToken.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isEmailVerified: true,
        isApproved: true,
      },
    });

    if (!user) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "User not found. Please login again."
      );
    }

    if (!user.isEmailVerified) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "Email address is not verified. Please verify your email."
      );
    }

    // For GUIDE and ADMIN, check if account is approved
    if (user.role !== "TOURIST" && !user.isApproved) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "Account is pending approval by an administrator."
      );
    }

    // Attach user to request object
    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
    };

    next();
  } catch (error) {
    next(error);
  }
};
