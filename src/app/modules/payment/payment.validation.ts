import { z } from "zod";

export const createPaymentSchema = z.object({
  params: z.object({
    bookingId: z.string().min(1, "Booking ID is required"),
  }),
});

export const getPaymentByBookingSchema = z.object({
  params: z.object({
    bookingId: z.string().min(1, "Booking ID is required"),
  }),
});

