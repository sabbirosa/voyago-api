import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import httpStatus from "http-status";
import { v4 as uuidv4 } from "uuid";
import { AppError } from "../../errorHelpers/AppError";
import { config } from "../../config/env";
import { IUploadResponse } from "./upload.interface";

// Initialize S3 client for Cloudflare R2
const s3Client = new S3Client({
  region: "auto",
  endpoint: config.r2.endpoint,
  credentials: {
    accessKeyId: config.r2.accessKeyId,
    secretAccessKey: config.r2.secretAccessKey,
  },
});

export const UploadService = {
  async uploadImage(
    file: Express.Multer.File,
    folder: string = "avatars"
  ): Promise<IUploadResponse> {
    try {
      // Validate file type
      const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "Invalid file type. Only images (JPEG, PNG, WebP, GIF) are allowed."
        );
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "File size too large. Maximum size is 5MB."
        );
      }

      // Generate unique filename
      const fileExtension = file.originalname.split(".").pop() || "jpg";
      const fileName = `${folder}/${uuidv4()}.${fileExtension}`;

      // Upload to R2
      // Note: R2 doesn't support ACL. Make sure your R2 bucket is configured for public access
      const command = new PutObjectCommand({
        Bucket: config.r2.bucketName,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await s3Client.send(command);

      // Construct public URL
      const publicUrl = `${config.r2.publicUrl}/${fileName}`;

      return {
        url: publicUrl,
        key: fileName,
        size: file.size,
        mimetype: file.mimetype,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to upload image. Please try again."
      );
    }
  },
};

