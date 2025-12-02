import { Router } from "express";
import multer from "multer";
import { checkAuth } from "../../middlewares/checkAuth";
import { UploadController } from "./upload.controller";

const router = Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

/*
 * POST /api/upload/image
 * Upload an image to Cloudflare R2
 * Requires: Authentication
 */
router.post(
  "/image",
  checkAuth,
  upload.single("image"),
  UploadController.uploadImage
);

export const UploadRoutes = router;

