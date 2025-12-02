import { Resend } from "resend";
import { config } from "../config/env";
import { SendOTPEmail } from "../templates/send-otp";

const resend = new Resend(config.resend.apiKey);

/**
 * Send OTP verification email
 */
export async function sendOTPEmail(
  email: string,
  otp: string,
  name: string
): Promise<void> {
  const verificationUrl = `${config.frontendUrl}/verify-otp?email=${encodeURIComponent(email)}`;

  try {
    const { data, error } = await resend.emails.send({
      from: config.resend.fromEmail,
      to: email,
      subject: "Verify Your Email - Voyago",
      html: SendOTPEmail({
        otp,
        verificationUrl,
        name,
      }),
    });

    if (error) {
      console.error("[Email] Failed to send OTP email:", error);
      throw error;
    }

    console.log(`[Email] OTP email sent to ${email}`, data);
  } catch (error) {
    console.error("[Email] Error sending OTP email:", error);
    throw error;
  }
}

/**
 * Send verification email (legacy function, kept for backward compatibility)
 */
export async function sendVerificationEmail(email: string, token: string) {
  // This is now handled by OTP flow
  console.log(
    `[email] Legacy verification email requested for ${email} with token: ${token}`
  );
}


