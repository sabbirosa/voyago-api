import httpStatus from "http-status";
import { prisma } from "../../config/prisma";
import { AppError } from "../../errorHelpers/AppError";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { NotificationType } from "../notification/notification.interface";
import { NotificationService } from "../notification/notification.service";
import {
  BookingStatus,
  IBookingResponse,
  ICreateBookingPayload,
  IUpdateBookingStatusPayload,
} from "./booking.interface";

const PLATFORM_FEE_PERCENTAGE = 0.1; // 10% platform fee

export const BookingService = {
  async createBooking(
    touristId: string,
    payload: ICreateBookingPayload
  ): Promise<IBookingResponse> {
    // Verify listing exists and is active
    const listing = await prisma.listing.findUnique({
      where: { id: payload.listingId },
      include: { guide: true },
    });

    if (!listing) {
      throw new AppError(httpStatus.NOT_FOUND, "Listing not found");
    }

    if (listing.status !== "ACTIVE") {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Listing is not available for booking"
      );
    }

    // Check that tourist is not booking their own listing
    if (listing.guideId === touristId) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "You cannot book your own listing"
      );
    }

    // Validate date is in the future
    const bookingDate = new Date(payload.date);
    const now = new Date();
    if (bookingDate <= now) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Booking date must be in the future"
      );
    }

    // Validate group size
    if (payload.groupSize < 1) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Group size must be at least 1"
      );
    }

    if (payload.groupSize > listing.maxGroupSize) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        `Group size cannot exceed ${listing.maxGroupSize}`
      );
    }

    // Calculate total price
    const basePrice =
      listing.feeType === "PER_PERSON"
        ? listing.tourFee * payload.groupSize
        : listing.tourFee;
    const platformFee = basePrice * PLATFORM_FEE_PERCENTAGE;
    const totalPrice = basePrice + platformFee;

    // Check for duplicate booking (same listing, same date, same tourist)
    const existingBooking = await prisma.booking.findFirst({
      where: {
        listingId: payload.listingId,
        touristId,
        date: bookingDate,
        status: {
          in: ["PENDING", "ACCEPTED", "PAID"],
        },
      },
    });

    if (existingBooking) {
      throw new AppError(
        httpStatus.CONFLICT,
        "You already have a pending or confirmed booking for this date"
      );
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        listingId: payload.listingId,
        touristId,
        guideId: listing.guideId,
        date: bookingDate,
        groupSize: payload.groupSize,
        totalPrice,
        platformFee,
        note: payload.note,
        status: "PENDING",
      },
      include: {
        listing: {
          include: {
            images: {
              orderBy: { order: "asc" },
              take: 1,
            },
          },
        },
        tourist: {
          include: {
            profile: true,
          },
        },
        guide: {
          include: {
            profile: true,
          },
        },
      },
    });

    // Send notification to guide
    await NotificationService.createNotification({
      userId: listing.guideId,
      type: NotificationType.BOOKING_REQUESTED,
      title: "New Booking Request",
      message: `You have a new booking request for "${
        listing.title
      }" on ${bookingDate.toLocaleDateString()}.`,
      dataJson: { bookingId: booking.id, listingId: listing.id },
    }).catch((error) => {
      console.error("[Booking] Failed to send notification:", error);
    });

    return this.mapBookingToResponse(booking);
  },

  async getBookings(
    userId: string,
    userRole: string,
    query: Record<string, string>
  ): Promise<{
    bookings: IBookingResponse[];
    meta: { page: number; limit: number; totalPage: number; total: number };
  }> {
    // Build base filter based on role
    const baseFilter: any = {};
    if (userRole === "TOURIST") {
      baseFilter.touristId = userId;
    } else if (userRole === "GUIDE") {
      baseFilter.guideId = userId;
    } else if (userRole === "ADMIN") {
      // Admin can see all bookings
    } else {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "Invalid role for booking access"
      );
    }

    // Handle upcoming/past filters first (they take precedence)
    const now = new Date();
    if (query.upcoming === "true") {
      baseFilter.date = { gte: now };
      if (userRole === "TOURIST") {
        baseFilter.status = {
          in: ["PENDING", "ACCEPTED", "PAID"],
        };
      } else {
        baseFilter.status = {
          in: ["ACCEPTED", "PAID"],
        };
      }
    } else if (query.past === "true") {
      baseFilter.OR = [
        { date: { lt: now } },
        { status: { in: ["COMPLETED", "CANCELLED"] } },
      ];
    } else {
      // Only apply status filter if not using upcoming/past
      if (query.status) {
        baseFilter.status = query.status;
      }
    }

    // Use QueryBuilder for consistent query handling
    const queryBuilder = new QueryBuilder(prisma.booking, query)
      .filter(baseFilter)
      .sort({ createdAt: "desc" })
      .paginate()
      .includeRelations({
        listing: {
          include: {
            images: {
              orderBy: { order: "asc" },
              take: 1,
            },
          },
        },
        tourist: {
          include: {
            profile: true,
          },
        },
        guide: {
          include: {
            profile: true,
          },
        },
        payment: true,
        review: true,
      });

    const [bookings, meta] = await Promise.all([
      queryBuilder.build(),
      queryBuilder.getMeta(),
    ]);

    return {
      bookings: bookings.map((booking) => this.mapBookingToResponse(booking)),
      meta,
    };
  },

  async getBookingById(
    bookingId: string,
    userId: string,
    userRole: string
  ): Promise<IBookingResponse> {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        listing: {
          include: {
            images: {
              orderBy: { order: "asc" },
            },
          },
        },
        tourist: {
          include: {
            profile: true,
          },
        },
        guide: {
          include: {
            profile: true,
          },
        },
        payment: true,
        review: true,
      },
    });

    if (!booking) {
      throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
    }

    // Authorization check
    if (userRole !== "ADMIN") {
      if (userRole === "TOURIST" && booking.touristId !== userId) {
        throw new AppError(
          httpStatus.FORBIDDEN,
          "You can only view your own bookings"
        );
      }
      if (userRole === "GUIDE" && booking.guideId !== userId) {
        throw new AppError(
          httpStatus.FORBIDDEN,
          "You can only view bookings for your listings"
        );
      }
    }

    return this.mapBookingToResponse(booking);
  },

  async updateBookingStatus(
    bookingId: string,
    userId: string,
    userRole: string,
    payload: IUpdateBookingStatusPayload
  ): Promise<IBookingResponse> {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true,
        listing: true,
      },
    });

    if (!booking) {
      throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
    }

    // Authorization check
    if (userRole !== "ADMIN") {
      if (userRole === "GUIDE" && booking.guideId !== userId) {
        throw new AppError(
          httpStatus.FORBIDDEN,
          "You can only update bookings for your listings"
        );
      }
      if (userRole === "TOURIST" && booking.touristId !== userId) {
        throw new AppError(
          httpStatus.FORBIDDEN,
          "You can only update your own bookings"
        );
      }
    }

    // Validate status transitions
    const validTransitions: Record<string, Record<string, string[]> | {}> = {
      GUIDE: {
        PENDING: ["ACCEPTED", "DECLINED"],
        ACCEPTED: ["CANCELLED"],
        PAID: ["CANCELLED"],
      },
      TOURIST: {
        PENDING: ["CANCELLED"],
        ACCEPTED: ["CANCELLED"],
      },
      ADMIN: {
        // Admin can override any status
      },
    };

    const roleTransitions = validTransitions[userRole] as Record<
      string,
      string[]
    >;
    if (
      roleTransitions &&
      Object.keys(roleTransitions).length > 0 &&
      roleTransitions[booking.status]
    ) {
      if (!roleTransitions[booking.status].includes(payload.status)) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          `Invalid status transition from ${booking.status} to ${payload.status}`
        );
      }
    }

    // Special handling for cancellations
    if (payload.status === "CANCELLED") {
      if (booking.status === "PAID" && booking.payment) {
        // Refund will be handled by payment service/webhook
        // For now, just update status
      }
      if (!payload.reason && userRole !== "ADMIN") {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "Cancellation reason is required"
        );
      }
    }

    // Update booking
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: payload.status,
        cancelledAt:
          payload.status === "CANCELLED" ? new Date() : booking.cancelledAt,
        cancelReason:
          payload.status === "CANCELLED"
            ? payload.reason || booking.cancelReason
            : booking.cancelReason,
      },
      include: {
        listing: {
          include: {
            images: {
              orderBy: { order: "asc" },
              take: 1,
            },
          },
        },
        tourist: {
          include: {
            profile: true,
          },
        },
        guide: {
          include: {
            profile: true,
          },
        },
        payment: true,
        review: true,
      },
    });

    // Send notifications based on status change
    if (payload.status === "ACCEPTED" && booking.status === "PENDING") {
      await NotificationService.createNotification({
        userId: booking.touristId,
        type: NotificationType.BOOKING_ACCEPTED,
        title: "Booking Accepted!",
        message: `Your booking request for "${updated.listing.title}" has been accepted. You can now proceed with payment.`,
        dataJson: { bookingId: booking.id },
      }).catch((error) => {
        console.error("[Booking] Failed to send notification:", error);
      });
    } else if (payload.status === "DECLINED" && booking.status === "PENDING") {
      await NotificationService.createNotification({
        userId: booking.touristId,
        type: NotificationType.BOOKING_DECLINED,
        title: "Booking Declined",
        message: `Your booking request for "${updated.listing.title}" has been declined.`,
        dataJson: { bookingId: booking.id },
      }).catch((error) => {
        console.error("[Booking] Failed to send notification:", error);
      });
    } else if (payload.status === "CANCELLED") {
      const recipientId =
        userRole === "GUIDE" ? booking.touristId : booking.guideId;
      await NotificationService.createNotification({
        userId: recipientId,
        type: NotificationType.BOOKING_CANCELLED,
        title: "Booking Cancelled",
        message: `A booking for "${updated.listing.title}" has been cancelled.`,
        dataJson: { bookingId: booking.id, reason: payload.reason },
      }).catch((error) => {
        console.error("[Booking] Failed to send notification:", error);
      });
    }

    return this.mapBookingToResponse(updated);
  },

  // Helper method to map Prisma booking to response format
  mapBookingToResponse(booking: any): IBookingResponse {
    return {
      id: booking.id,
      listingId: booking.listingId,
      touristId: booking.touristId,
      guideId: booking.guideId,
      date: booking.date,
      groupSize: booking.groupSize,
      totalPrice: booking.totalPrice,
      platformFee: booking.platformFee,
      note: booking.note,
      status: booking.status as BookingStatus,
      cancelledAt: booking.cancelledAt,
      cancelReason: booking.cancelReason,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      listing: booking.listing
        ? {
            id: booking.listing.id,
            title: booking.listing.title,
            city: booking.listing.city,
            country: booking.listing.country,
            images: booking.listing.images.map((img: any) => ({
              url: img.url,
              order: img.order,
            })),
          }
        : undefined,
      tourist: booking.tourist
        ? {
            id: booking.tourist.id,
            name: booking.tourist.name,
            email: booking.tourist.email,
            profile: booking.tourist.profile
              ? {
                  avatarUrl: booking.tourist.profile.avatarUrl,
                }
              : undefined,
          }
        : undefined,
      guide: booking.guide
        ? {
            id: booking.guide.id,
            name: booking.guide.name,
            email: booking.guide.email,
            profile: booking.guide.profile
              ? {
                  avatarUrl: booking.guide.profile.avatarUrl,
                }
              : undefined,
          }
        : undefined,
      payment: booking.payment
        ? {
            id: booking.payment.id,
            amount: booking.payment.amount,
            currency: booking.payment.currency,
            status: booking.payment.status,
            paidAt: booking.payment.paidAt,
          }
        : undefined,
      review: booking.review
        ? {
            id: booking.review.id,
            rating: booking.review.rating,
            title: booking.review.title,
            comment: booking.review.comment,
          }
        : undefined,
    };
  },
};
