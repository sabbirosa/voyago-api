import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";

import { AppError } from "../errorHelpers/AppError";
import { UserRole } from "../modules/auth/auth.interface";

/**
 * Role-based access control middleware
 * Requires user to be authenticated (use after checkAuth)
 * and have one of the specified roles
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "Authentication required. Please login."
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        `Access denied. This resource requires one of the following roles: ${allowedRoles.join(
          ", "
        )}`
      );
    }

    next();
  };
};

/**
 * Convenience guards for specific roles
 */
export const requireTourist = requireRole("TOURIST");
export const requireGuide = requireRole("GUIDE");
export const requireAdmin = requireRole("ADMIN");
export const requireGuideOrAdmin = requireRole("GUIDE", "ADMIN");
