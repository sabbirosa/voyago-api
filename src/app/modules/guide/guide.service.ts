import { IGuideAnalytics, IGuideBadge } from "./guide.interface";
import { prisma } from "../../config/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { excludeField } from "../../constants";

export class GuideService {
  async getGuideAnalytics(guideId: string): Promise<IGuideAnalytics> {
    const now = new Date();

    // Get all bookings for this guide
    const bookings = await prisma.booking.findMany({
      where: { guideId },
      include: {
        payment: true,
        review: true,
      },
    });

    // Calculate stats
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(
      (b) => b.status === "COMPLETED"
    ).length;
    const pendingBookings = bookings.filter((b) => b.status === "PENDING").length;
    const upcomingBookings = bookings.filter(
      (b) => (b.status === "ACCEPTED" || b.status === "PAID") && b.date >= now
    ).length;

    // Calculate revenue from successful payments
    const successfulPayments = bookings
      .filter((b) => b.payment?.status === "SUCCEEDED")
      .map((b) => b.payment!.amount);

    const totalRevenue = successfulPayments.reduce((sum, amount) => sum + amount, 0);

    // Calculate average rating
    const reviews = bookings.filter((b) => b.review).map((b) => b.review!.rating);
    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, rating) => sum + rating, 0) / reviews.length
        : 0;

    // Monthly revenue (last 6 months)
    const monthlyRevenue: Array<{ month: string; revenue: number; bookings: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthBookings = bookings.filter(
        (b) =>
          b.date >= monthDate &&
          b.date <= monthEnd &&
          b.payment?.status === "SUCCEEDED"
      );

      const monthRevenue = monthBookings.reduce(
        (sum, b) => sum + (b.payment?.amount || 0),
        0
      );

      monthlyRevenue.push({
        month: monthDate.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        revenue: monthRevenue,
        bookings: monthBookings.length,
      });
    }

    return {
      totalBookings,
      totalRevenue,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
      upcomingBookings,
      completedBookings,
      pendingBookings,
      monthlyRevenue,
    };
  }

  async getGuideBadges(guideId: string): Promise<IGuideBadge[]> {
    const badges = await prisma.userBadge.findMany({
      where: { userId: guideId },
      orderBy: { earnedAt: "desc" },
    });

    return badges.map((badge) => ({
      id: badge.id,
      badgeType: badge.badgeType,
      earnedAt: badge.earnedAt,
    }));
  }

  async assignBadge(userId: string, badgeType: string): Promise<void> {
    // Check if badge already exists
    const existing = await prisma.userBadge.findUnique({
      where: {
        userId_badgeType: {
          userId,
          badgeType: badgeType as any,
        },
      },
    });

    if (!existing) {
      await prisma.userBadge.create({
        data: {
          userId,
          badgeType: badgeType as any,
        },
      });
    }
  }

  async checkAndAssignBadges(guideId: string): Promise<void> {
    const analytics = await this.getGuideAnalytics(guideId);

    // Assign badges based on criteria
    if (analytics.totalBookings >= 50 && analytics.averageRating >= 4.5) {
      await this.assignBadge(guideId, "SUPER_GUIDE");
    }

    if (analytics.totalBookings < 10) {
      await this.assignBadge(guideId, "NEWCOMER");
    }

    if (analytics.averageRating >= 4.8 && analytics.totalReviews >= 20) {
      await this.assignBadge(guideId, "TOP_RATED");
    }

    if (analytics.totalBookings >= 100) {
      await this.assignBadge(guideId, "POPULAR");
    }
  }

  async getPublicGuideProfile(guideId: string) {
    const guide = await prisma.user.findUnique({
      where: { id: guideId, role: "GUIDE" },
      include: {
        profile: true,
        guideProfile: true,
        listings: {
          where: {
            status: "ACTIVE",
            deletedAt: null,
          },
          include: {
            images: {
              orderBy: { order: "asc" },
              take: 1,
            },
            reviews: {
              take: 5,
              orderBy: { createdAt: "desc" },
              include: {
                tourist: {
                  include: {
                    profile: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        bookingsAsGuide: {
          where: {
            status: "COMPLETED",
          },
          include: {
            review: true,
          },
        },
      },
    });

    if (!guide) {
      throw new Error("Guide not found");
    }

    // Calculate average rating from reviews
    const reviews = guide.bookingsAsGuide
      .filter((b) => b.review)
      .map((b) => b.review!.rating);
    const averageRating =
      reviews.length > 0
        ? reviews.reduce((sum, rating) => sum + rating, 0) / reviews.length
        : 0;

    // Count total reviews
    const totalReviews = reviews.length;

    // Get total bookings count
    const totalBookings = await prisma.booking.count({
      where: { guideId },
    });

    return {
      id: guide.id,
      name: guide.name,
      profile: guide.profile,
      guideProfile: guide.guideProfile,
      listings: guide.listings.map((listing) => ({
        id: listing.id,
        title: listing.title,
        city: listing.city,
        country: listing.country,
        category: listing.category,
        tourFee: listing.tourFee,
        feeType: listing.feeType,
        duration: listing.duration,
        avgRating: listing.avgRating,
        totalReviews: listing.totalReviews,
        image: listing.images[0]?.url || null,
      })),
      stats: {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews,
        totalBookings,
        totalListings: guide.listings.length,
      },
    };
  }

  async getGuides(query: Record<string, string>) {
    const baseFilter: any = {
      role: "GUIDE",
      isApproved: true,
      isBanned: false,
    };

    // Filter query to only include valid User model fields
    // Valid User fields that can be filtered: id, name, email, role
    // Note: isApproved and isBanned are set in baseFilter and shouldn't be overridden
    const validUserFields = ["id", "name", "email", "role"];
    const filteredQuery: Record<string, string> = {};
    
    // Include both valid User fields AND reserved fields
    // Reserved fields (page, limit, search, etc.) are needed by QueryBuilder for pagination/search
    // Valid User fields can be used as filters
    for (const [key, value] of Object.entries(query)) {
      if (validUserFields.includes(key) || excludeField.includes(key)) {
        filteredQuery[key] = value;
      }
    }

    try {
      // Use QueryBuilder for consistent query handling
      // Pass filteredQuery which only contains valid User fields + reserved fields
      const queryBuilder = new QueryBuilder(prisma.user, filteredQuery)
        .filter(baseFilter)
        .search(["name", "email"])
        .sort({ createdAt: "desc" })
        .paginate()
        .includeRelations({
          profile: true,
          guideProfile: true,
          listings: {
            where: {
              status: "ACTIVE",
              deletedAt: null,
            },
            include: {
              images: {
                orderBy: { order: "asc" },
                take: 1,
              },
            },
            take: 3,
          },
          bookingsAsGuide: {
            where: {
              status: "COMPLETED",
            },
            include: {
              review: true,
            },
          },
        });

      const [users, meta] = await Promise.all([
        queryBuilder.build(),
        queryBuilder.getMeta(),
      ]);

      // Calculate stats for each guide
      const guides = await Promise.all(
        users.map(async (guide: any) => {
          const reviews = guide.bookingsAsGuide
            .filter((b: any) => b.review)
            .map((b: any) => b.review.rating);
          const averageRating =
            reviews.length > 0
              ? reviews.reduce((sum: number, rating: number) => sum + rating, 0) / reviews.length
              : 0;

          const totalBookings = await prisma.booking.count({
            where: { guideId: guide.id },
          });

          return {
            id: guide.id,
            name: guide.name,
            profile: guide.profile,
            guideProfile: guide.guideProfile,
            listings: guide.listings.map((listing: any) => ({
              id: listing.id,
              title: listing.title,
              city: listing.city,
              country: listing.country,
              image: listing.images[0]?.url || null,
            })),
            stats: {
              averageRating: Math.round(averageRating * 10) / 10,
              totalReviews: reviews.length,
              totalBookings,
              totalListings: guide.listings.length,
            },
          };
        })
      );

      return {
        guides,
        meta,
      };
    } catch (error: any) {
      console.error("[GuideService.getGuides] Error:", error);
      throw error;
    }
  }
}

