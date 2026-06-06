import { NextRequest } from "next/server";
import { prisma, safeQuery } from "@/lib/prisma";
import { ActivityLog } from "@prisma/client";
import {
  successResponse,
  requireAuth,
  serverErrorResponse,
  withRateLimit,
} from "@/lib/api-utils";

export const dynamic = "force-dynamic";

// Raw query result types
interface RawCountRow {
  count: bigint;
}

interface RawDateCountRow {
  date: Date;
  count: bigint;
}

interface RawTypeCountRow {
  type: string;
  count: bigint;
}

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  const rateLimitError = await withRateLimit(request, "admin/dashboard");
  if (rateLimitError) return rateLimitError;

  try {
    const now = new Date();

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      newUsersThisMonth,
      totalChatSessions,
      totalInteractions,
      unansweredQuestions,   // questions with no admin reply
      pendingContactCount,   // all pending questions (support tickets)
      totalPageViews,
      uniqueVisitors,
      dailyPageViews,
      interactionCounts,
      recentActivity,
      unreadNotifications,
      activeFeatures,
    ] = await Promise.all([
      // Users
      safeQuery(
        () => prisma.adminUser.count(),
        0,
        "dashboard:totalUsers"
      ),
      safeQuery(
        () => prisma.adminUser.count({ where: { createdAt: { gte: firstDayOfMonth } } }),
        0,
        "dashboard:newUsersThisMonth"
      ),

      // Interactions
      safeQuery(
        () => prisma.interaction.count({ where: { type: "chat" } }),
        0,
        "dashboard:chatSessions"
      ),
      safeQuery(
        () => prisma.interaction.count(),
        0,
        "dashboard:totalInteractions"
      ),

      // Questions
      safeQuery(
        () => prisma.question.count({ where: { status: "pending", adminReply: null } }),
        0,
        "dashboard:unansweredQuestions"
      ),
      safeQuery(
        () => prisma.question.count({ where: { status: "pending" } }),
        0,
        "dashboard:pendingContacts"
      ),

      // Page views
      safeQuery(
        () => prisma.pageView.count(),
        0,
        "dashboard:totalPageViews"
      ),
      safeQuery(
        async () => {
          const result = await prisma.$queryRaw<RawCountRow[]>`
            SELECT COUNT(DISTINCT "visitorId") as count
            FROM "PageView"
            WHERE "createdAt" >= ${thirtyDaysAgo}
          `;
          return Number(result[0]?.count ?? 0);
        },
        0,
        "dashboard:uniqueVisitors"
      ),
      safeQuery(
        async () => {
          const rows = await prisma.$queryRaw<RawDateCountRow[]>`
            SELECT "createdAt"::date AS date, COUNT(*)::bigint AS count
            FROM "PageView"
            WHERE "createdAt" >= ${thirtyDaysAgo}
            GROUP BY "createdAt"::date
            ORDER BY date ASC
          `;
          return rows.map((r) => ({
            date: r.date.toISOString().slice(0, 10),
            count: Number(r.count),
          }));
        },
        [],
        "dashboard:dailyPageViews"
      ),

      // Interaction breakdown
      safeQuery(
        async () => {
          const rows = await prisma.$queryRaw<RawTypeCountRow[]>`
            SELECT "type", COUNT(*)::bigint AS count
            FROM "Interaction"
            WHERE "createdAt" >= ${thirtyDaysAgo}
            GROUP BY "type"
            ORDER BY count DESC
          `;
          return rows.map((r) => ({ type: r.type, count: Number(r.count) }));
        },
        [],
        "dashboard:interactionCounts"
      ),

      // Activity & flags
      safeQuery(
        () => prisma.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
        [],
        "dashboard:recentActivity"
      ),
      safeQuery(
        () => prisma.notification.count({ where: { read: false } }),
        0,
        "dashboard:unreadNotifications"
      ),
      safeQuery(
        () => prisma.featureFlag.count({ where: { enabled: true } }),
        0,
        "dashboard:activeFeatures"
      ),
    ]);

    return successResponse({
      totalUsers,
      newUsersThisMonth,
      totalChatSessions,
      totalInteractions,
      unansweredQuestions,
      unansweredContacts: pendingContactCount,   // kept original key for API compatibility
      openSupportTickets: pendingContactCount,    // same value, different consumer
      totalPageViews,
      uniqueVisitors,
      dailyPageViews,
      interactions: interactionCounts,
      recentActivity: recentActivity.map((a: ActivityLog) => ({
        id: a.id,
        action: a.action,
        detail: a.detail,
        type: a.type,
        time: a.createdAt,
      })),
      unreadNotifications,
      activeFeatures,
    });
  } catch (err) {
    return serverErrorResponse(err, "admin/dashboard");
  }
}