import httpStatus from "http-status";
import { prisma } from "../../config/prisma";
import { AppError } from "../../errorHelpers/AppError";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { sendNotificationEmail } from "../../utils/notificationEmail";
import {
  CreateNotificationPayload,
  INotificationResponse,
  NotificationType,
} from "./notification.interface";

export const NotificationService = {
  async createNotification(
    payload: CreateNotificationPayload
  ): Promise<INotificationResponse> {
    // Create notification
    const notification = await prisma.notification.create({
      data: {
        userId: payload.userId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        dataJson: payload.dataJson ? JSON.stringify(payload.dataJson) : null,
      },
    });

    // Send email notification (non-blocking)
    sendNotificationEmail(payload).catch((error) => {
      console.error("[Notification] Failed to send email:", error);
    });

    return this.mapNotificationToResponse(notification);
  },

  async createNotificationsForUsers(
    userIds: string[],
    payload: Omit<CreateNotificationPayload, "userId">
  ): Promise<void> {
    // Create notifications for multiple users
    const notifications = userIds.map((userId) => ({
      userId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      dataJson: payload.dataJson ? JSON.stringify(payload.dataJson) : null,
    }));

    await prisma.notification.createMany({
      data: notifications,
    });

    // Send email notifications (non-blocking)
    userIds.forEach((userId) => {
      sendNotificationEmail({ ...payload, userId }).catch((error) => {
        console.error(`[Notification] Failed to send email to user ${userId}:`, error);
      });
    });
  },

  async getNotifications(
    userId: string,
    query: Record<string, string>
  ): Promise<{
    notifications: INotificationResponse[];
    meta: { page: number; limit: number; totalPage: number; total: number };
  }> {
    const baseFilter: any = { userId };

    // Filter by read status if provided
    if (query.read === "true") {
      baseFilter.readAt = { not: null };
    } else if (query.read === "false") {
      baseFilter.readAt = null;
    }

    // Use QueryBuilder for consistent query handling
    const queryBuilder = new QueryBuilder(prisma.notification, query)
      .filter(baseFilter)
      .sort({ createdAt: "desc" })
      .paginate();

    const [notifications, meta] = await Promise.all([
      queryBuilder.build(),
      queryBuilder.getMeta(),
    ]);

    return {
      notifications: notifications.map((notification) =>
        this.mapNotificationToResponse(notification)
      ),
      meta,
    };
  },

  async markAsRead(
    notificationId: string,
    userId: string
  ): Promise<INotificationResponse> {
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new AppError(httpStatus.NOT_FOUND, "Notification not found");
    }

    if (notification.userId !== userId) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You can only mark your own notifications as read"
      );
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });

    return this.mapNotificationToResponse(updated);
  },

  async markAllAsRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: {
        userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });
  },

  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
        readAt: null,
      },
    });
  },

  // Helper method to map Prisma notification to response format
  mapNotificationToResponse(notification: any): INotificationResponse {
    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type as NotificationType,
      title: notification.title,
      message: notification.message,
      dataJson: notification.dataJson,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    };
  },
};


