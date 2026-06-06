import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAuth, serverErrorResponse, withRateLimit, getClientIp } from "@/lib/api-utils";
import { createAuditLog } from "@/lib/audit";
import { getToken } from "next-auth/jwt";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  const rateLimitError = await withRateLimit(request, "admin/controls/GET");
  if (rateLimitError) return rateLimitError;

  try {
    const controls = await prisma.websiteControl.findMany({ orderBy: { category: "asc" } });
    return successResponse(controls);
  } catch (err) {
    return serverErrorResponse(err, "admin/controls");
  }
}

export async function PUT(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  const rateLimitError = await withRateLimit(req, "admin/controls/PUT");
  if (rateLimitError) return rateLimitError;

  try {
    const body = await req.json();

    if (body.controls && Array.isArray(body.controls)) {
      const updated = await prisma.$transaction(async (tx) => {
        const results = [];
        for (const c of body.controls) {
          if (!c.key) continue;
          const control = await tx.websiteControl.upsert({
            where: { key: c.key },
            update: { enabled: c.enabled },
            create: { key: c.key, name: c.key, enabled: c.enabled, category: "system" },
          });
          results.push(control);
        }
        return results;
      });

      const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
      await createAuditLog({
        adminId: token?.id ? parseInt(token.id as string) : null,
        action: "controls.updated",
        resource: "website_control",
        details: `Updated ${updated.length} controls`,
        ip: getClientIp(req),
      });

      revalidatePath("/api/site-data");
      revalidatePath("/", "layout");

      return successResponse(updated);
    }

    const { key, enabled } = body;
    if (!key) return errorResponse("Control key is required");

    const control = await prisma.websiteControl.upsert({
      where: { key },
      update: { enabled },
      create: { key, name: key, enabled, category: "system" },
    });

    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
    await createAuditLog({
      adminId: token?.id ? parseInt(token.id as string) : null,
      action: "control.updated",
      resource: "website_control",
      details: `Toggled control "${key}" to ${enabled}`,
      ip: getClientIp(req),
    });

    revalidatePath("/api/site-data");
    revalidatePath("/", "layout");

    return successResponse(control);
  } catch (err) {
    return serverErrorResponse(err, "admin/controls:update");
  }
}
