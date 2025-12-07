import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { AdminService } from "./admin.service";

export const AdminController = {
  getUsers: catchAsync(async (req: Request, res: Response) => {
    const { users, meta } = await AdminService.getUsers(
      req.query as Record<string, string>
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Users retrieved successfully",
      data: { users },
      meta,
    });
  }),

  updateUser: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = await AdminService.updateUser(id, req.body);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "User updated successfully",
      data: { user },
    });
  }),

  getListings: catchAsync(async (req: Request, res: Response) => {
    const { listings, meta } = await AdminService.getListings(
      req.query as Record<string, string>
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Listings retrieved successfully",
      data: { listings },
      meta,
    });
  }),

  updateListing: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const listing = await AdminService.updateListing(id, req.body);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Listing updated successfully",
      data: { listing },
    });
  }),

  getAnalytics: catchAsync(async (_req: Request, res: Response) => {
    const analytics = await AdminService.getAnalytics();

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Analytics retrieved successfully",
      data: { analytics },
    });
  }),
};


