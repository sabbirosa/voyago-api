import httpStatus from "http-status";
import { JwtPayload } from "jsonwebtoken";

import { config } from "../config/env";
import { AppError } from "../errorHelpers/AppError";
import { generateToken, verifyToken } from "./jwt";

// For now we don't have a persisted User model in Prisma; this payload
// represents the minimal user identity encoded into tokens.
export type TokenUserPayload = {
  userId: string;
  email: string;
  role: string;
};

export const createUserTokens = (user: TokenUserPayload) => {
  const jwtPayload: JwtPayload = {
    userId: user.userId,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateToken(
    jwtPayload,
    config.jwt.accessSecret,
    config.jwt.accessExpiresIn
  );

  const refreshToken = generateToken(
    jwtPayload,
    config.jwt.refreshSecret,
    config.jwt.refreshExpiresIn
  );

  return {
    accessToken,
    refreshToken,
  };
};

export const createNewAccessTokenWithRefreshToken = (refreshToken: string) => {
  let verified: JwtPayload;

  try {
    verified = verifyToken(
      refreshToken,
      config.jwt.refreshSecret
    ) as JwtPayload;
  } catch {
    throw new AppError(httpStatus.UNAUTHORIZED, "Invalid refresh token");
  }

  if (!verified?.email || !verified?.userId) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Invalid token payload");
  }

  const jwtPayload: JwtPayload = {
    userId: verified.userId,
    email: verified.email,
    role: verified.role,
  };

  const accessToken = generateToken(
    jwtPayload,
    config.jwt.accessSecret,
    config.jwt.accessExpiresIn
  );

  return accessToken;
};


