import { Router } from "express";
import { checkAuth } from "../../middlewares/checkAuth";
import { validateRequest } from "../../middlewares/validateRequest";
import {
  addToWishlist,
  checkWishlistStatus,
  getUserWishlist,
  removeFromWishlist,
} from "./wishlist.controller";
import { addToWishlistSchema } from "./wishlist.validation";

const router = Router();

router.use(checkAuth);

router.get("/", getUserWishlist);
router.post("/", validateRequest(addToWishlistSchema), addToWishlist);
router.delete("/:listingId", removeFromWishlist);
router.get("/check/:listingId", checkWishlistStatus);

export const WishlistRoutes = router;

