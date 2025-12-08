import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { requireRole } from "../../middlewares/requireRole";
import { getGuideAnalytics, getGuideBadges, getPublicGuideProfile, getGuides } from "./guide.controller";

const router = Router();

// Public route - list all guides (must be before parameterized route)
router.get("/", getGuides);

// Protected routes - require authentication and guide role (must be before parameterized route)
router.get("/analytics", checkAuth, requireRole("GUIDE"), getGuideAnalytics);
router.get("/badges", checkAuth, requireRole("GUIDE"), getGuideBadges);

// Public route - no auth required (must be last to avoid matching /analytics or /badges)
router.get("/:id", getPublicGuideProfile);

export const GuideRoutes = router;

