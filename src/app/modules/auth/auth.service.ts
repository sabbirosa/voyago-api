import bcrypt from "bcryptjs";
import httpStatus from "http-status";

import { prisma } from "../../config/prisma";
import { AppError } from "../../errorHelpers/AppError";
import { sendOTPEmail } from "../../utils/email";
import {
  canResendOTP,
  deleteOTP,
  generateOTP,
  recordOTPResend,
  storeOTP,
  verifyOTP as verifyOTPUtil,
} from "../../utils/otp";
import { createUserTokens } from "../../utils/userTokens";
import {
  IAuthCredentials,
  IAuthTokens,
  IRegisterPayload,
  UserRole,
} from "./auth.interface";

export const AuthService = {
  async register(payload: IRegisterPayload): Promise<{
    user: {
      id: string;
      name: string;
      email: string;
      role: UserRole;
      isApproved: boolean;
      isEmailVerified: boolean;
    };
  }> {
    const { name, email, password } = payload;
    const role: UserRole = payload.role ?? "TOURIST";

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      throw new AppError(httpStatus.CONFLICT, "Email is already registered");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const requiresApproval = role !== "TOURIST";

    const created = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        isApproved: !requiresApproval,
        isEmailVerified: false,
        emailVerifyToken: null,
      },
    });

    // Generate and store OTP in Redis
    const otp = generateOTP();
    await storeOTP(email, otp);

    // Send OTP email (fire-and-forget)
    void sendOTPEmail(email, otp, name);

    return {
      user: {
        id: created.id,
        name: created.name,
        email: created.email,
        role: created.role as UserRole,
        isApproved: created.isApproved,
        isEmailVerified: created.isEmailVerified,
      },
    };
  },

  async login(payload: IAuthCredentials): Promise<IAuthTokens> {
    const { email, password } = payload;

    if (!email || !password) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Email and password are required"
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError(httpStatus.UNAUTHORIZED, "Invalid credentials");
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new AppError(httpStatus.UNAUTHORIZED, "Invalid credentials");
    }

    if (user.role !== "TOURIST" && !user.isApproved) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "Account is pending approval by an administrator"
      );
    }

    if (!user.isEmailVerified) {
      throw new AppError(httpStatus.FORBIDDEN, "Email address is not verified");
    }

    const tokens = createUserTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return tokens;
  },

  async verifyOTP(email: string, otp: string): Promise<IAuthTokens> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    if (user.isEmailVerified) {
      throw new AppError(httpStatus.BAD_REQUEST, "Email is already verified");
    }

    const isValid = await verifyOTPUtil(email, otp);

    if (!isValid) {
      throw new AppError(httpStatus.BAD_REQUEST, "Invalid or expired OTP");
    }

    // Mark email as verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
      },
    });

    // Delete OTP from Redis
    await deleteOTP(email);

    // Generate and return tokens
    const tokens = createUserTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return tokens;
  },

  async resendOTP(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    if (user.isEmailVerified) {
      throw new AppError(httpStatus.BAD_REQUEST, "Email is already verified");
    }

    // Check rate limiting
    const canResend = await canResendOTP(email);
    if (!canResend) {
      throw new AppError(
        httpStatus.TOO_MANY_REQUESTS,
        "Too many resend requests. Please try again later."
      );
    }

    // Generate and store new OTP
    const otp = generateOTP();
    await storeOTP(email, otp);

    // Record resend attempt
    await recordOTPResend(email);

    // Send OTP email
    void sendOTPEmail(email, otp, user.name);
  },

  async verifyEmail(token: string): Promise<void> {
    const user = await prisma.user.findFirst({
      where: { emailVerifyToken: token },
    });

    if (!user) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Invalid or expired email verification token"
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerifyToken: null,
      },
    });
  },
};
