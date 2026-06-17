import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/utils";

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password } = resetPasswordSchema.parse(body);

    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      return apiError("Invalid or expired reset token", 400);
    }

    if (verificationToken.expires < new Date()) {
      await prisma.verificationToken.delete({ where: { token } });
      return apiError("Reset token has expired", 400);
    }

    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier },
    });

    if (!user) {
      return apiError("User not found", 404);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user password and delete token in a transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      }),
      prisma.verificationToken.delete({
        where: { token },
      }),
    ]);

    return apiSuccess({ message: "Password updated successfully" }, 200);
  } catch (error: any) {
    if (error.name === "ZodError") return apiError("Invalid input", 422);
    console.error("[RESET_PASSWORD]", error);
    return apiError("Internal server error", 500);
  }
}
