import { Router } from "express";
import { validateRequest } from "../../middlewares/validateRequest";
import { AuthController } from "./auth.controller";
import {
  loginSchema,
  registerSchema,
  resendOTPSchema,
  verifyEmailSchema,
  verifyOTPSchema,
} from "./auth.validation";

const router = Router();

/*
 * POST /api/auth/register
 * Register user
 * @param {Object} req.body - The request body containing user email and password
 * @param {string} req.body.email - The user's email
 * @param {string} req.body.password - The user's password
 * @returns {Object} The response containing the user data and tokens
 */
router.post(
  "/register",
  validateRequest(registerSchema),
  AuthController.register
);

/*
 * POST /api/auth/login
 * Login user
 * @param {Object} req.body - The request body containing user email and password
 * @param {string} req.body.email - The user's email
 * @param {string} req.body.password - The user's password
 * @returns {Object} The response containing the user data and tokens
 */
router.post("/login", validateRequest(loginSchema), AuthController.login);

/*
 * POST /api/auth/verify-otp
 * Verify OTP and complete email verification
 * @param {Object} req.body - The request body containing email and OTP
 * @param {string} req.body.email - The user's email
 * @param {string} req.body.otp - The OTP code
 * @returns {Object} The response containing the authentication tokens
 */
router.post(
  "/verify-otp",
  validateRequest(verifyOTPSchema),
  AuthController.verifyOTP
);

/*
 * POST /api/auth/resend-otp
 * Resend OTP to user's email
 * @param {Object} req.body - The request body containing the user's email
 * @param {string} req.body.email - The user's email
 * @returns {Object} The response containing the success message
 */
router.post(
  "/resend-otp",
  validateRequest(resendOTPSchema),
  AuthController.resendOTP
);

/*
 * POST /api/auth/verify-email
 * Verify email (legacy endpoint)
 * @param {Object} req.body - The request body containing the verification token
 * @param {string} req.body.token - The verification token
 * @returns {Object} The response containing the success message
 */
router.post(
  "/verify-email",
  validateRequest(verifyEmailSchema),
  AuthController.verifyEmail
);

export const AuthRoutes = router;
