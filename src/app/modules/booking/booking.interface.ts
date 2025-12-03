export enum BookingStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  DECLINED = "DECLINED",
  PAID = "PAID",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export interface ICreateBookingPayload {
  listingId: string;
  date: string; // ISO date string
  groupSize: number;
  note?: string;
}

export interface IUpdateBookingStatusPayload {
  status: BookingStatus;
  reason?: string;
}

export interface IBookingResponse {
  id: string;
  listingId: string;
  touristId: string;
  guideId: string;
  date: Date;
  groupSize: number;
  totalPrice: number;
  platformFee: number;
  note: string | null;
  status: BookingStatus;
  cancelledAt: Date | null;
  cancelReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  listing?: {
    id: string;
    title: string;
    city: string;
    country: string;
    images: Array<{ url: string; order: number }>;
  };
  tourist?: {
    id: string;
    name: string;
    email: string;
    profile?: {
      avatarUrl: string | null;
    };
  };
  guide?: {
    id: string;
    name: string;
    email: string;
    profile?: {
      avatarUrl: string | null;
    };
  };
  payment?: {
    id: string;
    amount: number;
    currency: string;
    status: string;
    paidAt: Date | null;
  };
  review?: {
    id: string;
    rating: number;
    title: string | null;
    comment: string | null;
  };
}

