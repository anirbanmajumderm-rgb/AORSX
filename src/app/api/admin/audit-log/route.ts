import { prisma, safeQuery } from "@/lib/prisma";
import { successResponse, requireAuth, serverErrorResponse, errorResponse, withRateLimit, getClientIp } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { createAuditLog } from "@/lib/audit";
import { getToken } from "next-auth/jwt";

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  const rateLimitError = await withRateLimit(request, "admin/audit-log/GET");
  if (rateLimitError) return rateLimitError;
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const [logs, total] = await Promise.all([
      safeQuery(() => prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: limit, skip: offset }), [], "audit-log:list"),
      safeQuery(() => prisma.auditLog.count(), 0, "audit-log:count"),
    ]);
    return successResponse({ logs, total, limit, offset });
  } catch (err) {
    return serverErrorResponse(err, "admin/audit-log");
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  const rateLimitError = await withRateLimit(request, "admin/audit-log/POST");
  if (rateLimitError) return rateLimitError;
  try {
    const body = await request.json();
    if (!body.action) return errorResponse("Action is required", 400);
    const log = await prisma.auditLog.create({
      data: {
        adminId: body.adminId || null,
        action: body.action,
        resource: body.resource || null,
        resourceId: body.resourceId || null,
        details: body.details || null,
        ip: body.ip || null,
      },
    });

    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
    await createAuditLog({
      adminId: token?.id ? parseInt(token.id as string) : null,
      action: "audit_log.created",
      resource: "audit_log",
      resourceId: log.id,
      details: `Admin manually created audit log entry: ${body.action}`,
      ip: getClientIp(request),
    });

    return successResponse(log, 201);
  } catch (err) {
    return serverErrorResponse(err, "admin/audit-log");
  }
}
