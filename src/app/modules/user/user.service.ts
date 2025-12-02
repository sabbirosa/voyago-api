import httpStatus from "http-status";
import { prisma } from "../../config/prisma";
import { AppError } from "../../errorHelpers/AppError";
import {
  IGuideProfileResponse,
  IProfileResponse,
  IUpdateGuideProfilePayload,
  IUpdateProfilePayload,
  IUserProfileResponse,
} from "./user.interface";

export const UserService = {
  async getMyProfile(userId: string): Promise<IUserProfileResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        guideProfile: true,
      },
    });

    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as "TOURIST" | "GUIDE" | "ADMIN",
      isApproved: user.isApproved,
      isEmailVerified: user.isEmailVerified,
      profile: user.profile
        ? {
            id: user.profile.id,
            userId: user.profile.userId,
            bio: user.profile.bio,
            avatarUrl: user.profile.avatarUrl,
            languages: user.profile.languages,
            city: user.profile.city,
            country: user.profile.country,
            preferences: user.profile.preferences,
            createdAt: user.profile.createdAt,
            updatedAt: user.profile.updatedAt,
          }
        : null,
      guideProfile: user.guideProfile
        ? {
            id: user.guideProfile.id,
            userId: user.guideProfile.userId,
            expertise: user.guideProfile.expertise,
            dailyRate: user.guideProfile.dailyRate,
            experienceYears: user.guideProfile.experienceYears,
            verificationStatus: user.guideProfile.verificationStatus,
            createdAt: user.guideProfile.createdAt,
            updatedAt: user.guideProfile.updatedAt,
          }
        : null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  },

  async getUserProfile(userId: string): Promise<IUserProfileResponse> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        guideProfile: true,
      },
    });

    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as "TOURIST" | "GUIDE" | "ADMIN",
      isApproved: user.isApproved,
      isEmailVerified: user.isEmailVerified,
      profile: user.profile
        ? {
            id: user.profile.id,
            userId: user.profile.userId,
            bio: user.profile.bio,
            avatarUrl: user.profile.avatarUrl,
            languages: user.profile.languages,
            city: user.profile.city,
            country: user.profile.country,
            preferences: user.profile.preferences,
            createdAt: user.profile.createdAt,
            updatedAt: user.profile.updatedAt,
          }
        : null,
      guideProfile: user.guideProfile
        ? {
            id: user.guideProfile.id,
            userId: user.guideProfile.userId,
            expertise: user.guideProfile.expertise,
            dailyRate: user.guideProfile.dailyRate,
            experienceYears: user.guideProfile.experienceYears,
            verificationStatus: user.guideProfile.verificationStatus,
            createdAt: user.guideProfile.createdAt,
            updatedAt: user.guideProfile.updatedAt,
          }
        : null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  },

  async updateMyProfile(
    userId: string,
    payload: IUpdateProfilePayload
  ): Promise<IProfileResponse> {
    // Update user name if provided
    if (payload.name) {
      await prisma.user.update({
        where: { id: userId },
        data: { name: payload.name },
      });
    }

    // Check if profile exists
    const existingProfile = await prisma.userProfile.findUnique({
      where: { userId },
    });

    let profile: IProfileResponse;

    if (existingProfile) {
      // Update existing profile
      const updated = await prisma.userProfile.update({
        where: { userId },
        data: {
          bio: payload.bio,
          avatarUrl: payload.avatarUrl === "" ? null : payload.avatarUrl,
          languages: payload.languages,
          city: payload.city,
          country: payload.country,
          preferences: payload.preferences,
        },
      });

      profile = {
        id: updated.id,
        userId: updated.userId,
        bio: updated.bio,
        avatarUrl: updated.avatarUrl,
        languages: updated.languages,
        city: updated.city,
        country: updated.country,
        preferences: updated.preferences,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      };
    } else {
      // Create new profile
      const created = await prisma.userProfile.create({
        data: {
          userId,
          bio: payload.bio,
          avatarUrl: payload.avatarUrl === "" ? null : payload.avatarUrl,
          languages: payload.languages || [],
          city: payload.city,
          country: payload.country,
          preferences: payload.preferences || [],
        },
      });

      profile = {
        id: created.id,
        userId: created.userId,
        bio: created.bio,
        avatarUrl: created.avatarUrl,
        languages: created.languages,
        city: created.city,
        country: created.country,
        preferences: created.preferences,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      };
    }

    return profile;
  },

  async updateMyGuideProfile(
    userId: string,
    payload: IUpdateGuideProfilePayload
  ): Promise<IGuideProfileResponse> {
    // Verify user is a guide
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    if (user.role !== "GUIDE") {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "Only guides can update guide profile"
      );
    }

    // Check if guide profile exists
    const existingGuideProfile = await prisma.guideProfile.findUnique({
      where: { userId },
    });

    let guideProfile: IGuideProfileResponse;

    if (existingGuideProfile) {
      // Update existing guide profile
      const updated = await prisma.guideProfile.update({
        where: { userId },
        data: {
          expertise: payload.expertise,
          dailyRate: payload.dailyRate,
          experienceYears: payload.experienceYears,
          verificationStatus: payload.verificationStatus,
        },
      });

      guideProfile = {
        id: updated.id,
        userId: updated.userId,
        expertise: updated.expertise,
        dailyRate: updated.dailyRate,
        experienceYears: updated.experienceYears,
        verificationStatus: updated.verificationStatus,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      };
    } else {
      // Create new guide profile
      const created = await prisma.guideProfile.create({
        data: {
          userId,
          expertise: payload.expertise || [],
          dailyRate: payload.dailyRate,
          experienceYears: payload.experienceYears,
          verificationStatus: payload.verificationStatus || "PENDING",
        },
      });

      guideProfile = {
        id: created.id,
        userId: created.userId,
        expertise: created.expertise,
        dailyRate: created.dailyRate,
        experienceYears: created.experienceYears,
        verificationStatus: created.verificationStatus,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      };
    }

    return guideProfile;
  },

  async createGuideProfile(
    userId: string,
    payload: {
      expertise: string[];
      dailyRate: number;
      experienceYears?: number;
    }
  ): Promise<IGuideProfileResponse> {
    // Verify user is a guide
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    if (user.role !== "GUIDE") {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "Only guides can create guide profile"
      );
    }

    // Check if guide profile already exists
    const existing = await prisma.guideProfile.findUnique({
      where: { userId },
    });

    if (existing) {
      throw new AppError(
        httpStatus.CONFLICT,
        "Guide profile already exists. Use update endpoint instead."
      );
    }

    // Create guide profile
    const created = await prisma.guideProfile.create({
      data: {
        userId,
        expertise: payload.expertise,
        dailyRate: payload.dailyRate,
        experienceYears: payload.experienceYears,
        verificationStatus: "PENDING",
      },
    });

    return {
      id: created.id,
      userId: created.userId,
      expertise: created.expertise,
      dailyRate: created.dailyRate,
      experienceYears: created.experienceYears,
      verificationStatus: created.verificationStatus,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  },
};

