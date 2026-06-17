import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/utils";
import { z } from "zod";

const educationSchema = z.object({
  id: z.string().optional(),
  institution: z.string().min(1),
  degree: z.string().min(1),
  fieldOfStudy: z.string().optional(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()).optional().nullable(),
  isCurrent: z.boolean().default(false),
  gpa: z.number().optional().nullable(),
  description: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return apiError("Unauthorized", 401);

    const body = await req.json();
    const data = educationSchema.parse(body);

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) return apiError("Profile not found", 404);

    const education = await prisma.education.create({
      data: {
        profileId: profile.id,
        institution: data.institution,
        degree: data.degree,
        fieldOfStudy: data.fieldOfStudy,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        isCurrent: data.isCurrent,
        gpa: data.gpa,
        description: data.description,
      },
    });

    return apiSuccess({ education });
  } catch (err: any) {
    if (err.name === "ZodError") return apiError("Invalid input", 422);
    console.error("[PROFILE_EDUCATIONS_POST]", err);
    return apiError("Failed to add education", 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return apiError("Unauthorized", 401);

    const body = await req.json();
    const data = educationSchema.parse(body);

    if (!data.id) return apiError("Missing education ID", 400);

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) return apiError("Profile not found", 404);

    const existing = await prisma.education.findUnique({
      where: { id: data.id },
    });

    if (!existing || existing.profileId !== profile.id) {
      return apiError("Not found or unauthorized", 404);
    }

    const education = await prisma.education.update({
      where: { id: data.id },
      data: {
        institution: data.institution,
        degree: data.degree,
        fieldOfStudy: data.fieldOfStudy,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        isCurrent: data.isCurrent,
        gpa: data.gpa,
        description: data.description,
      },
    });

    return apiSuccess({ education });
  } catch (err: any) {
    if (err.name === "ZodError") return apiError("Invalid input", 422);
    console.error("[PROFILE_EDUCATIONS_PUT]", err);
    return apiError("Failed to update education", 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return apiError("Unauthorized", 401);

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) return apiError("Missing education ID", 400);

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) return apiError("Profile not found", 404);

    const existing = await prisma.education.findUnique({
      where: { id },
    });

    if (!existing || existing.profileId !== profile.id) {
      return apiError("Not found or unauthorized", 404);
    }

    await prisma.education.delete({
      where: { id },
    });

    return apiSuccess({ message: "Education removed" });
  } catch (err) {
    console.error("[PROFILE_EDUCATIONS_DELETE]", err);
    return apiError("Failed to remove education", 500);
  }
}
