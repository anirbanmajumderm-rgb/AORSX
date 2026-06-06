import { NextRequest } from "next/server";
import { hashSync } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAuth, requireFounder, serverErrorResponse, notFoundResponse, withRateLimit, getClientIp } from "@/lib/api-utils";
import { createAuditLog } from "@/lib/audit";
import { getToken } from "next-auth/jwt";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  const founderError = await requireFounder();
  if (founderError) return founderError;

  try {
    const { id } = await params;
    const user = await prisma.adminUser.findUnique({
      where: { id: parseInt(id) },
      include: { role: true },
    });
    if (!user) return notFoundResponse("User");
    return successResponse(user);
  } catch (err) {
    return serverErrorResponse(err, "admin/users:get");
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  const founderError = await requireFounder();
  if (founderError) return founderError;
  const rateLimitError = await withRateLimit(req, "admin/users/[id]/PUT");
  if (rateLimitError) return rateLimitError;

  try {
    const body = await req.json();
    const { name, email, password, roleId, status } = body;
    const { id } = await params;

    const existing = await prisma.adminUser.findUnique({ where: { id: parseInt(id) } });
    if (!existing) return notFoundResponse("User");

    if (email && email !== existing.email) {
      const emailTaken = await prisma.adminUser.findUnique({ where: { email } });
      if (emailTaken) return errorResponse("Email already in use");
    }

    const user = await prisma.adminUser.update({
      where: { id: parseInt(id) },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(password !== undefined && { password: password ? hashSync(password, 12) : null }),
        ...(roleId !== undefined && { roleId: roleId ? parseInt(roleId) : null }),
        ...(status !== undefined && { status }),
      },
      include: { role: true },
    });

    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
    await createAuditLog({
      adminId: token?.id ? parseInt(token.id as string) : null,
      action: "user.updated",
      resource: "admin_user",
      resourceId: parseInt(id),
      details: `Updated user "${user.name}" (${user.email})`,
      ip: getClientIp(req),
    });

    return successResponse(user);
  } catch (err) {
    return serverErrorResponse(err, "admin/users:update");
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  const founderError = await requireFounder();
  if (founderError) return founderError;
  const rateLimitError = await withRateLimit(req, "admin/users/[id]/DELETE");
  if (rateLimitError) return rateLimitError;

  try {
    const { id } = await params;
    const existing = await prisma.adminUser.findUnique({ where: { id: parseInt(id) } });
    await prisma.adminUser.delete({ where: { id: parseInt(id) } });

    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
    await createAuditLog({
      adminId: token?.id ? parseInt(token.id as string) : null,
      action: "user.deleted",
      resource: "admin_user",
      resourceId: parseInt(id),
      details: `Deleted user "${existing?.name || id}"`,
      ip: getClientIp(req),
    });

    return successResponse({ deleted: true });
  } catch (err) {
    return serverErrorResponse(err, "admin/users:delete");
  }
}
