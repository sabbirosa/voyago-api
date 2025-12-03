import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { requireTourist } from "../../middlewares/requireRole";
import { validateRequest } from "../../middlewares/validateRequest";
import { BookingController } from "./booking.controller";
import {
  createBookingSchema,
  getBookingByIdSchema,
  getBookingsQuerySchema,
  updateBookingStatusSchema,
} from "./booking.validation";

const router = Router();

/*
 * POST /api/bookings
 * Create a new booking request
 * Requires: Tourist role
 */
router.post(
  "/",
  checkAuth,
  requireTourist,
  validateRequest(createBookingSchema),
  BookingController.createBooking
);

/*
 * GET /api/bookings/me
 * Get bookings for the authenticated user (tourist or guide)
 * Requires: Authentication
 */
router.get(
  "/me",
  checkAuth,
  validateRequest(getBookingsQuerySchema),
  BookingController.getBookings
);

/*
 * GET /api/bookings/:id
 * Get a single booking by ID
 * Requires: Authentication (must own booking or be admin)
 */
router.get(
  "/:id",
  checkAuth,
  validateRequest(getBookingByIdSchema),
  BookingController.getBookingById
);

/*
 * PATCH /api/bookings/:id/status
 * Update booking status (accept, decline, cancel)
 * Requires: Authentication (guide can accept/decline, tourist can cancel before payment)
 */
router.patch(
  "/:id/status",
  checkAuth,
  validateRequest(updateBookingStatusSchema),
  BookingController.updateBookingStatus
);

export const BookingRoutes = router;

