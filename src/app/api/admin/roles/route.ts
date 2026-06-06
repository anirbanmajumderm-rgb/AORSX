import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAuth, requireFounder, serverErrorResponse, withRateLimit, getClientIp } from "@/lib/api-utils";
import { createAuditLog } from "@/lib/audit";
import { getToken } from "next-auth/jwt";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  const founderError = await requireFounder();
  if (founderError) return founderError;
  const rateLimitError = await withRateLimit(request, "admin/roles/GET");
  if (rateLimitError) return rateLimitError;

  try {
    const roles = await prisma.role.findMany({
      include: { _count: { select: { users: true } } },
      orderBy: { createdAt: "asc" },
    });
    return successResponse(roles);
  } catch (err) {
    return serverErrorResponse(err, "admin/roles");
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  const founderError = await requireFounder();
  if (founderError) return founderError;
  const rateLimitError = await withRateLimit(req, "admin/roles/POST");
  if (rateLimitError) return rateLimitError;

  try {
    const body = await req.json();
    const { name, description, permissions } = body;

    if (!name) return errorResponse("Role name is required");

    const role = await prisma.role.create({
      data: {
        name,
        description: description || null,
        permissions: permissions ? JSON.stringify(permissions) : null,
      },
    });

    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
    await createAuditLog({
      adminId: token?.id ? parseInt(token.id as string) : null,
      action: "role.created",
      resource: "role",
      resourceId: role.id,
      details: `Created role "${role.name}"`,
      ip: getClientIp(req),
    });

    return successResponse(role, 201);
  } catch (err) {
    return serverErrorResponse(err, "admin/roles:create");
  }
}
