export interface IWishlistItem {
  id: string;
  userId: string;
  listingId: string;
  createdAt: Date;
  listing?: {
    id: string;
    title: string;
    city: string;
    country: string;
    category: string;
    tourFee: number;
    avgRating: number;
    images?: Array<{ url: string }>;
  };
}

export interface IWishlistResponse {
  success: boolean;
  data: IWishlistItem[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

