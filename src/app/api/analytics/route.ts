import { prisma } from "@/lib/prisma";
import { successResponse, requireAuth, serverErrorResponse } from "@/lib/api-utils";
import { safeQuery } from "@/lib/prisma";

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const [
      totalProjects,
      totalSkills,
      totalQuestions,
      totalReviews,
      totalContacts,
      totalServices,
      pendingQuestions,
      pendingReviews,
    ] = await Promise.all([
      safeQuery(() => prisma.project.count(), 0, "count projects"),
      safeQuery(() => prisma.skill.count(), 0, "count skills"),
      safeQuery(() => prisma.question.count(), 0, "count questions"),
      safeQuery(() => prisma.review.count(), 0, "count reviews"),
      safeQuery(() => prisma.contact.count(), 0, "count contacts"),
      safeQuery(() => prisma.service.count(), 0, "count services"),
      safeQuery(() => prisma.question.count({ where: { status: "pending" } }), 0, "count pending questions"),
      safeQuery(() => prisma.review.count({ where: { isApproved: false, isSpam: false } }), 0, "count pending reviews"),
    ]);

    return successResponse({
      totalProjects,
      totalSkills,
      totalQuestions,
      totalReviews,
      totalContacts,
      totalServices,
      pendingQuestions,
      pendingReviews,
    });
  } catch (err) {
    return serverErrorResponse(err, "analytics");
  }
}
