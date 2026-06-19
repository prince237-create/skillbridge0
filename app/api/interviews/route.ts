import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/utils";
import { z } from "zod";

const createInterviewSchema = z.object({
  applicationId: z.string(),
  scheduledAt: z.string(),
  duration: z.number().optional(),
  type: z.string().optional(),
  location: z.string().optional(),
  meetingUrl: z.string().optional(),
});

// GET /api/interviews
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return apiError("Unauthorized", 401);

    const role = (session.user as any).role;
    let where: any = {};

    if (role === "JOB_SEEKER") {
      where.candidateId = session.user.id;
    } else if (role === "EMPLOYER") {
      const company = await prisma.company.findUnique({ where: { userId: session.user.id } });
      if (!company) return apiError("Company not found", 404);
      where.job = { companyId: company.id };
    }

    const interviews = await prisma.interview.findMany({
      where,
      include: {
        application: true,
        candidate: { select: { name: true, email: true, image: true } },
        job: { select: { title: true, company: { select: { name: true, logoUrl: true } } } },
      },
      orderBy: { scheduledAt: "asc" },
    });

    return apiSuccess({ interviews });
  } catch (err) {
    console.error("[INTERVIEWS_GET]", err);
    return apiError("Failed to fetch interviews", 500);
  }
}

// POST /api/interviews
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return apiError("Unauthorized", 401);
    if ((session.user as any).role !== "EMPLOYER") return apiError("Employers only", 403);

    const body = await req.json();
    const data = createInterviewSchema.parse(body);

    const application = await prisma.application.findUnique({
      where: { id: data.applicationId },
      include: { job: true },
    });

    if (!application) return apiError("Application not found", 404);

    // Verify company ownership
    const company = await prisma.company.findUnique({ where: { userId: session.user.id } });
    if (application.job.companyId !== company?.id) return apiError("Unauthorized", 403);

    const interview = await prisma.interview.create({
      data: {
        applicationId: data.applicationId,
        candidateId: application.userId,
        jobId: application.jobId,
        scheduledAt: new Date(data.scheduledAt),
        duration: data.duration || 60,
        type: data.type || "Video",
        location: data.location,
        meetingUrl: data.meetingUrl,
      },
    });

    // Update application status
    await prisma.application.update({
      where: { id: data.applicationId },
      data: { status: "INTERVIEW_SCHEDULED" },
    });

    // Create notification for job seeker
    await prisma.notification.create({
      data: {
        userId: application.userId,
        type: "INTERVIEW_SCHEDULED",
        title: "Interview Scheduled",
        message: `An interview has been scheduled for your application to ${application.job.title}`,
        data: { interviewId: interview.id },
      },
    });

    return apiSuccess({ interview }, 201);
  } catch (err: any) {
    if (err.name === "ZodError") return apiError("Invalid input", 422);
    console.error("[INTERVIEWS_POST]", err);
    return apiError("Failed to create interview", 500);
  }
}
