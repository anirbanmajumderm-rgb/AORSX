import { prisma } from "@/lib/prisma";
import { successResponse, requireAuth, serverErrorResponse, slugify, withRateLimit, getClientIp, errorResponse } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/audit";
import { getToken } from "next-auth/jwt";

async function getProject(id: number) {
  return prisma.project.findUnique({ where: { id } });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  const rateLimitError = await withRateLimit(req, "admin/projects/PUT");
  if (rateLimitError) return rateLimitError;
  try {
    const { id } = await params;
    const numId = parseInt(id);
    if (isNaN(numId)) return errorResponse("Invalid ID");
    const existing = await getProject(numId);
    if (!existing) return errorResponse("Project not found", 404);

    const body = await req.json();
    const data: Record<string, unknown> = { ...body };
    if (body.title) {
      data.slug = slugify(body.title);
    }
    delete data.id;
    delete data.createdAt;
    delete data.updatedAt;

    const project = await prisma.project.update({ where: { id: numId }, data });

    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
    await createAuditLog({
      adminId: token?.id ? parseInt(token.id as string) : null,
      action: "project.updated",
      resource: "project",
      resourceId: project.id,
      details: `Updated project: ${project.title}`,
      ip: getClientIp(req),
    });

    revalidatePath("/api/site-data");
    revalidatePath("/", "layout");
    revalidatePath("/projects", "page");
    revalidatePath("/projects/[slug]", "page");

    return successResponse(project);
  } catch (err) {
    return serverErrorResponse(err, "admin/projects");
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  const rateLimitError = await withRateLimit(req, "admin/projects/DELETE");
  if (rateLimitError) return rateLimitError;
  try {
    const { id } = await params;
    const numId = parseInt(id);
    if (isNaN(numId)) return errorResponse("Invalid ID");
    const existing = await getProject(numId);
    if (!existing) return errorResponse("Project not found", 404);

    await prisma.project.delete({ where: { id: numId } });

    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
    await createAuditLog({
      adminId: token?.id ? parseInt(token.id as string) : null,
      action: "project.deleted",
      resource: "project",
      resourceId: numId,
      details: `Deleted project: ${existing.title}`,
      ip: getClientIp(req),
    });

    revalidatePath("/api/site-data");
    revalidatePath("/", "layout");
    revalidatePath("/projects", "page");
    revalidatePath("/projects/[slug]", "page");

    return successResponse({ deleted: true });
  } catch (err) {
    return serverErrorResponse(err, "admin/projects");
  }
}
