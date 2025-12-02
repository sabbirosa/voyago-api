import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { ListingService } from "./listing.service";

export const ListingController = {
  createListing: catchAsync(async (req: Request, res: Response) => {
    const listing = await ListingService.createListing(
      req.user!.userId,
      req.body
    );

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Listing created successfully",
      data: { listing },
    });
  }),

  getListingById: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const listing = await ListingService.getListingById(id);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Listing retrieved successfully",
      data: { listing },
    });
  }),

  getListings: catchAsync(async (req: Request, res: Response) => {
    const { listings, meta } = await ListingService.getListings(req.query as Record<string, string>);

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
    const listing = await ListingService.updateListing(
      id,
      req.user!.userId,
      req.user!.role,
      req.body
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Listing updated successfully",
      data: { listing },
    });
  }),

  deleteListing: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    await ListingService.deleteListing(
      id,
      req.user!.userId,
      req.user!.role
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Listing deleted successfully",
    });
  }),
};

