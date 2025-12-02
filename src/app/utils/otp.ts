import crypto from "crypto";
import { config } from "../config/env";
import { redis } from "../config/redis";

const OTP_PREFIX = "otp:";
const OTP_RESEND_PREFIX = "otp_resend:";

/**
 * Generate a random OTP code
 */
export function generateOTP(length: number = config.otp.length): string {
  const digits = "0123456789";
  let otp = "";
  
  for (let i = 0; i < length; i++) {
    otp += digits[crypto.randomInt(0, digits.length)];
  }
  
  return otp;
}

/**
 * Store OTP in Redis with expiration
 */
export async function storeOTP(email: string, otp: string): Promise<void> {
  const key = `${OTP_PREFIX}${email}`;
  await redis.setex(key, config.otp.expiresIn, otp);
}

/**
 * Verify OTP from Redis
 */
export async function verifyOTP(email: string, otp: string): Promise<boolean> {
  const key = `${OTP_PREFIX}${email}`;
  const storedOTP = await redis.get(key);
  
  if (!storedOTP) {
    return false;
  }
  
  return storedOTP === otp;
}

/**
 * Delete OTP from Redis after successful verification
 */
export async function deleteOTP(email: string): Promise<void> {
  const key = `${OTP_PREFIX}${email}`;
  await redis.del(key);
}

/**
 * Check if OTP resend is allowed (rate limiting)
 */
export async function canResendOTP(email: string): Promise<boolean> {
  const key = `${OTP_RESEND_PREFIX}${email}`;
  const attempts = await redis.get(key);
  
  if (!attempts) {
    return true;
  }
  
  const attemptCount = parseInt(attempts, 10);
  // Allow max 3 resends per hour
  return attemptCount < 3;
}

/**
 * Record OTP resend attempt
 */
export async function recordOTPResend(email: string): Promise<void> {
  const key = `${OTP_RESEND_PREFIX}${email}`;
  const attempts = await redis.incr(key);
  
  if (attempts === 1) {
    // Set expiration to 1 hour
    await redis.expire(key, 3600);
  }
}

