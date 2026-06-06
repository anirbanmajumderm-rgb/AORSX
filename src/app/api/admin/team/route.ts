import { prisma, safeQuery } from "@/lib/prisma";
import { successResponse, requireAuth, serverErrorResponse, errorResponse, withRateLimit, getClientIp } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { createAuditLog, notifyAdmins } from "@/lib/audit";
import { getToken } from "next-auth/jwt";

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  const rateLimitError = await withRateLimit(request, "admin/team/GET");
  if (rateLimitError) return rateLimitError;
  try {
    const members = await safeQuery(() => prisma.teamMember.findMany({ orderBy: { displayOrder: "asc" } }), [], "team:list");
    return successResponse(members);
  } catch (err) {
    return serverErrorResponse(err, "admin/team");
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  const rateLimitError = await withRateLimit(request, "admin/team/POST");
  if (rateLimitError) return rateLimitError;
  try {
    const body = await request.json();
    if (!body.name || !body.role) {
      return errorResponse("Name and role are required", 400);
    }
    const member = await prisma.teamMember.create({
      data: {
        name: body.name,
        role: body.role,
        bio: body.bio || null,
        photo: body.photo || null,
        email: body.email || null,
        phone: body.phone || null,
        linkedin: body.linkedin || null,
        twitter: body.twitter || null,
        github: body.github || null,
        displayOrder: body.displayOrder ?? 0,
        isFounder: body.isFounder ?? false,
        isActive: body.isActive ?? true,
      },
    });
    revalidatePath("/api/site-data");
    revalidatePath("/", "layout");
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
    await createAuditLog({
      adminId: token?.id ? parseInt(token.id as string) : null,
      action: "team.created",
      resource: "team_member",
      resourceId: member.id,
      details: `Created team member "${member.name}"`,
      ip: getClientIp(request),
    });
    await notifyAdmins({ title: "New Team Member Added", description: `Team member "${member.name}" was added.` });
    return successResponse(member, 201);
  } catch (err) {
    return serverErrorResponse(err, "admin/team");
  }
}
