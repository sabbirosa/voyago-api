import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { requireGuide } from "../../middlewares/requireRole";
import { validateRequest } from "../../middlewares/validateRequest";
import { AvailabilityController } from "./availability.controller";
import {
  createAvailabilitySlotSchema,
  updateAvailabilitySlotSchema,
  deleteAvailabilitySlotSchema,
  getAvailabilitySlotsSchema,
  checkAvailabilitySchema,
} from "./availability.validation";

const router = Router();

/*
 * POST /api/availability
 * Create an availability slot
 * Requires: Guide role
 */
router.post(
  "/",
  checkAuth,
  requireGuide,
  validateRequest(createAvailabilitySlotSchema),
  AvailabilityController.createAvailabilitySlot
);

/*
 * GET /api/availability
 * Get availability slots (filtered by guideId, date, etc.)
 * Optionally authenticated - if guide is logged in, filters by their guideId
 */
router.get(
  "/",
  checkAuth, // Optional - middleware will allow request even if no token
  validateRequest(getAvailabilitySlotsSchema),
  AvailabilityController.getAvailabilitySlots
);

/*
 * GET /api/availability/check
 * Check if a guide is available on a specific date
 * Public endpoint
 */
router.get(
  "/check",
  validateRequest(checkAvailabilitySchema),
  AvailabilityController.checkAvailability
);

/*
 * PATCH /api/availability/:id
 * Update an availability slot
 * Requires: Guide role (must own the slot)
 */
router.patch(
  "/:id",
  checkAuth,
  requireGuide,
  validateRequest(updateAvailabilitySlotSchema),
  AvailabilityController.updateAvailabilitySlot
);

/*
 * DELETE /api/availability/:id
 * Delete an availability slot
 * Requires: Guide role (must own the slot)
 */
router.delete(
  "/:id",
  checkAuth,
  requireGuide,
  validateRequest(deleteAvailabilitySlotSchema),
  AvailabilityController.deleteAvailabilitySlot
);

export const AvailabilityRoutes = router;

