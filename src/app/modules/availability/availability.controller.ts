import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AvailabilityService } from "./availability.service";

export const AvailabilityController = {
  createAvailabilitySlot: catchAsync(async (req: Request, res: Response) => {
    const slot = await AvailabilityService.createAvailabilitySlot(
      req.user!.userId,
      req.body
    );

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Availability slot created successfully",
      data: { slot },
    });
  }),

  getAvailabilitySlots: catchAsync(async (req: Request, res: Response) => {
    const { slots, meta } = await AvailabilityService.getAvailabilitySlots(
      req.query as Record<string, string>
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Availability slots retrieved successfully",
      data: { slots },
      meta,
    });
  }),

  updateAvailabilitySlot: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const slot = await AvailabilityService.updateAvailabilitySlot(
      id,
      req.user!.userId,
      req.body
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Availability slot updated successfully",
      data: { slot },
    });
  }),

  deleteAvailabilitySlot: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    await AvailabilityService.deleteAvailabilitySlot(id, req.user!.userId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Availability slot deleted successfully",
    });
  }),

  checkAvailability: catchAsync(async (req: Request, res: Response) => {
    const { guideId, date } = req.query;
    const result = await AvailabilityService.checkAvailability(
      guideId as string,
      new Date(date as string)
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Availability checked successfully",
      data: result,
    });
  }),
};

