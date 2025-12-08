import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { requireAdmin } from "../../middlewares/requireRole";
import { validateRequest } from "../../middlewares/validateRequest";
import { AdminController } from "./admin.controller";
import {
  updateUserSchema,
  updateListingSchema,
  getUsersQuerySchema,
  getListingsQuerySchema,
  getBookingsQuerySchema,
} from "./admin.validation";

const router = Router();

// All admin routes require authentication and admin role
router.use(checkAuth);
router.use(requireAdmin);

/*
 * GET /api/admin/users
 * Get all users with filters
 * Requires: Admin role
 */
router.get(
  "/users",
  validateRequest(getUsersQuerySchema),
  AdminController.getUsers
);

/*
 * PATCH /api/admin/users/:id
 * Update user (ban/unban, approve, change role)
 * Requires: Admin role
 */
router.patch(
  "/users/:id",
  validateRequest(updateUserSchema),
  AdminController.updateUser
);

/*
 * GET /api/admin/listings
 * Get all listings with filters
 * Requires: Admin role
 */
router.get(
  "/listings",
  validateRequest(getListingsQuerySchema),
  AdminController.getListings
);

/*
 * PATCH /api/admin/listings/:id
 * Update listing (approve, block, etc.)
 * Requires: Admin role
 */
router.patch(
  "/listings/:id",
  validateRequest(updateListingSchema),
  AdminController.updateListing
);

/*
 * GET /api/admin/analytics
 * Get platform analytics
 * Requires: Admin role
 */
router.get("/analytics", AdminController.getAnalytics);

/*
 * GET /api/admin/bookings
 * Get all bookings with filters
 * Requires: Admin role
 */
router.get(
  "/bookings",
  validateRequest(getBookingsQuerySchema),
  AdminController.getBookings
);

export const AdminRoutes = router;


