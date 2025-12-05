export interface IAdminUserUpdatePayload {
  isBanned?: boolean;
  isApproved?: boolean;
  role?: "TOURIST" | "GUIDE" | "ADMIN";
}

export interface IAdminListingUpdatePayload {
  status?: "DRAFT" | "ACTIVE" | "INACTIVE" | "BLOCKED";
}

export interface IAdminAnalyticsResponse {
  totalUsers: number;
  totalGuides: number;
  totalTourists: number;
  totalListings: number;
  totalBookings: number;
  totalRevenue: number;
  platformFees: number;
  bookingsByStatus: Record<string, number>;
  bookingsByMonth: Array<{ month: string; count: number; revenue: number }>;
  topCities: Array<{ city: string; country: string; count: number }>;
  topGuides: Array<{ guideId: string; guideName: string; bookings: number; revenue: number }>;
  popularCategories: Array<{ category: string; count: number }>;
}


