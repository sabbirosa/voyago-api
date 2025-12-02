import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import {
  requireAdmin,
  requireGuide,
  requireGuideOrAdmin,
  requireTourist,
} from "../../middlewares/requireRole";

const router = Router();

// Example: Route accessible to all authenticated users
router.get("/profile", checkAuth, (req, res) => {
  // req.user is available here
  res.json({ user: req.user });
});

// Example: Route only accessible to TOURIST role
router.get("/tourist-only", checkAuth, requireTourist, (req, res) => {
  res.json({ message: "This is a tourist-only route" });
});

// Example: Route only accessible to GUIDE role
router.get("/guide-only", checkAuth, requireGuide, (req, res) => {
  res.json({ message: "This is a guide-only route" });
});

// Example: Route only accessible to ADMIN role
router.get("/admin-only", checkAuth, requireAdmin, (req, res) => {
  res.json({ message: "This is an admin-only route" });
});

// Example: Route accessible to both GUIDE and ADMIN
router.get(
  "/guide-or-admin",
  checkAuth,
  requireGuideOrAdmin,
  (req, res) => {
    res.json({ message: "This route is for guides and admins" });
  }
);

// Example: Route with custom role requirements
router.get(
  "/custom-roles",
  checkAuth,
  requireGuideOrAdmin, // or use: requireRole("GUIDE", "ADMIN")
  (req, res) => {
    res.json({ message: "Custom role access" });
  }
);

export default router;

