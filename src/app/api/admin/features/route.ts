import { prisma, safeQuery } from "@/lib/prisma";
import { successResponse, requireAuth, serverErrorResponse, errorResponse, withRateLimit, getClientIp } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/audit";
import { getToken } from "next-auth/jwt";

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  const rateLimitError = await withRateLimit(request, "admin/features/GET");
  if (rateLimitError) return rateLimitError;
  try {
    const [flags, auditLogs] = await Promise.all([
      safeQuery(() => prisma.featureFlag.findMany({ orderBy: { label: "asc" } }), [], "features:list"),
      safeQuery(() => prisma.auditLog.findMany({ where: { resource: "feature_flag" }, orderBy: { createdAt: "desc" }, take: 20 }), [], "features:audit"),
    ]);
    return successResponse({ flags, auditLogs });
  } catch (err) {
    return serverErrorResponse(err, "admin/features");
  }
}

export async function PUT(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  const rateLimitError = await withRateLimit(request, "admin/features/PUT");
  if (rateLimitError) return rateLimitError;
  try {
    const body = await request.json();
    if (!body.key) return errorResponse("Key is required", 400);
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });

    const flag = await prisma.featureFlag.upsert({
      where: { key: body.key },
      update: { enabled: body.enabled, label: body.label ?? undefined, description: body.description ?? undefined, updatedBy: token?.id ? parseInt(token.id as string) : null },
      create: { key: body.key, label: body.label || body.key, description: body.description || null, enabled: body.enabled ?? false },
    });

    await createAuditLog({
      adminId: token?.id ? parseInt(token.id as string) : null,
      action: body.enabled ? "feature.enabled" : "feature.disabled",
      resource: "feature_flag",
      details: `Toggled "${body.key}" to ${body.enabled}`,
      ip: getClientIp(request),
    });

    revalidatePath("/api/site-data");
    revalidatePath("/", "layout");

    return successResponse(flag);
  } catch (err) {
    return serverErrorResponse(err, "admin/features");
  }
}
