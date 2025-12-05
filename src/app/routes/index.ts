import { Router } from "express";
import { AdminRoutes } from "../modules/admin/admin.route";
import { AuthRoutes } from "../modules/auth/auth.route";
import { AvailabilityRoutes } from "../modules/availability/availability.route";
import { BookingRoutes } from "../modules/booking/booking.route";
import { ListingRoutes } from "../modules/listing/listing.route";
import { MessageRoutes } from "../modules/message/message.route";
import { NotificationRoutes } from "../modules/notification/notification.route";
import { PaymentRoutes } from "../modules/payment/payment.route";
import { ReviewRoutes } from "../modules/review/review.route";
import { UploadRoutes } from "../modules/upload/upload.route";
import { UserRoutes } from "../modules/user/user.route";

const router = Router();

const moduleRoutes = [
  { path: "/auth", route: AuthRoutes },
  { path: "/users", route: UserRoutes },
  { path: "/upload", route: UploadRoutes },
  { path: "/listings", route: ListingRoutes },
  { path: "/bookings", route: BookingRoutes },
  { path: "/payments", route: PaymentRoutes },
  { path: "/reviews", route: ReviewRoutes },
  { path: "/availability", route: AvailabilityRoutes },
  { path: "/notifications", route: NotificationRoutes },
  { path: "/admin", route: AdminRoutes },
];

// Messages routes are nested under bookings
router.use("/bookings", MessageRoutes);

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

router.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "Voyago API v1 is healthy",
  });
});

export default router;
