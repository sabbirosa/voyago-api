import { Router } from "express";
import { AuthRoutes } from "../modules/auth/auth.route";

const router = Router();

const moduleRoutes = [
  { path: "/auth", route: AuthRoutes },
  // Future modules:
  // { path: "/users", route: UserRoutes },
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



