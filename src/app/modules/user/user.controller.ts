import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { UserService } from "./user.service";

export const UserController = {
  getMyProfile: catchAsync(async (req: Request, res: Response) => {
    const user = await UserService.getMyProfile(req.user!.userId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Profile retrieved successfully",
      data: {
        user,
      },
    });
  }),

  getUserProfile: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = await UserService.getUserProfile(id);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "User profile retrieved successfully",
      data: {
        user,
      },
    });
  }),

  updateMyProfile: catchAsync(async (req: Request, res: Response) => {
    const profile = await UserService.updateMyProfile(
      req.user!.userId,
      req.body
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Profile updated successfully",
      data: {
        profile,
      },
    });
  }),

  updateMyGuideProfile: catchAsync(async (req: Request, res: Response) => {
    const guideProfile = await UserService.updateMyGuideProfile(
      req.user!.userId,
      req.body
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Guide profile updated successfully",
      data: {
        guideProfile,
      },
    });
  }),

  createGuideProfile: catchAsync(async (req: Request, res: Response) => {
    const guideProfile = await UserService.createGuideProfile(
      req.user!.userId,
      req.body
    );

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Guide profile created successfully",
      data: {
        guideProfile,
      },
    });
  }),

  changePassword: catchAsync(async (req: Request, res: Response) => {
    await UserService.changePassword(
      req.user!.userId,
      req.body.currentPassword,
      req.body.newPassword
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Password changed successfully",
    });
  }),
};

