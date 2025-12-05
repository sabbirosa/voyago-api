import { z } from "zod";

export const createReviewSchema = z.object({
  body: z.object({
    bookingId: z.string().min(1, "Booking ID is required"),
    rating: z
      .number()
      .int("Rating must be an integer")
      .min(1, "Rating must be at least 1")
      .max(5, "Rating must be at most 5"),
    title: z.string().max(200, "Title must be less than 200 characters").optional(),
    comment: z.string().max(1000, "Comment must be less than 1000 characters").optional(),
  }),
});

export const getReviewsByListingSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Listing ID is required"),
  }),
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

