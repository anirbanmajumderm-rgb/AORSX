import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, requireAuth, serverErrorResponse, withRateLimit } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  const rateLimitError = await withRateLimit(req, "admin/activity/GET");
  if (rateLimitError) return rateLimitError;

  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    const activities = await prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return successResponse(activities);
  } catch (err) {
    return serverErrorResponse(err, "admin/activity");
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  const rateLimitError = await withRateLimit(req, "admin/activity/POST");
  if (rateLimitError) return rateLimitError;

  try {
    const body = await req.json();
    const entry = await prisma.activityLog.create({
      data: {
        action: body.action,
        detail: body.detail || null,
        type: body.type || "info",
      },
    });
    return successResponse(entry, 201);
  } catch (err) {
    return serverErrorResponse(err, "admin/activity:create");
  }
}
