import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const domain = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const sendPasswordResetEmail = async (
  email: string,
  token: string
) => {
  const resetLink = `${domain}/auth/reset-password?token=${token}`;

  try {
    await resend.emails.send({
      from: "SkillBridge <onboarding@resend.dev>",
      to: email,
      subject: "Reset your password",
      html: `
        <div style="font-family: Arial, sans-serif; max-w-md mx-auto; p-6">
          <h2 style="color: #333;">Reset Your Password</h2>
          <p>You requested to reset your password. Click the link below to set a new password:</p>
          <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px;">Reset Password</a>
          <p style="margin-top: 24px; font-size: 14px; color: #666;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send reset email:", error);
    throw new Error("Failed to send reset email");
  }
};
