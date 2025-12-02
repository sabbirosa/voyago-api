import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { requireGuide, requireGuideOrAdmin } from "../../middlewares/requireRole";
import { validateRequest } from "../../middlewares/validateRequest";
import { ListingController } from "./listing.controller";
import {
  createListingSchema,
  getListingsQuerySchema,
  updateListingSchema,
} from "./listing.validation";

const router = Router();

/*
 * GET /api/listings
 * Get all listings with filters, pagination, and sorting
 * Public endpoint (no auth required for browsing)
 */
router.get(
  "/",
  validateRequest(getListingsQuerySchema),
  ListingController.getListings
);

/*
 * GET /api/listings/:id
 * Get a single listing by ID
 * Public endpoint (no auth required)
 */
router.get("/:id", ListingController.getListingById);

/*
 * POST /api/listings
 * Create a new listing
 * Requires: Authentication, Guide role
 */
router.post(
  "/",
  checkAuth,
  requireGuide,
  validateRequest(createListingSchema),
  ListingController.createListing
);

/*
 * PATCH /api/listings/:id
 * Update a listing
 * Requires: Authentication, Guide (own listings) or Admin
 */
router.patch(
  "/:id",
  checkAuth,
  requireGuideOrAdmin,
  validateRequest(updateListingSchema),
  ListingController.updateListing
);

/*
 * DELETE /api/listings/:id
 * Soft delete a listing
 * Requires: Authentication, Guide (own listings) or Admin
 */
router.delete(
  "/:id",
  checkAuth,
  requireGuideOrAdmin,
  ListingController.deleteListing
);

export const ListingRoutes = router;

