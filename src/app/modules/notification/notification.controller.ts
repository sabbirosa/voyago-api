import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { NotificationService } from "./notification.service";

export const NotificationController = {
  getNotifications: catchAsync(async (req: Request, res: Response) => {
    const { notifications, meta } = await NotificationService.getNotifications(
      req.user!.userId,
      req.query as Record<string, string>
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Notifications retrieved successfully",
      data: { notifications },
      meta,
    });
  }),

  markAsRead: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const notification = await NotificationService.markAsRead(
      id,
      req.user!.userId
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Notification marked as read",
      data: { notification },
    });
  }),

  markAllAsRead: catchAsync(async (req: Request, res: Response) => {
    await NotificationService.markAllAsRead(req.user!.userId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "All notifications marked as read",
    });
  }),

  getUnreadCount: catchAsync(async (req: Request, res: Response) => {
    const count = await NotificationService.getUnreadCount(req.user!.userId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Unread count retrieved successfully",
      data: { count },
    });
  }),
};


