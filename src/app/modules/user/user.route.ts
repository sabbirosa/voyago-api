import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { requireGuide } from "../../middlewares/requireRole";
import { validateRequest } from "../../middlewares/validateRequest";
import { UserController } from "./user.controller";
import {
  changePasswordSchema,
  createGuideProfileSchema,
  createProfileSchema,
  updateGuideProfileSchema,
  updateProfileSchema,
} from "./user.validation";

const router = Router();

/*
 * GET /api/users/me
 * Get current authenticated user's profile
 * Requires: Authentication
 */
router.get("/me", checkAuth, UserController.getMyProfile);

/*
 * PATCH /api/users/me/profile
 * Update current user's profile
 * Requires: Authentication
 */
router.patch(
  "/me/profile",
  checkAuth,
  validateRequest(updateProfileSchema),
  UserController.updateMyProfile
);

/*
 * POST /api/users/me/profile
 * Create current user's profile
 * Requires: Authentication
 */
router.post(
  "/me/profile",
  checkAuth,
  validateRequest(createProfileSchema),
  UserController.updateMyProfile
);

/*
 * PATCH /api/users/me/guide-profile
 * Update current guide's profile
 * Requires: Authentication, Guide role
 */
router.patch(
  "/me/guide-profile",
  checkAuth,
  requireGuide,
  validateRequest(updateGuideProfileSchema),
  UserController.updateMyGuideProfile
);

/*
 * POST /api/users/me/guide-profile
 * Create guide profile (onboarding)
 * Requires: Authentication, Guide role
 */
router.post(
  "/me/guide-profile",
  checkAuth,
  requireGuide,
  validateRequest(createGuideProfileSchema),
  UserController.createGuideProfile
);

/*
 * PATCH /api/users/me/change-password
 * Change user password
 * Requires: Authentication
 */
router.patch(
  "/me/change-password",
  checkAuth,
  validateRequest(changePasswordSchema),
  UserController.changePassword
);

/*
 * GET /api/users/:id
 * Get public user profile by ID
 * Requires: Authentication
 * NOTE: This must be last to avoid matching /me routes
 */
router.get("/:id", checkAuth, UserController.getUserProfile);

export const UserRoutes = router;

