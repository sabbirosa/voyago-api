import { Router } from "express";
import { AdminRoutes } from "../modules/admin/admin.route";
import { AuthRoutes } from "../modules/auth/auth.route";
import { AvailabilityRoutes } from "../modules/availability/availability.route";
import { BookingRoutes } from "../modules/booking/booking.route";
import { GuideRoutes } from "../modules/guide/guide.route";
import { ListingRoutes } from "../modules/listing/listing.route";
import { MessageRoutes } from "../modules/message/message.route";
import { NotificationRoutes } from "../modules/notification/notification.route";
import { PaymentRoutes } from "../modules/payment/payment.route";
import { ReviewRoutes } from "../modules/review/review.route";
import { UploadRoutes } from "../modules/upload/upload.route";
import { UserRoutes } from "../modules/user/user.route";
import { WishlistRoutes } from "../modules/wishlist/wishlist.route";

const router = Router();

// Root route
router.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Voyago API is running...",
    version: "v1",
    api: "Voyago API",
    status: "operational",
    endpoints: {
      health: "/api/v1/health",
    },
  });
});

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
  { path: "/wishlist", route: WishlistRoutes },
  { path: "/guide", route: GuideRoutes },
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
