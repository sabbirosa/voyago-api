export interface IGuideAnalytics {
  totalBookings: number;
  totalRevenue: number;
  averageRating: number;
  totalReviews: number;
  upcomingBookings: number;
  completedBookings: number;
  pendingBookings: number;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    bookings: number;
  }>;
}

export interface IGuideBadge {
  id: string;
  badgeType: string;
  earnedAt: Date;
}

export interface IGuideStatsResponse {
  success: boolean;
  data: IGuideAnalytics;
}

export interface IGuideBadgesResponse {
  success: boolean;
  data: IGuideBadge[];
}

