import { Request, Response } from "express";
import httpStatus from "http-status";
import { config } from "../../config/env";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AuthService } from "./auth.service";

export const AuthController = {
  register: catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.register(req.body);

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message:
        "Registration successful. Please verify your email with the OTP sent to your inbox.",
      data: {
        user: result.user,
      },
    });
  }),

  login: catchAsync(async (req: Request, res: Response) => {
    const tokens = await AuthService.login(req.body);

    // In a future iteration, refreshToken can be moved to an httpOnly cookie.
    const { accessToken, refreshToken } = tokens;

    // For now we return both tokens in the JSON response so that
    // the frontend can manage them via a shared storage helper.

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Login successful",
      data: {
        accessToken,
        refreshToken,
        expiresIn: config.jwt.accessExpiresIn,
      },
    });
  }),

  verifyOTP: catchAsync(async (req: Request, res: Response) => {
    const { email, otp } = req.body as { email: string; otp: string };

    const tokens = await AuthService.verifyOTP(email, otp);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Email verified successfully",
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: config.jwt.accessExpiresIn,
      },
    });
  }),

  resendOTP: catchAsync(async (req: Request, res: Response) => {
    const { email } = req.body as { email: string };

    await AuthService.resendOTP(email);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "OTP has been resent to your email",
      data: null,
    });
  }),

  getMe: catchAsync(async (req: Request, res: Response) => {
    // req.user is set by checkAuth middleware
    const user = await AuthService.getMe(req.user!.userId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "User profile retrieved successfully",
      data: {
        user,
      },
    });
  }),
};
