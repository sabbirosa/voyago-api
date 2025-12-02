import { UserRole } from "../auth/auth.interface";

export interface IUpdateProfilePayload {
  name?: string;
  bio?: string;
  avatarUrl?: string;
  languages?: string[];
  city?: string;
  country?: string;
  preferences?: string[];
}

export interface IUpdateGuideProfilePayload {
  expertise?: string[];
  dailyRate?: number;
  experienceYears?: number;
  verificationStatus?: "PENDING" | "VERIFIED" | "REJECTED";
}

export interface IProfileResponse {
  id: string;
  userId: string;
  bio: string | null;
  avatarUrl: string | null;
  languages: string[];
  city: string | null;
  country: string | null;
  preferences: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IGuideProfileResponse {
  id: string;
  userId: string;
  expertise: string[];
  dailyRate: number | null;
  experienceYears: number | null;
  verificationStatus: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserProfileResponse {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isApproved: boolean;
  isEmailVerified: boolean;
  profile: IProfileResponse | null;
  guideProfile: IGuideProfileResponse | null;
  createdAt: Date;
  updatedAt: Date;
}

