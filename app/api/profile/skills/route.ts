import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/utils";
import { z } from "zod";

const addSkillSchema = z.object({
  name: z.string().min(1),
  level: z.string().optional(),
  yearsExp: z.number().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return apiError("Unauthorized", 401);

    const body = await req.json();
    const { name, level, yearsExp } = addSkillSchema.parse(body);

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) return apiError("Profile not found", 404);

    // Upsert the global skill
    const skill = await prisma.skill.upsert({
      where: { name: name.trim() },
      update: {},
      create: { name: name.trim() },
    });

    // Add to profile skills
    const profileSkill = await prisma.profileSkill.upsert({
      where: {
        profileId_skillId: {
          profileId: profile.id,
          skillId: skill.id,
        },
      },
      update: { level, yearsExp },
      create: {
        profileId: profile.id,
        skillId: skill.id,
        level,
        yearsExp,
      },
      include: { skill: true },
    });

    return apiSuccess({ profileSkill });
  } catch (err: any) {
    if (err.name === "ZodError") return apiError("Invalid input", 422);
    console.error("[PROFILE_SKILLS_POST]", err);
    return apiError("Failed to add skill", 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return apiError("Unauthorized", 401);

    const url = new URL(req.url);
    const profileSkillId = url.searchParams.get("id");

    if (!profileSkillId) return apiError("Missing skill ID", 400);

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) return apiError("Profile not found", 404);

    // Verify ownership
    const existing = await prisma.profileSkill.findUnique({
      where: { id: profileSkillId },
    });

    if (!existing || existing.profileId !== profile.id) {
      return apiError("Not found or unauthorized", 404);
    }

    await prisma.profileSkill.delete({
      where: { id: profileSkillId },
    });

    return apiSuccess({ message: "Skill removed" });
  } catch (err) {
    console.error("[PROFILE_SKILLS_DELETE]", err);
    return apiError("Failed to remove skill", 500);
  }
}
