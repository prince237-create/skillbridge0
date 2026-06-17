import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/utils";
import { sendPasswordResetEmail } from "@/lib/mail";

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = forgotPasswordSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Return success even if user doesn't exist to prevent email enumeration
      return apiSuccess({ message: "If an account exists, a reset link has been sent." }, 200);
    }

    // Generate a secure random token
    const token = crypto.randomUUID();
    // Token expires in 1 hour
    const expires = new Date(Date.now() + 1000 * 60 * 60);

    // Delete any existing tokens for this user to prevent clutter
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    // Create a new token
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    });

    await sendPasswordResetEmail(email, token);

    return apiSuccess({ message: "If an account exists, a reset link has been sent." }, 200);
  } catch (error: any) {
    if (error.name === "ZodError") return apiError("Invalid email address", 422);
    console.error("[FORGOT_PASSWORD]", error);
    return apiError("Internal server error", 500);
  }
}
