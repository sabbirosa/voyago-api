import { z } from "zod";

export const updateUserSchema = z.object({
  body: z.object({
    isBanned: z.boolean().optional(),
    isApproved: z.boolean().optional(),
    role: z.enum(["TOURIST", "GUIDE", "ADMIN"]).optional(),
  }),
  params: z.object({
    id: z.string().min(1, "User ID is required"),
  }),
});

export const updateListingSchema = z.object({
  body: z.object({
    status: z.enum(["DRAFT", "ACTIVE", "INACTIVE", "BLOCKED"]).optional(),
  }),
  params: z.object({
    id: z.string().min(1, "Listing ID is required"),
  }),
});

export const getUsersQuerySchema = z.object({
  query: z.object({
    role: z.enum(["TOURIST", "GUIDE", "ADMIN"]).optional(),
    isBanned: z.string().optional(),
    isApproved: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
  }),
});

export const getListingsQuerySchema = z.object({
  query: z.object({
    status: z.enum(["DRAFT", "ACTIVE", "INACTIVE", "BLOCKED"]).optional(),
    guideId: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    search: z.string().optional(),
  }),
});


