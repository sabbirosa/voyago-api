import { Resend } from "resend";
import { config } from "../config/env";
import { prisma } from "../config/prisma";
import { CreateNotificationPayload } from "../modules/notification/notification.interface";

function getResendClient() {
  if (!config.resend.apiKey || config.resend.apiKey === "") {
    return null;
  }
  return new Resend(config.resend.apiKey);
}

/**
 * Send notification email
 */
export async function sendNotificationEmail(
  payload: CreateNotificationPayload
): Promise<void> {
  if (!config.resend.apiKey || config.resend.apiKey === "") {
    return;
  }

  const resend = getResendClient();
  if (!resend) {
    return;
  }

  // Get user email
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { email: true, name: true },
  });

  if (!user) {
    return;
  }

  // Validate from email
  const fromEmail = config.resend.fromEmail;
  if (
    fromEmail.includes("@gmail.com") ||
    fromEmail.includes("@yahoo.com") ||
    fromEmail.includes("@hotmail.com")
  ) {
    return;
  }

  // Generate email HTML based on notification type
  const emailHtml = generateEmailHtml(payload, user.name);

  try {
    await resend.emails.send({
      from: fromEmail,
      to: user.email,
      subject: payload.title,
      html: emailHtml,
    });
  } catch (error) {
    console.error(`[Notification Email] Failed to send to ${user.email}:`, error);
  }
}

function generateEmailHtml(
  payload: CreateNotificationPayload,
  userName: string
): string {
  const baseHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Voyago</h1>
        </div>
        <div class="content">
          <h2>Hello ${userName},</h2>
          <p>${payload.message}</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Voyago. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return baseHtml;
}


