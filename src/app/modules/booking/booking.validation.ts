import { z } from "zod";

const bookingStatusEnum = z.enum([
  "PENDING",
  "ACCEPTED",
  "DECLINED",
  "PAID",
  "COMPLETED",
  "CANCELLED",
]);

export const createBookingSchema = z.object({
  body: z.object({
    listingId: z.string().min(1, "Listing ID is required"),
    date: z.string().datetime("Invalid date format"),
    groupSize: z
      .number()
      .int("Group size must be an integer")
      .positive("Group size must be positive"),
    note: z.string().max(500, "Note must be less than 500 characters").optional(),
  }),
});

export const updateBookingStatusSchema = z.object({
  body: z.object({
    status: bookingStatusEnum,
    reason: z
      .string()
      .max(500, "Reason must be less than 500 characters")
      .optional(),
  }),
  params: z.object({
    id: z.string().min(1, "Booking ID is required"),
  }),
});

export const getBookingsQuerySchema = z.object({
  query: z.object({
    status: bookingStatusEnum.optional(),
    upcoming: z
      .string()
      .transform((val) => val === "true")
      .pipe(z.boolean())
      .optional(),
    past: z
      .string()
      .transform((val) => val === "true")
      .pipe(z.boolean())
      .optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    sort: z.string().optional(),
  }),
});

export const getBookingByIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, "Booking ID is required"),
  }),
});

