import { NextRequest } from "next/server";
import { prisma, safeQuery } from "@/lib/prisma";
import { successResponse, requireAuth, serverErrorResponse, withRateLimit } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  const rateLimitError = await withRateLimit(request, "admin/dashboard");
  if (rateLimitError) return rateLimitError;
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const [totalUsers, newUsersThisMonth, totalChatSessions, unansweredQuestions, unansweredContacts, totalPageViews, uniqueVisitors, dailyPageViews, interactionCounts, recentActivity, unreadNotifications, activeFeatures, totalInteractions, openSupportTickets] = await Promise.all([
      safeQuery(() => prisma.adminUser.count(), 0, "dashboard:totalUsers"),
      safeQuery(() => prisma.adminUser.count({ where: { createdAt: { gte: firstDayOfMonth } } }), 0, "dashboard:newUsers"),
      safeQuery(() => prisma.interaction.count({ where: { type: "chat" } }), 0, "dashboard:chatSessions"),
      safeQuery(() => prisma.question.count({ where: { status: "pending", adminReply: null } }), 0, "dashboard:unanswered"),
      safeQuery(() => prisma.question.count({ where: { status: "pending" } }), 0, "dashboard:unansweredContacts"),
      safeQuery(() => prisma.pageView.count(), 0, "dashboard:pageViews"),
      safeQuery(async () => {
        const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(DISTINCT "visitorId") as count FROM "PageView" WHERE "createdAt" >= ${thirtyDaysAgo}
        `;
        return Number(result[0]?.count || 0);
      }, 0, "dashboard:uniqueVisitors"),
      safeQuery(async () => {
        const rows = await prisma.$queryRaw<Array<{ date: Date; count: bigint }>>`
          SELECT "createdAt"::date as date, COUNT(*)::bigint as count
          FROM "PageView"
          WHERE "createdAt" >= ${thirtyDaysAgo}
          GROUP BY "createdAt"::date
          ORDER BY date ASC
        `;
        return rows.map(r => ({ date: r.date.toISOString().slice(0, 10), count: Number(r.count) }));
      }, [], "dashboard:dailyPageViews"),
      safeQuery(async () => {
        const rows = await prisma.$queryRaw<Array<{ type: string; count: bigint }>>`
          SELECT "type", COUNT(*)::bigint as count
          FROM "Interaction"
          WHERE "createdAt" >= ${thirtyDaysAgo}
          GROUP BY "type"
          ORDER BY count DESC
        `;
        return rows.map(r => ({ type: r.type, count: Number(r.count) }));
      }, [], "dashboard:interactions"),
      safeQuery(() => prisma.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 10 }), [], "dashboard:activity"),
      safeQuery(() => prisma.notification.count({ where: { read: false } }), 0, "dashboard:unreadNotifications"),
      safeQuery(() => prisma.featureFlag.count({ where: { enabled: true } }), 0, "dashboard:activeFeatures"),
      safeQuery(() => prisma.interaction.count(), 0, "dashboard:totalInteractions"),
      safeQuery(() => prisma.question.count({ where: { status: "pending" } }), 0, "dashboard:openSupportTickets"),
    ]);

    return successResponse({
      totalUsers,
      newUsersThisMonth,
      totalChatSessions,
      unansweredQuestions,
      unansweredContacts,
      totalPageViews,
      uniqueVisitors,
      totalInteractions,
      openSupportTickets,
      dailyPageViews,
      interactions: interactionCounts,
      recentActivity: (recentActivity as any[]).map(a => ({
        id: a.id, action: a.action, detail: a.detail, type: a.type, time: a.createdAt,
      })),
      unreadNotifications,
      activeFeatures,
    });
  } catch (err) {
    return serverErrorResponse(err, "admin/dashboard");
  }
}
