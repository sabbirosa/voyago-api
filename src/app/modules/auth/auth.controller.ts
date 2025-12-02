import httpStatus from "http-status";
import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

export const AuthController = {
  login: catchAsync(async (req: Request, res: Response) => {
    const result = await AuthService.login(req.body);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Login successful (placeholder)",
      data: result,
    });
  }),
};


