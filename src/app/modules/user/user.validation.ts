import { z } from "zod";

const expertiseOptions = [
  "History",
  "Food",
  "Adventure",
  "Photography",
  "Culture",
  "Art",
  "Nightlife",
  "Nature",
  "Architecture",
  "Shopping",
  "Family",
  "Sports",
] as const;

const preferenceOptions = [
  "Foodie",
  "Nightlife",
  "Culture",
  "Family-friendly",
  "Adventure",
  "Relaxation",
  "Budget",
  "Luxury",
] as const;

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    bio: z.string().max(500).optional(),
    avatarUrl: z.string().url().optional().or(z.literal("")),
    languages: z.array(z.string()).optional(),
    city: z.string().max(100).optional(),
    country: z.string().max(100).optional(),
    preferences: z
      .array(z.enum(preferenceOptions))
      .optional(),
  }),
});

export const updateGuideProfileSchema = z.object({
  body: z.object({
    expertise: z
      .array(z.enum(expertiseOptions))
      .optional(),
    dailyRate: z.number().positive().optional(),
    experienceYears: z.number().int().min(0).max(50).optional(),
    verificationStatus: z
      .enum(["PENDING", "VERIFIED", "REJECTED"])
      .optional(),
  }),
});

export const createProfileSchema = z.object({
  body: z.object({
    bio: z.string().max(500).optional(),
    avatarUrl: z.string().url().optional().or(z.literal("")),
    languages: z.array(z.string()).default([]),
    city: z.string().max(100).optional(),
    country: z.string().max(100).optional(),
    preferences: z
      .array(z.enum(preferenceOptions))
      .default([]),
  }),
});

export const createGuideProfileSchema = z.object({
  body: z.object({
    expertise: z
      .array(z.enum(expertiseOptions))
      .min(1, "At least one expertise is required"),
    dailyRate: z.number().positive("Daily rate must be positive"),
    experienceYears: z.number().int().min(0).max(50).optional(),
  }),
});

