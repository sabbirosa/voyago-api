import httpStatus from "http-status";
import { prisma } from "../../config/prisma";
import { AppError } from "../../errorHelpers/AppError";
import { QueryBuilder } from "../../utils/QueryBuilder";
import {
  ICreateReviewPayload,
  IReviewResponse,
} from "./review.interface";

export const ReviewService = {
  async createReview(
    touristId: string,
    payload: ICreateReviewPayload
  ): Promise<IReviewResponse> {
    // Get booking to verify it exists and belongs to tourist
    const booking = await prisma.booking.findUnique({
      where: { id: payload.bookingId },
      include: {
        listing: true,
        review: true,
      },
    });

    if (!booking) {
      throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
    }

    // Verify booking belongs to tourist
    if (booking.touristId !== touristId) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You can only review your own bookings"
      );
    }

    // Check if booking is completed
    if (booking.status !== "COMPLETED") {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "You can only review completed bookings"
      );
    }

    // Check if review already exists
    if (booking.review) {
      throw new AppError(
        httpStatus.CONFLICT,
        "You have already reviewed this booking"
      );
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        bookingId: payload.bookingId,
        listingId: booking.listingId,
        touristId,
        rating: payload.rating,
        title: payload.title,
        comment: payload.comment,
      },
      include: {
        tourist: {
          include: {
            profile: true,
          },
        },
        listing: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Update listing's average rating and total reviews
    await this.updateListingRatingStats(booking.listingId);

    return this.mapReviewToResponse(review);
  },

  async getReviewsByListing(
    listingId: string,
    query: Record<string, string>
  ): Promise<{
    reviews: IReviewResponse[];
    meta: { page: number; limit: number; totalPage: number; total: number };
  }> {
    // Verify listing exists
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new AppError(httpStatus.NOT_FOUND, "Listing not found");
    }

    // Use QueryBuilder for consistent query handling
    const queryBuilder = new QueryBuilder(prisma.review, query)
      .filter({ listingId })
      .sort({ createdAt: "desc" })
      .paginate()
      .includeRelations({
        tourist: {
          include: {
            profile: true,
          },
        },
        listing: {
          select: {
            id: true,
            title: true,
          },
        },
      });

    const [reviews, meta] = await Promise.all([
      queryBuilder.build(),
      queryBuilder.getMeta(),
    ]);

    return {
      reviews: reviews.map((review) => this.mapReviewToResponse(review)),
      meta,
    };
  },

  async updateListingRatingStats(listingId: string): Promise<void> {
    // Calculate average rating and total reviews
    const stats = await prisma.review.aggregate({
      where: { listingId },
      _avg: {
        rating: true,
      },
      _count: {
        id: true,
      },
    });

    const avgRating = stats._avg.rating || 0;
    const totalReviews = stats._count.id || 0;

    // Update listing
    await prisma.listing.update({
      where: { id: listingId },
      data: {
        avgRating: Math.round(avgRating * 10) / 10, // Round to 1 decimal place
        totalReviews,
      },
    });
  },

  // Helper method to map Prisma review to response format
  mapReviewToResponse(review: any): IReviewResponse {
    return {
      id: review.id,
      bookingId: review.bookingId,
      listingId: review.listingId,
      touristId: review.touristId,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      tourist: review.tourist
        ? {
            id: review.tourist.id,
            name: review.tourist.name,
            profile: review.tourist.profile
              ? {
                  avatarUrl: review.tourist.profile.avatarUrl,
                }
              : undefined,
          }
        : undefined,
      listing: review.listing
        ? {
            id: review.listing.id,
            title: review.listing.title,
          }
        : undefined,
    };
  },
};

