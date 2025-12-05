import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { ReviewService } from "./review.service";

export const ReviewController = {
  createReview: catchAsync(async (req: Request, res: Response) => {
    const review = await ReviewService.createReview(
      req.user!.userId,
      req.body
    );

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Review created successfully",
      data: { review },
    });
  }),

  getReviewsByListing: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reviews, meta } = await ReviewService.getReviewsByListing(
      id,
      req.query as Record<string, string>
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Reviews retrieved successfully",
      data: { reviews },
      meta,
    });
  }),
};

