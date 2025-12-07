import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { WishlistService } from "./wishlist.service";

const wishlistService = new WishlistService();

export const addToWishlist = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { listingId } = req.body;

  const wishlistItem = await wishlistService.addToWishlist(userId, listingId);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    data: wishlistItem,
    message: "Added to wishlist",
  });
});

export const removeFromWishlist = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { listingId } = req.params;

    await wishlistService.removeFromWishlist(userId, listingId);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Removed from wishlist",
    });
  }
);

export const getUserWishlist = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await wishlistService.getUserWishlist(userId, page, limit);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Wishlist retrieved successfully",
      data: result.items,
      meta: result.pagination,
    });
  }
);

export const checkWishlistStatus = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { listingId } = req.params;

    const isInWishlist = await wishlistService.isInWishlist(userId, listingId);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      data: { isInWishlist },
    });
  }
);
