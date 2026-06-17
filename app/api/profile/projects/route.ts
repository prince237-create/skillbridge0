import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/utils";
import { z } from "zod";

const projectSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  url: z.string().optional(),
  imageUrl: z.string().optional(),
  technologies: z.array(z.string()).optional().default([]),
  startDate: z.string().or(z.date()).optional().nullable(),
  endDate: z.string().or(z.date()).optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return apiError("Unauthorized", 401);

    const body = await req.json();
    const data = projectSchema.parse(body);

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) return apiError("Profile not found", 404);

    const project = await prisma.project.create({
      data: {
        profileId: profile.id,
        name: data.name,
        description: data.description,
        url: data.url,
        imageUrl: data.imageUrl,
        technologies: data.technologies,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    });

    return apiSuccess({ project });
  } catch (err: any) {
    if (err.name === "ZodError") return apiError("Invalid input", 422);
    console.error("[PROFILE_PROJECTS_POST]", err);
    return apiError("Failed to add project", 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return apiError("Unauthorized", 401);

    const body = await req.json();
    const data = projectSchema.parse(body);

    if (!data.id) return apiError("Missing project ID", 400);

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) return apiError("Profile not found", 404);

    const existing = await prisma.project.findUnique({
      where: { id: data.id },
    });

    if (!existing || existing.profileId !== profile.id) {
      return apiError("Not found or unauthorized", 404);
    }

    const project = await prisma.project.update({
      where: { id: data.id },
      data: {
        name: data.name,
        description: data.description,
        url: data.url,
        imageUrl: data.imageUrl,
        technologies: data.technologies,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    });

    return apiSuccess({ project });
  } catch (err: any) {
    if (err.name === "ZodError") return apiError("Invalid input", 422);
    console.error("[PROFILE_PROJECTS_PUT]", err);
    return apiError("Failed to update project", 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return apiError("Unauthorized", 401);

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) return apiError("Missing project ID", 400);

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) return apiError("Profile not found", 404);

    const existing = await prisma.project.findUnique({
      where: { id },
    });

    if (!existing || existing.profileId !== profile.id) {
      return apiError("Not found or unauthorized", 404);
    }

    await prisma.project.delete({
      where: { id },
    });

    return apiSuccess({ message: "Project removed" });
  } catch (err) {
    console.error("[PROFILE_PROJECTS_DELETE]", err);
    return apiError("Failed to remove project", 500);
  }
}
