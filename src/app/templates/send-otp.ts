interface SendOTPEmailProps {
  otp: string;
  verificationUrl: string;
  name: string;
}

export function SendOTPEmail({
  otp,
  verificationUrl,
  name,
}: SendOTPEmailProps): string {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Verify Your Email - Voyago</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
    <div style="background-color: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin: 0;">Voyago</h1>
      </div>

      <h2 style="color: #1f2937; margin-top: 0; margin-bottom: 20px;">
        Verify Your Email Address
      </h2>

      <p style="margin-bottom: 20px;">
        Hello ${name},
      </p>

      <p style="margin-bottom: 20px;">
        Thank you for registering with Voyago! To complete your registration, please verify your email address using the OTP code below:
      </p>

      <div style="background-color: #f3f4f6; border: 2px dashed #9ca3af; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb; font-family: monospace;">
          ${otp}
        </div>
      </div>

      <p style="margin-bottom: 20px;">
        This OTP will expire in <strong>10 minutes</strong>. If you didn't request this code, please ignore this email.
      </p>

      <div style="margin-top: 30px; text-align: center;">
        <a href="${verificationUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 10px;">
          Verify Email Address
        </a>
      </div>

      <p style="margin-top: 30px; font-size: 14px; color: #6b7280; text-align: center;">
        Or copy and paste this link into your browser:<br />
        <a href="${verificationUrl}" style="color: #2563eb; word-break: break-all;">
          ${verificationUrl}
        </a>
      </p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />

      <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">
        © ${new Date().getFullYear()} Voyago. All rights reserved.
      </p>
    </div>
  </body>
</html>
  `.trim();
}
