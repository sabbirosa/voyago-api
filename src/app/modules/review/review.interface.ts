export interface ICreateReviewPayload {
  bookingId: string;
  rating: number; // 1-5
  title?: string;
  comment?: string;
}

export interface IReviewResponse {
  id: string;
  bookingId: string;
  listingId: string;
  touristId: string;
  rating: number;
  title: string | null;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
  tourist?: {
    id: string;
    name: string;
    profile?: {
      avatarUrl: string | null;
    };
  };
  listing?: {
    id: string;
    title: string;
  };
}

