import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/utils";
import { z } from "zod";

const experienceSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  company: z.string().min(1),
  location: z.string().optional(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()).optional().nullable(),
  isCurrent: z.boolean().default(false),
  description: z.string().optional(),
  skills: z.array(z.string()).optional().default([]),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return apiError("Unauthorized", 401);

    const body = await req.json();
    const data = experienceSchema.parse(body);

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) return apiError("Profile not found", 404);

    const experience = await prisma.experience.create({
      data: {
        profileId: profile.id,
        title: data.title,
        company: data.company,
        location: data.location,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        isCurrent: data.isCurrent,
        description: data.description,
        skills: data.skills,
      },
    });

    return apiSuccess({ experience });
  } catch (err: any) {
    if (err.name === "ZodError") return apiError("Invalid input", 422);
    console.error("[PROFILE_EXPERIENCES_POST]", err);
    return apiError("Failed to add experience", 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return apiError("Unauthorized", 401);

    const body = await req.json();
    const data = experienceSchema.parse(body);

    if (!data.id) return apiError("Missing experience ID", 400);

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) return apiError("Profile not found", 404);

    const existing = await prisma.experience.findUnique({
      where: { id: data.id },
    });

    if (!existing || existing.profileId !== profile.id) {
      return apiError("Not found or unauthorized", 404);
    }

    const experience = await prisma.experience.update({
      where: { id: data.id },
      data: {
        title: data.title,
        company: data.company,
        location: data.location,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        isCurrent: data.isCurrent,
        description: data.description,
        skills: data.skills,
      },
    });

    return apiSuccess({ experience });
  } catch (err: any) {
    if (err.name === "ZodError") return apiError("Invalid input", 422);
    console.error("[PROFILE_EXPERIENCES_PUT]", err);
    return apiError("Failed to update experience", 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return apiError("Unauthorized", 401);

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) return apiError("Missing experience ID", 400);

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) return apiError("Profile not found", 404);

    const existing = await prisma.experience.findUnique({
      where: { id },
    });

    if (!existing || existing.profileId !== profile.id) {
      return apiError("Not found or unauthorized", 404);
    }

    await prisma.experience.delete({
      where: { id },
    });

    return apiSuccess({ message: "Experience removed" });
  } catch (err) {
    console.error("[PROFILE_EXPERIENCES_DELETE]", err);
    return apiError("Failed to remove experience", 500);
  }
}
