import { prisma } from "@/lib/prisma";
import { successResponse, requireAuth, serverErrorResponse, notFoundResponse, withRateLimit, getClientIp } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/audit";
import { getToken } from "next-auth/jwt";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const member = await prisma.teamMember.findUnique({ where: { id } });
    if (!member) return notFoundResponse("Team member");
    return successResponse(member);
  } catch (err) {
    return serverErrorResponse(err, "admin/team/[id]");
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  const rateLimitError = await withRateLimit(request, "admin/team/[id]/PUT");
  if (rateLimitError) return rateLimitError;
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const body = await request.json();
    const member = await prisma.teamMember.update({
      where: { id },
      data: {
        name: body.name ?? undefined,
        role: body.role ?? undefined,
        bio: body.bio ?? undefined,
        photo: body.photo ?? undefined,
        email: body.email ?? undefined,
        phone: body.phone ?? undefined,
        linkedin: body.linkedin ?? undefined,
        twitter: body.twitter ?? undefined,
        github: body.github ?? undefined,
        displayOrder: body.displayOrder ?? undefined,
        isFounder: body.isFounder ?? undefined,
        isActive: body.isActive ?? undefined,
      },
    });
    revalidatePath("/api/site-data");
    revalidatePath("/", "layout");
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET }); // eslint-disable-line @typescript-eslint/no-explicit-any
    await createAuditLog({
      adminId: token?.id ? parseInt(token.id as string) : null,
      action: "team.updated",
      resource: "team_member",
      resourceId: id,
      details: `Updated team member "${member.name}"`,
      ip: getClientIp(request),
    });
    return successResponse(member);
  } catch (err) {
    return serverErrorResponse(err, "admin/team/[id]");
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  const rateLimitError = await withRateLimit(request, "admin/team/[id]/DELETE");
  if (rateLimitError) return rateLimitError;
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const member = await prisma.teamMember.findUnique({ where: { id } });
    await prisma.teamMember.delete({ where: { id } });
    revalidatePath("/api/site-data");
    revalidatePath("/", "layout");
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET }); // eslint-disable-line @typescript-eslint/no-explicit-any
    await createAuditLog({
      adminId: token?.id ? parseInt(token.id as string) : null,
      action: "team.deleted",
      resource: "team_member",
      resourceId: id,
      details: `Deleted team member "${member?.name || id}"`,
      ip: getClientIp(request),
    });
    return successResponse({ success: true });
  } catch (err) {
    return serverErrorResponse(err, "admin/team/[id]");
  }
}
