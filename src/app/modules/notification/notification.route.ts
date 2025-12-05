import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import { NotificationController } from "./notification.controller";
import {
  getNotificationsQuerySchema,
  markAsReadSchema,
} from "./notification.validation";

const router = Router();

/*
 * GET /api/notifications
 * Get notifications for authenticated user
 * Requires: Authentication
 */
router.get(
  "/",
  checkAuth,
  validateRequest(getNotificationsQuerySchema),
  NotificationController.getNotifications
);

/*
 * GET /api/notifications/unread-count
 * Get unread notification count
 * Requires: Authentication
 */
router.get(
  "/unread-count",
  checkAuth,
  NotificationController.getUnreadCount
);

/*
 * PATCH /api/notifications/:id/read
 * Mark a notification as read
 * Requires: Authentication
 */
router.patch(
  "/:id/read",
  checkAuth,
  validateRequest(markAsReadSchema),
  NotificationController.markAsRead
);

/*
 * PATCH /api/notifications/read-all
 * Mark all notifications as read
 * Requires: Authentication
 */
router.patch(
  "/read-all",
  checkAuth,
  NotificationController.markAllAsRead
);

export const NotificationRoutes = router;


