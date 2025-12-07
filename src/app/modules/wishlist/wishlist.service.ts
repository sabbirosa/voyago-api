import httpStatus from "http-status";
import { prisma } from "../../config/prisma";
import { AppError } from "../../errorHelpers/AppError";
import { IWishlistItem } from "./wishlist.interface";

export class WishlistService {
  async addToWishlist(
    userId: string,
    listingId: string
  ): Promise<IWishlistItem> {
    // Check if listing exists
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new AppError(httpStatus.NOT_FOUND, "Listing not found");
    }

    // Check if already in wishlist
    const existing = await prisma.wishlist.findUnique({
      where: {
        userId_listingId: {
          userId,
          listingId,
        },
      },
    });

    if (existing) {
      throw new AppError(httpStatus.BAD_REQUEST, "Listing already in wishlist");
    }

    const wishlistItem = await prisma.wishlist.create({
      data: {
        userId,
        listingId,
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
      },
    });

    return {
      id: wishlistItem.id,
      userId: wishlistItem.userId,
      listingId: wishlistItem.listingId,
      createdAt: wishlistItem.createdAt,
      listing: wishlistItem.listing
        ? {
            id: wishlistItem.listing.id,
            title: wishlistItem.listing.title,
            city: wishlistItem.listing.city,
            country: wishlistItem.listing.country,
            category: wishlistItem.listing.category,
            tourFee: wishlistItem.listing.tourFee,
            avgRating: wishlistItem.listing.avgRating,
            images: wishlistItem.listing.images.map((img) => ({
              url: img.url,
            })),
          }
        : undefined,
    };
  }

  async removeFromWishlist(userId: string, listingId: string): Promise<void> {
    const wishlistItem = await prisma.wishlist.findUnique({
      where: {
        userId_listingId: {
          userId,
          listingId,
        },
      },
    });

    if (!wishlistItem) {
      throw new AppError(httpStatus.NOT_FOUND, "Listing not in wishlist");
    }

    await prisma.wishlist.delete({
      where: {
        userId_listingId: {
          userId,
          listingId,
        },
      },
    });
  }

  async getUserWishlist(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    items: IWishlistItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.wishlist.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          listing: {
            include: {
              images: {
                orderBy: { order: "asc" },
                take: 1,
              },
            },
          },
        },
      }),
      prisma.wishlist.count({ where: { userId } }),
    ]);

    return {
      items: items.map((item) => ({
        id: item.id,
        userId: item.userId,
        listingId: item.listingId,
        createdAt: item.createdAt,
        listing: item.listing
          ? {
              id: item.listing.id,
              title: item.listing.title,
              city: item.listing.city,
              country: item.listing.country,
              category: item.listing.category,
              tourFee: item.listing.tourFee,
              avgRating: item.listing.avgRating,
              images: item.listing.images.map((img) => ({ url: img.url })),
            }
          : undefined,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async isInWishlist(userId: string, listingId: string): Promise<boolean> {
    const wishlistItem = await prisma.wishlist.findUnique({
      where: {
        userId_listingId: {
          userId,
          listingId,
        },
      },
    });

    return !!wishlistItem;
  }
}
