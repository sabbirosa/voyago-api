import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { GuideService } from "./guide.service";

const guideService = new GuideService();

export const getGuideAnalytics = catchAsync(async (req: Request, res: Response) => {
  const guideId = req.user!.id;

  const analytics = await guideService.getGuideAnalytics(guideId);

  sendResponse(res, 200, {
    success: true,
    data: analytics,
  });
});

export const getGuideBadges = catchAsync(async (req: Request, res: Response) => {
  const guideId = req.user!.id;

  const badges = await guideService.getGuideBadges(guideId);

  sendResponse(res, 200, {
    success: true,
    data: badges,
  });
});

