import { Resend } from "resend";
import { config } from "../config/env";
import { SendOTPEmail } from "../templates/send-otp";

// Create Resend client lazily to ensure config is loaded
function getResendClient() {
  if (!config.resend.apiKey || config.resend.apiKey === "") {
    return null;
  }
  return new Resend(config.resend.apiKey);
}

/**
 * Send OTP verification email
 */
export async function sendOTPEmail(
  email: string,
  otp: string,
  name: string
): Promise<void> {
  // Check if Resend API key is configured
  if (!config.resend.apiKey || config.resend.apiKey === "") {
    console.warn(
      `[Email] Resend API key not configured. OTP for ${email} is: ${otp}`
    );
    console.warn(
      "[Email] In production, configure RESEND_API_KEY environment variable"
    );
    return;
  }

  const resend = getResendClient();
  if (!resend) {
    console.warn(
      `[Email] Resend client not available. OTP for ${email} is: ${otp}`
    );
    return;
  }

  // Validate from email - Gmail addresses are not allowed
  const fromEmail = config.resend.fromEmail;
  if (
    fromEmail.includes("@gmail.com") ||
    fromEmail.includes("@yahoo.com") ||
    fromEmail.includes("@hotmail.com")
  ) {
    console.error(
      `[Email] Invalid from email: ${fromEmail}. Free email providers cannot be used with Resend.`
    );
    console.error(
      "[Email] Please use onboarding@resend.dev or verify your own domain."
    );
    console.warn(`[Email] Development mode - OTP for ${email} is: ${otp}`);
    return;
  }

  const verificationUrl = `${
    config.frontendUrl
  }/verify-otp?email=${encodeURIComponent(email)}`;

  try {
    const { data, error } = await resend.emails.send({
      from: fromEmail,
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
      // Log OTP in development for testing purposes
      if (config.env === "development") {
        console.warn(`[Email] Development mode - OTP for ${email} is: ${otp}`);
      }
      // Don't throw - allow registration to succeed even if email fails
      return;
    }

    console.log(`[Email] OTP email sent to ${email}`, data);
  } catch (error) {
    console.error("[Email] Error sending OTP email:", error);
    // Log OTP in development for testing purposes
    if (config.env === "development") {
      console.warn(`[Email] Development mode - OTP for ${email} is: ${otp}`);
    }
    // Don't throw - allow registration to succeed even if email fails
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
