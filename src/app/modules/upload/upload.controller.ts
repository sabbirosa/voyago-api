import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { UploadService } from "./upload.service";

export const UploadController = {
  uploadImage: catchAsync(async (req: Request, res: Response) => {
    if (!req.file) {
      return sendResponse(res, {
        statusCode: httpStatus.BAD_REQUEST,
        success: false,
        message: "No file uploaded",
      });
    }

    const folder = (req.query.folder as string) || "avatars";
    const result = await UploadService.uploadImage(req.file, folder);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Image uploaded successfully",
      data: result,
    });
  }),
};

