import { prisma, safeQuery } from "@/lib/prisma";
import { successResponse, requireAuth, serverErrorResponse } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalPageViews, uniqueVisitors, dailyPageViews, interactions, interactionTypes] = await Promise.all([
      safeQuery(() => prisma.pageView.count(), 0, "analytics:totalPageViews"),
      safeQuery(async () => {
        const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(DISTINCT "visitorId") as count FROM "PageView" WHERE "createdAt" >= ${thirtyDaysAgo}
        `;
        return Number(result[0]?.count || 0);
      }, 0, "analytics:uniqueVisitors"),
      safeQuery(async () => {
        const rows = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
          SELECT "createdAt"::date as date, COUNT(*)::bigint as count
          FROM "PageView"
          WHERE "createdAt" >= ${thirtyDaysAgo}
          GROUP BY "createdAt"::date
          ORDER BY date ASC
        `;
        return rows.map(r => ({ date: r.date.toISOString().slice(0, 10), count: Number(r.count) }));
      }, [], "analytics:dailyPageViews"),
      safeQuery(async () => {
        const rows = await prisma.$queryRaw<Array<{ date: Date; type: string; count: bigint }>>`
          SELECT "createdAt"::date as date, "type", COUNT(*)::bigint as count
          FROM "Interaction"
          WHERE "createdAt" >= ${thirtyDaysAgo}
          GROUP BY "createdAt"::date, "type"
          ORDER BY date ASC
        `;
        return rows.map(r => ({ date: r.date.toISOString().slice(0, 10), type: r.type, count: Number(r.count) }));
      }, [], "analytics:interactions"),
      safeQuery(async () => {
        const rows = await prisma.$queryRaw<Array<{ type: string; count: bigint }>>`
          SELECT "type", COUNT(*)::bigint as count
          FROM "Interaction"
          GROUP BY "type"
          ORDER BY count DESC
        `;
        return rows.map(r => ({ type: r.type, count: Number(r.count) }));
      }, [], "analytics:interactionTypes"),
    ]);

    const totalInteractions = interactions.reduce((sum: number, d: any) => sum + d.count, 0);

    return successResponse({
      totalPageViews,
      uniqueVisitors,
      dailyPageViews,
      interactions,
      interactionTypes,
      totalInteractions,
    });
  } catch (err) {
    return serverErrorResponse(err, "admin/analytics");
  }
}
