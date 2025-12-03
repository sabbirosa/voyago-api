export type ListingStatus = "DRAFT" | "ACTIVE" | "INACTIVE" | "BLOCKED";
export type ListingCategory =
  | "FOOD"
  | "ART"
  | "ADVENTURE"
  | "CULTURE"
  | "PHOTOGRAPHY"
  | "NIGHTLIFE"
  | "NATURE"
  | "ARCHITECTURE"
  | "SHOPPING"
  | "FAMILY"
  | "SPORTS"
  | "HISTORY";

export type FeeType = "PER_PERSON" | "PER_GROUP";

export interface IListingImage {
  id: string;
  listingId: string;
  url: string;
  order: number;
  createdAt: Date;
}

export interface IListingResponse {
  id: string;
  guideId: string;
  title: string;
  description: string;
  itinerary: string | null;
  city: string;
  country: string;
  category: ListingCategory;
  languages: string[];
  tourFee: number;
  feeType: FeeType;
  duration: number;
  meetingPoint: string | null;
  meetingLat: number | null;
  meetingLng: number | null;
  maxGroupSize: number;
  status: ListingStatus;
  avgRating: number;
  totalReviews: number;
  images: IListingImage[];
  createdAt: Date;
  updatedAt: Date;
  guide?: {
    id: string;
    name: string;
    email: string;
    profile?: {
      avatarUrl: string | null;
      bio: string | null;
      languages: string[];
      city: string | null;
      country: string | null;
    };
    guideProfile?: {
      expertise: string[];
      dailyRate: number | null;
      experienceYears: number | null;
      verificationStatus: string;
    };
  };
  reviews?: Array<{
    id: string;
    rating: number;
    title: string | null;
    comment: string | null;
    createdAt: Date;
    tourist: {
      id: string;
      name: string;
      profile?: {
        avatarUrl: string | null;
      };
    };
  }>;
}

export interface ICreateListingPayload {
  title: string;
  description: string;
  itinerary?: string;
  city: string;
  country: string;
  category: ListingCategory;
  languages: string[];
  tourFee: number;
  feeType: FeeType;
  duration: number;
  meetingPoint?: string;
  meetingLat?: number;
  meetingLng?: number;
  maxGroupSize: number;
  status?: ListingStatus;
  images?: string[]; // Array of image URLs
}

export interface IUpdateListingPayload {
  title?: string;
  description?: string;
  itinerary?: string;
  city?: string;
  country?: string;
  category?: ListingCategory;
  languages?: string[];
  tourFee?: number;
  feeType?: FeeType;
  duration?: number;
  meetingPoint?: string;
  meetingLat?: number;
  meetingLng?: number;
  maxGroupSize?: number;
  status?: ListingStatus;
  images?: string[]; // Array of image URLs
}

