import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { MessageController } from "./message.controller";
import {
  createMessageSchema,
  getMessagesByBookingSchema,
  markMessagesAsReadSchema,
} from "./message.validation";

const router = Router();

/*
 * POST /api/bookings/:bookingId/messages
 * Send a message for a booking
 * Requires: Authentication (must be tourist or guide for the booking)
 */
router.post(
  "/:bookingId/messages",
  checkAuth,
  validateRequest(createMessageSchema),
  MessageController.createMessage
);

/*
 * GET /api/bookings/:bookingId/messages
 * Get messages for a booking
 * Requires: Authentication (must be tourist or guide for the booking)
 */
router.get(
  "/:bookingId/messages",
  checkAuth,
  validateRequest(getMessagesByBookingSchema),
  MessageController.getMessagesByBooking
);

/*
 * PATCH /api/bookings/:bookingId/messages/read
 * Mark messages as read
 * Requires: Authentication (must be tourist or guide for the booking)
 */
router.patch(
  "/:bookingId/messages/read",
  checkAuth,
  validateRequest(markMessagesAsReadSchema),
  MessageController.markMessagesAsRead
);

export const MessageRoutes = router;

