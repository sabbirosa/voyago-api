import httpStatus from "http-status";
import { prisma } from "../../config/prisma";
import { AppError } from "../../errorHelpers/AppError";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { NotificationService } from "../notification/notification.service";
import { NotificationType } from "../notification/notification.interface";
import {
  IAdminAnalyticsResponse,
  IAdminListingUpdatePayload,
  IAdminUserUpdatePayload,
} from "./admin.interface";

export const AdminService = {
  async getUsers(query: Record<string, string>): Promise<{
    users: any[];
    meta: { page: number; limit: number; totalPage: number; total: number };
  }> {
    const baseFilter: any = {};

    if (query.role) {
      baseFilter.role = query.role;
    }

    if (query.isBanned !== undefined) {
      baseFilter.isBanned = query.isBanned === "true";
    }

    if (query.isApproved !== undefined) {
      baseFilter.isApproved = query.isApproved === "true";
    }

    const queryBuilder = new QueryBuilder(prisma.user, query)
      .filter(baseFilter)
      .search(["name", "email"])
      .sort({ createdAt: "desc" })
      .paginate()
      .includeRelations({
        profile: true,
        guideProfile: true,
      });

    const [users, meta] = await Promise.all([
      queryBuilder.build(),
      queryBuilder.getMeta(),
    ]);

    // Remove sensitive data
    const sanitizedUsers = users.map((user: any) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
      isBanned: user.isBanned,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      profile: user.profile,
      guideProfile: user.guideProfile,
    }));

    return {
      users: sanitizedUsers,
      meta,
    };
  },

  async updateUser(
    userId: string,
    payload: IAdminUserUpdatePayload
  ): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    const updateData: any = {};

    if (payload.isBanned !== undefined) {
      updateData.isBanned = payload.isBanned;
      // Send notification
      await NotificationService.createNotification({
        userId,
        type: payload.isBanned
          ? NotificationType.ACCOUNT_BANNED
          : NotificationType.ACCOUNT_UNBANNED,
        title: payload.isBanned ? "Account Banned" : "Account Unbanned",
        message: payload.isBanned
          ? "Your account has been banned. Please contact support for more information."
          : "Your account has been unbanned. You can now use the platform again.",
      });
    }

    if (payload.isApproved !== undefined) {
      updateData.isApproved = payload.isApproved;
    }

    if (payload.role !== undefined) {
      updateData.role = payload.role;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        profile: true,
        guideProfile: true,
      },
    });

    // Remove password
    const { password, ...userWithoutPassword } = updated;
    return userWithoutPassword;
  },

  async getListings(query: Record<string, string>): Promise<{
    listings: any[];
    meta: { page: number; limit: number; totalPage: number; total: number };
  }> {
    const baseFilter: any = {
      deletedAt: null,
    };

    if (query.status) {
      baseFilter.status = query.status;
    }

    if (query.guideId) {
      baseFilter.guideId = query.guideId;
    }

    const queryBuilder = new QueryBuilder(prisma.listing, query)
      .filter(baseFilter)
      .search(["title", "description", "city"])
      .sort({ createdAt: "desc" })
      .paginate()
      .includeRelations({
        guide: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        images: {
          orderBy: { order: "asc" },
          take: 1,
        },
      });

    const [listings, meta] = await Promise.all([
      queryBuilder.build(),
      queryBuilder.getMeta(),
    ]);

    return {
      listings,
      meta,
    };
  },

  async updateListing(
    listingId: string,
    payload: IAdminListingUpdatePayload
  ): Promise<any> {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { guide: true },
    });

    if (!listing) {
      throw new AppError(httpStatus.NOT_FOUND, "Listing not found");
    }

    const updateData: any = {};

    if (payload.status !== undefined) {
      updateData.status = payload.status;
      // Send notification to guide
      if (payload.status === "ACTIVE" && listing.status !== "ACTIVE") {
        await NotificationService.createNotification({
          userId: listing.guideId,
          type: NotificationType.LISTING_APPROVED,
          title: "Listing Approved",
          message: `Your listing "${listing.title}" has been approved and is now active.`,
          dataJson: { listingId: listing.id },
        });
      } else if (payload.status === "BLOCKED" && listing.status !== "BLOCKED") {
        await NotificationService.createNotification({
          userId: listing.guideId,
          type: NotificationType.LISTING_REJECTED,
          title: "Listing Blocked",
          message: `Your listing "${listing.title}" has been blocked. Please contact support for more information.`,
          dataJson: { listingId: listing.id },
        });
      }
    }

    const updated = await prisma.listing.update({
      where: { id: listingId },
      data: updateData,
      include: {
        guide: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        images: {
          orderBy: { order: "asc" },
        },
      },
    });

    return updated;
  },

  async getAnalytics(): Promise<IAdminAnalyticsResponse> {
    // Get total counts
    const [totalUsers, totalGuides, totalTourists, totalListings, totalBookings] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: "GUIDE" } }),
        prisma.user.count({ where: { role: "TOURIST" } }),
        prisma.listing.count({ where: { deletedAt: null } }),
        prisma.booking.count(),
      ]);

    // Get revenue stats
    const payments = await prisma.payment.findMany({
      where: { status: "SUCCEEDED" },
      include: { booking: true },
    });

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
    const platformFees = payments.reduce((sum, p) => sum + (p.booking.platformFee || 0), 0);

    // Bookings by status
    const bookingsByStatusRaw = await prisma.booking.groupBy({
      by: ["status"],
      _count: { id: true },
    });

    const bookingsByStatus: Record<string, number> = {};
    bookingsByStatusRaw.forEach((item) => {
      bookingsByStatus[item.status] = item._count.id;
    });

    // Bookings by month (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const bookingsByMonthRaw = await prisma.booking.findMany({
      where: {
        createdAt: { gte: twelveMonthsAgo },
      },
      include: {
        payment: true,
      },
    });

    const monthlyData: Record<string, { count: number; revenue: number }> = {};
    bookingsByMonthRaw.forEach((booking) => {
      const month = new Date(booking.createdAt).toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { count: 0, revenue: 0 };
      }
      monthlyData[month].count++;
      if (booking.payment?.status === "SUCCEEDED") {
        monthlyData[month].revenue += booking.payment.amount;
      }
    });

    const bookingsByMonth = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        count: data.count,
        revenue: data.revenue,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Top cities
    const topCitiesRaw = await prisma.listing.groupBy({
      by: ["city", "country"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    });

    const topCities = topCitiesRaw.map((item) => ({
      city: item.city,
      country: item.country,
      count: item._count.id,
    }));

    // Top guides
    const topGuidesRaw = await prisma.booking.groupBy({
      by: ["guideId"],
      _count: { id: true },
      where: {
        payment: {
          status: "SUCCEEDED",
        },
      },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    });

    const guideIds = topGuidesRaw.map((item) => item.guideId);
    const guides = await prisma.user.findMany({
      where: { id: { in: guideIds } },
      select: { id: true, name: true },
    });

    const guideMap = new Map(guides.map((g) => [g.id, g.name]));

    const topGuides = await Promise.all(
      topGuidesRaw.map(async (item) => {
        const guidePayments = await prisma.payment.findMany({
          where: {
            booking: { guideId: item.guideId },
            status: "SUCCEEDED",
          },
          include: { booking: true },
        });

        const revenue = guidePayments.reduce((sum, p) => sum + p.amount, 0);

        return {
          guideId: item.guideId,
          guideName: guideMap.get(item.guideId) || "Unknown",
          bookings: item._count.id,
          revenue,
        };
      })
    );

    // Popular categories
    const popularCategoriesRaw = await prisma.listing.groupBy({
      by: ["category"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    });

    const popularCategories = popularCategoriesRaw.map((item) => ({
      category: item.category,
      count: item._count.id,
    }));

    return {
      totalUsers,
      totalGuides,
      totalTourists,
      totalListings,
      totalBookings,
      totalRevenue,
      platformFees,
      bookingsByStatus,
      bookingsByMonth,
      topCities,
      topGuides,
      popularCategories,
    };
  },

  async getBookings(query: Record<string, string>): Promise<{
    bookings: any[];
    meta: { page: number; limit: number; totalPage: number; total: number };
  }> {
    const baseFilter: any = {};

    if (query.status) {
      baseFilter.status = query.status;
    }

    if (query.touristId) {
      baseFilter.touristId = query.touristId;
    }

    if (query.guideId) {
      baseFilter.guideId = query.guideId;
    }

    if (query.listingId) {
      baseFilter.listingId = query.listingId;
    }

    // Handle date range filters
    if (query.dateFrom) {
      baseFilter.date = { ...baseFilter.date, gte: new Date(query.dateFrom) };
    }

    if (query.dateTo) {
      baseFilter.date = { ...baseFilter.date, lte: new Date(query.dateTo) };
    }

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
            guideProfile: true,
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
      bookings,
      meta,
    };
  },
};


