import httpStatus from "http-status";
import { prisma } from "../../config/prisma";
import { AppError } from "../../errorHelpers/AppError";
import { QueryBuilder } from "../../utils/QueryBuilder";
import {
  ICreateMessagePayload,
  IMessageResponse,
} from "./message.interface";

export const MessageService = {
  async createMessage(
    userId: string,
    payload: ICreateMessagePayload
  ): Promise<IMessageResponse> {
    // Get booking to verify it exists and user has access
    const booking = await prisma.booking.findUnique({
      where: { id: payload.bookingId },
    });

    if (!booking) {
      throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
    }

    // Verify user is either tourist or guide for this booking
    if (booking.touristId !== userId && booking.guideId !== userId) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You can only send messages for your own bookings"
      );
    }

    // Determine recipient (if sender is tourist, recipient is guide, and vice versa)
    const toUserId = booking.touristId === userId ? booking.guideId : booking.touristId;

    // Create message
    const message = await prisma.message.create({
      data: {
        bookingId: payload.bookingId,
        fromUserId: userId,
        toUserId,
        body: payload.body,
      },
      include: {
        fromUser: {
          include: {
            profile: true,
          },
        },
        toUser: {
          include: {
            profile: true,
          },
        },
      },
    });

    return this.mapMessageToResponse(message);
  },

  async getMessagesByBooking(
    bookingId: string,
    userId: string
  ): Promise<{
    messages: IMessageResponse[];
    meta: { page: number; limit: number; totalPage: number; total: number };
  }> {
    // Get booking to verify access
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
    }

    // Verify user is either tourist or guide for this booking
    if (booking.touristId !== userId && booking.guideId !== userId) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You can only view messages for your own bookings"
      );
    }

    // Use QueryBuilder for consistent query handling
    const queryBuilder = new QueryBuilder(prisma.message, {})
      .filter({ bookingId })
      .sort({ createdAt: "asc" }) // Oldest first for chat
      .paginate({ page: 1, limit: 100 }) // Get all messages (or use pagination if needed)
      .includeRelations({
        fromUser: {
          include: {
            profile: true,
          },
        },
        toUser: {
          include: {
            profile: true,
          },
        },
      });

    const [messages, meta] = await Promise.all([
      queryBuilder.build(),
      queryBuilder.getMeta(),
    ]);

    return {
      messages: messages.map((message) => this.mapMessageToResponse(message)),
      meta,
    };
  },

  async markMessagesAsRead(
    bookingId: string,
    userId: string
  ): Promise<void> {
    // Get booking to verify access
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
    }

    // Verify user is either tourist or guide for this booking
    if (booking.touristId !== userId && booking.guideId !== userId) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You can only mark messages as read for your own bookings"
      );
    }

    // Mark all unread messages sent to this user as read
    await prisma.message.updateMany({
      where: {
        bookingId,
        toUserId: userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });
  },

  // Helper method to map Prisma message to response format
  mapMessageToResponse(message: any): IMessageResponse {
    return {
      id: message.id,
      bookingId: message.bookingId,
      fromUserId: message.fromUserId,
      toUserId: message.toUserId,
      body: message.body,
      readAt: message.readAt,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      fromUser: message.fromUser
        ? {
            id: message.fromUser.id,
            name: message.fromUser.name,
            profile: message.fromUser.profile
              ? {
                  avatarUrl: message.fromUser.profile.avatarUrl,
                }
              : undefined,
          }
        : undefined,
      toUser: message.toUser
        ? {
            id: message.toUser.id,
            name: message.toUser.name,
            profile: message.toUser.profile
              ? {
                  avatarUrl: message.toUser.profile.avatarUrl,
                }
              : undefined,
          }
        : undefined,
    };
  },
};

