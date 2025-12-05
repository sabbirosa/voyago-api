import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { MessageService } from "./message.service";

export const MessageController = {
  createMessage: catchAsync(async (req: Request, res: Response) => {
    const message = await MessageService.createMessage(
      req.user!.userId,
      req.body
    );

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Message sent successfully",
      data: { message },
    });
  }),

  getMessagesByBooking: catchAsync(async (req: Request, res: Response) => {
    const { bookingId } = req.params;
    const { messages, meta } = await MessageService.getMessagesByBooking(
      bookingId,
      req.user!.userId
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Messages retrieved successfully",
      data: { messages },
      meta,
    });
  }),

  markMessagesAsRead: catchAsync(async (req: Request, res: Response) => {
    const { bookingId } = req.params;
    await MessageService.markMessagesAsRead(bookingId, req.user!.userId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Messages marked as read",
    });
  }),
};

