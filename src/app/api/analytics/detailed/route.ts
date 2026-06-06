import { NextRequest } from "next/server";
import { prisma, safeQuery } from "@/lib/prisma";
import { successResponse, requireAuth, serverErrorResponse } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "month";

    const now = new Date();
    let startDate: Date;
    if (period === "week") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === "year") {
      startDate = new Date(now.getFullYear(), 0, 1);
    } else {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const [
      totalProjects, totalSkills, totalQuestions, totalReviews,
      totalContacts, totalServices, pendingQuestions, pendingReviews,
    ] = await Promise.all([
      safeQuery(() => prisma.project.count(), 0, "analytics:projects"),
      safeQuery(() => prisma.skill.count(), 0, "analytics:skills"),
      safeQuery(() => prisma.question.count({ where: { createdAt: { gte: startDate } } }), 0, "analytics:questions"),
      safeQuery(() => prisma.review.count({ where: { createdAt: { gte: startDate } } }), 0, "analytics:reviews"),
      safeQuery(() => prisma.contact.count(), 0, "analytics:contacts"),
      safeQuery(() => prisma.service.count(), 0, "analytics:services"),
      safeQuery(() => prisma.question.count({ where: { status: "pending" } }), 0, "analytics:pendingQuestions"),
      safeQuery(() => prisma.review.count({ where: { isApproved: false, isSpam: false } }), 0, "analytics:pendingReviews"),
    ]);

    const prevStartDate = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));

    const [topPages, monthlyData] = await Promise.all([
      safeQuery(async () => {
        const currentRows = await prisma.$queryRaw<Array<{ page: string; views: bigint }>>`
          SELECT "page", COUNT(*)::bigint as views
          FROM "PageView"
          WHERE "createdAt" >= ${startDate} AND "createdAt" < ${now}
          GROUP BY "page"
          ORDER BY views DESC
          LIMIT 10
        `;
        const prevRows = await prisma.$queryRaw<Array<{ page: string; views: bigint }>>`
          SELECT "page", COUNT(*)::bigint as views
          FROM "PageView"
          WHERE "createdAt" >= ${prevStartDate} AND "createdAt" < ${startDate}
          GROUP BY "page"
        `;
        const prevMap = new Map(prevRows.map(r => [r.page, Number(r.views)]));
        return currentRows.map(r => {
          const currentViews = Number(r.views);
          const prevViews = prevMap.get(r.page) || 0;
          const change = prevViews > 0 ? Math.round(((currentViews - prevViews) / prevViews) * 100) : 0;
          return { path: r.page, views: currentViews, change };
        });
      }, [], "analytics:topPages"),
      safeQuery(async () => {
        const pageRows = await prisma.$queryRaw<Array<{ name: string; visitors: bigint; pageviews: bigint }>>`
          SELECT to_char("createdAt", 'Mon YYYY') as name,
                 COUNT(DISTINCT "visitorId")::bigint as visitors,
                 COUNT(*)::bigint as pageviews
          FROM "PageView"
          WHERE "createdAt" >= ${startDate}
          GROUP BY to_char("createdAt", 'YYYY-MM')
          ORDER BY to_char("createdAt", 'YYYY-MM') ASC
        `;
        const interRows = await prisma.$queryRaw<Array<{ name: string; count: bigint }>>`
          SELECT to_char("createdAt", 'Mon YYYY') as name,
                 COUNT(*)::bigint as count
          FROM "Interaction"
          WHERE "createdAt" >= ${startDate}
          GROUP BY to_char("createdAt", 'YYYY-MM')
          ORDER BY to_char("createdAt", 'YYYY-MM') ASC
        `;
        const interMap = new Map(interRows.map(r => [r.name, Number(r.count)]));
        return pageRows.map(r => ({
          name: r.name,
          visitors: Number(r.visitors),
          pageviews: Number(r.pageviews),
          interactions: interMap.get(r.name) || 0,
        }));
      }, [], "analytics:monthlyData"),
    ]);

    return successResponse({
      totalProjects, totalSkills, totalQuestions, totalReviews,
      totalContacts, totalServices, pendingQuestions, pendingReviews,
      topPages, monthlyData, period,
    });
  } catch (err) {
    return serverErrorResponse(err, "analytics/detailed");
  }
}
