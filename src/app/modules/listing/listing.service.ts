import httpStatus from "http-status";
import { prisma } from "../../config/prisma";
import { AppError } from "../../errorHelpers/AppError";
import { QueryBuilder } from "../../utils/QueryBuilder";
import {
  ICreateListingPayload,
  IListingResponse,
  IUpdateListingPayload,
} from "./listing.interface";

export const ListingService = {
  async createListing(
    guideId: string,
    payload: ICreateListingPayload
  ): Promise<IListingResponse> {
    // Verify user is a guide
    const user = await prisma.user.findUnique({
      where: { id: guideId },
    });

    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    if (user.role !== "GUIDE") {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "Only guides can create listings"
      );
    }

    // Create listing with images
    const listing = await prisma.listing.create({
      data: {
        guideId,
        title: payload.title,
        description: payload.description,
        itinerary: payload.itinerary,
        city: payload.city,
        country: payload.country,
        category: payload.category,
        languages: payload.languages,
        tourFee: payload.tourFee,
        feeType: payload.feeType || "PER_PERSON",
        duration: payload.duration,
        meetingPoint: payload.meetingPoint,
        meetingLat: payload.meetingLat,
        meetingLng: payload.meetingLng,
        maxGroupSize: payload.maxGroupSize,
        status: payload.status || "DRAFT",
        images: {
          create: (payload.images || []).map((url, index) => ({
            url,
            order: index,
          })),
        },
      },
      include: {
        images: {
          orderBy: { order: "asc" },
        },
      },
    });

    return this.mapListingToResponse(listing);
  },

  async getListingById(listingId: string): Promise<IListingResponse> {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        images: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!listing) {
      throw new AppError(httpStatus.NOT_FOUND, "Listing not found");
    }

    return this.mapListingToResponse(listing);
  },

  async getListings(query: Record<string, string>): Promise<{
    listings: IListingResponse[];
    meta: { page: number; limit: number; totalPage: number; total: number };
  }> {
    // Build default filters
    const defaultFilters: any = {
      deletedAt: null, // Only non-deleted listings
    };

    // Filter by status (default to ACTIVE for public, but allow all for guides/admins)
    if (query.status) {
      defaultFilters.status = query.status;
    } else if (!query.guideId) {
      // Public listings default to ACTIVE
      defaultFilters.status = "ACTIVE";
    }

    // Use QueryBuilder for consistent query handling
    const queryBuilder = new QueryBuilder(prisma.listing, query)
      .filter(defaultFilters)
      .search(["title", "description", "city"])
      .sort({ createdAt: "desc" })
      .paginate()
      .includeRelations({
        images: {
          orderBy: { order: "asc" },
        },
      });

    // Get listings and metadata
    const [listings, meta] = await Promise.all([
      queryBuilder.build(),
      queryBuilder.getMeta(),
    ]);

    return {
      listings: listings.map((listing) => this.mapListingToResponse(listing)),
      meta,
    };
  },

  async updateListing(
    listingId: string,
    userId: string,
    userRole: string,
    payload: IUpdateListingPayload
  ): Promise<IListingResponse> {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { images: true },
    });

    if (!listing) {
      throw new AppError(httpStatus.NOT_FOUND, "Listing not found");
    }

    // Check permissions: guide can only update their own listings, admin can update any
    if (userRole !== "ADMIN" && listing.guideId !== userId) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You can only update your own listings"
      );
    }

    // If images are provided, replace all existing images
    if (payload.images !== undefined) {
      // Delete existing images
      await prisma.listingImage.deleteMany({
        where: { listingId },
      });
    }

    // Update listing
    const updated = await prisma.listing.update({
      where: { id: listingId },
      data: {
        title: payload.title,
        description: payload.description,
        itinerary: payload.itinerary,
        city: payload.city,
        country: payload.country,
        category: payload.category,
        languages: payload.languages,
        tourFee: payload.tourFee,
        feeType: payload.feeType,
        duration: payload.duration,
        meetingPoint: payload.meetingPoint,
        meetingLat: payload.meetingLat,
        meetingLng: payload.meetingLng,
        maxGroupSize: payload.maxGroupSize,
        status: payload.status,
        ...(payload.images && {
          images: {
            create: payload.images.map((url, index) => ({
              url,
              order: index,
            })),
          },
        }),
      },
      include: {
        images: {
          orderBy: { order: "asc" },
        },
      },
    });

    return this.mapListingToResponse(updated);
  },

  async deleteListing(
    listingId: string,
    userId: string,
    userRole: string
  ): Promise<void> {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new AppError(httpStatus.NOT_FOUND, "Listing not found");
    }

    // Check permissions: guide can only delete their own listings, admin can delete any
    if (userRole !== "ADMIN" && listing.guideId !== userId) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You can only delete your own listings"
      );
    }

    // Soft delete
    await prisma.listing.update({
      where: { id: listingId },
      data: { deletedAt: new Date() },
    });
  },

  // Helper method to map Prisma listing to response format
  mapListingToResponse(listing: any): IListingResponse {
    return {
      id: listing.id,
      guideId: listing.guideId,
      title: listing.title,
      description: listing.description,
      itinerary: listing.itinerary,
      city: listing.city,
      country: listing.country,
      category: listing.category,
      languages: listing.languages,
      tourFee: listing.tourFee,
      feeType: listing.feeType,
      duration: listing.duration,
      meetingPoint: listing.meetingPoint,
      meetingLat: listing.meetingLat,
      meetingLng: listing.meetingLng,
      maxGroupSize: listing.maxGroupSize,
      status: listing.status,
      avgRating: listing.avgRating,
      totalReviews: listing.totalReviews,
      images: listing.images.map((img: any) => ({
        id: img.id,
        listingId: img.listingId,
        url: img.url,
        order: img.order,
        createdAt: img.createdAt,
      })),
      createdAt: listing.createdAt,
      updatedAt: listing.updatedAt,
    };
  },
};
