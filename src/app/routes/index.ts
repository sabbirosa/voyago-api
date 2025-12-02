import { Router } from "express";
import { AuthRoutes } from "../modules/auth/auth.route";
import { UploadRoutes } from "../modules/upload/upload.route";
import { UserRoutes } from "../modules/user/user.route";

const router = Router();

const moduleRoutes = [
  { path: "/auth", route: AuthRoutes },
  { path: "/users", route: UserRoutes },
  { path: "/upload", route: UploadRoutes },
  // Future modules:
  // { path: "/listings", route: ListingRoutes },
  // { path: "/bookings", route: BookingRoutes },
  // { path: "/payments", route: PaymentRoutes },
];

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



