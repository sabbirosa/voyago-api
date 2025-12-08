import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AppError } from "../../errorHelpers/AppError";
import { GuideService } from "./guide.service";

const guideService = new GuideService();

export const getGuideAnalytics = catchAsync(async (req: Request, res: Response) => {
  const guideId = req.user!.userId;

  const analytics = await guideService.getGuideAnalytics(guideId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    data: analytics,
  });
});

export const getGuideBadges = catchAsync(async (req: Request, res: Response) => {
  const guideId = req.user!.userId;

  const badges = await guideService.getGuideBadges(guideId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    data: badges,
  });
});

export const getPublicGuideProfile = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const profile = await guideService.getPublicGuideProfile(id);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Guide profile retrieved successfully",
      data: { guide: profile },
    });
  } catch (error: any) {
    if (error.message === "Guide not found") {
      throw new AppError(httpStatus.NOT_FOUND, "Guide not found");
    }
    throw error;
  }
});

export const getGuides = catchAsync(async (req: Request, res: Response) => {
  const { guides, meta } = await guideService.getGuides(
    req.query as Record<string, string>
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Guides retrieved successfully",
    data: { guides },
    meta,
  });
});

