import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { requireTourist } from "../../middlewares/requireRole";
import { validateRequest } from "../../middlewares/validateRequest";
import { PaymentController } from "./payment.controller";
import {
  createPaymentSchema,
  getPaymentByBookingSchema,
} from "./payment.validation";

const router = Router();

/*
 * POST /api/payments/booking/:bookingId
 * Create Stripe Checkout Session for a booking
 * Requires: Tourist role (must own the booking)
 */
router.post(
  "/booking/:bookingId",
  checkAuth,
  requireTourist,
  validateRequest(createPaymentSchema),
  PaymentController.createPaymentSession
);

/*
 * GET /api/payments/booking/:bookingId
 * Get payment status for a booking
 * Requires: Authentication (must own booking or be admin)
 */
router.get(
  "/booking/:bookingId",
  checkAuth,
  validateRequest(getPaymentByBookingSchema),
  PaymentController.getPaymentByBooking
);

/*
 * POST /api/payments/webhook
 * Stripe webhook endpoint (no auth required, verified by signature)
 */
router.post(
  "/webhook",
  // Raw body is needed for Stripe webhook signature verification
  // Express.json() middleware should be disabled for this route
  PaymentController.handleWebhook
);

export const PaymentRoutes = router;

