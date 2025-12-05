import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { requireTourist } from "../../middlewares/requireRole";
import { validateRequest } from "../../middlewares/validateRequest";
import { ReviewController } from "./review.controller";
import {
  createReviewSchema,
  getReviewsByListingSchema,
} from "./review.validation";

const router = Router();

/*
 * POST /api/reviews
 * Create a review for a completed booking
 * Requires: Tourist role
 */
router.post(
  "/",
  checkAuth,
  requireTourist,
  validateRequest(createReviewSchema),
  ReviewController.createReview
);

/*
 * GET /api/reviews/listings/:id
 * Get reviews for a listing
 * Public endpoint (no auth required)
 */
router.get(
  "/listings/:id",
  validateRequest(getReviewsByListingSchema),
  ReviewController.getReviewsByListing
);

export const ReviewRoutes = router;

