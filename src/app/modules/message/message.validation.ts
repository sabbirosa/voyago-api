import { z } from "zod";

export const createMessageSchema = z.object({
  body: z.object({
    bookingId: z.string().min(1, "Booking ID is required"),
    body: z.string().min(1, "Message body is required").max(2000, "Message must be less than 2000 characters"),
  }),
});

export const getMessagesByBookingSchema = z.object({
  params: z.object({
    bookingId: z.string().min(1, "Booking ID is required"),
  }),
  query: z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

export const markMessagesAsReadSchema = z.object({
  params: z.object({
    bookingId: z.string().min(1, "Booking ID is required"),
  }),
});

