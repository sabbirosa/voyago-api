import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { requireRole } from "../../middlewares/requireRole";
import { getGuideAnalytics, getGuideBadges } from "./guide.controller";

const router = Router();

router.use(checkAuth);
router.use(requireRole(["GUIDE"]));

router.get("/analytics", getGuideAnalytics);
router.get("/badges", getGuideBadges);

export const GuideRoutes = router;

