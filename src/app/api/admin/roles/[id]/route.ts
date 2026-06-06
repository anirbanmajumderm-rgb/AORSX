import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, notFoundResponse, requireAuth, requireFounder, serverErrorResponse, withRateLimit, getClientIp } from "@/lib/api-utils";
import { createAuditLog } from "@/lib/audit";
import { getToken } from "next-auth/jwt";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  const founderError = await requireFounder();
  if (founderError) return founderError;
  const rateLimitError = await withRateLimit(req, "admin/roles/[id]/PUT");
  if (rateLimitError) return rateLimitError;

  try {
    const body = await req.json();
    const { id } = await params;
    const existing = await prisma.role.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return notFoundResponse("Role");

    const role = await prisma.role.update({
      where: { id: parseInt(id) },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.permissions !== undefined && { permissions: body.permissions }),
      },
    });

    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
    await createAuditLog({
      adminId: token?.id ? parseInt(token.id as string) : null,
      action: "role.updated",
      resource: "role",
      resourceId: parseInt(id),
      details: `Updated role "${role.name}"`,
      ip: getClientIp(req),
    });

    return successResponse(role);
  } catch (err) {
    return serverErrorResponse(err, "admin/roles:update");
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  const founderError = await requireFounder();
  if (founderError) return founderError;
  const rateLimitError = await withRateLimit(req, "admin/roles/[id]/DELETE");
  if (rateLimitError) return rateLimitError;

  try {
    const { id } = await params;
    const existing = await prisma.role.findUnique({ where: { id: parseInt(id) } });
    await prisma.role.delete({ where: { id: parseInt(id) } });

    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
    await createAuditLog({
      adminId: token?.id ? parseInt(token.id as string) : null,
      action: "role.deleted",
      resource: "role",
      resourceId: parseInt(id),
      details: `Deleted role "${existing?.name || id}"`,
      ip: getClientIp(req),
    });

    return successResponse({ deleted: true });
  } catch (err) {
    return serverErrorResponse(err, "admin/roles:delete");
  }
}
