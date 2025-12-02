import { z } from "zod";

const listingCategoryEnum = z.enum([
  "FOOD",
  "ART",
  "ADVENTURE",
  "CULTURE",
  "PHOTOGRAPHY",
  "NIGHTLIFE",
  "NATURE",
  "ARCHITECTURE",
  "SHOPPING",
  "FAMILY",
  "SPORTS",
  "HISTORY",
]);

const listingStatusEnum = z.enum(["DRAFT", "ACTIVE", "INACTIVE", "BLOCKED"]);

const feeTypeEnum = z.enum(["PER_PERSON", "PER_GROUP"]);

export const createListingSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(200),
    description: z.string().min(10).max(2000),
    itinerary: z.string().max(5000).optional(),
    city: z.string().min(1).max(100),
    country: z.string().min(1).max(100),
    category: listingCategoryEnum,
    languages: z.array(z.string()).min(1, "At least one language is required"),
    tourFee: z.number().positive("Tour fee must be positive"),
    feeType: feeTypeEnum.default("PER_PERSON"),
    duration: z.number().int().positive("Duration must be positive"),
    meetingPoint: z.string().max(500).optional(),
    meetingLat: z.number().min(-90).max(90).optional(),
    meetingLng: z.number().min(-180).max(180).optional(),
    maxGroupSize: z.number().int().positive("Max group size must be positive"),
    status: listingStatusEnum.optional().default("DRAFT"),
    images: z.array(z.string().url()).optional(),
  }),
});

export const updateListingSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(200).optional(),
    description: z.string().min(10).max(2000).optional(),
    itinerary: z.string().max(5000).optional(),
    city: z.string().min(1).max(100).optional(),
    country: z.string().min(1).max(100).optional(),
    category: listingCategoryEnum.optional(),
    languages: z.array(z.string()).optional(),
    tourFee: z.number().positive("Tour fee must be positive").optional(),
    feeType: feeTypeEnum.optional(),
    duration: z.number().int().positive("Duration must be positive").optional(),
    meetingPoint: z.string().max(500).optional(),
    meetingLat: z.number().min(-90).max(90).optional(),
    meetingLng: z.number().min(-180).max(180).optional(),
    maxGroupSize: z.number().int().positive("Max group size must be positive").optional(),
    status: listingStatusEnum.optional(),
    images: z.array(z.string().url()).optional(),
  }),
});

export const getListingsQuerySchema = z.object({
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    category: listingCategoryEnum.optional(),
    minPrice: z.string().optional(),
    maxPrice: z.string().optional(),
    language: z.string().optional(),
    status: listingStatusEnum.optional(),
    guideId: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
  }),
});

