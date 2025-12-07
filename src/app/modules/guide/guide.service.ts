import { IGuideAnalytics, IGuideBadge } from "./guide.interface";
import { prisma } from "../../config/prisma";

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
}

