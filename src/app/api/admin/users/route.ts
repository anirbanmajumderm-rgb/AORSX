import { NextRequest } from "next/server";
import { hashSync } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAuth, requireFounder, serverErrorResponse, withRateLimit, getClientIp } from "@/lib/api-utils";
import { createAuditLog, notifyAdmins } from "@/lib/audit";
import { getToken } from "next-auth/jwt";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  const founderError = await requireFounder();
  if (founderError) return founderError;
  const rateLimitError = await withRateLimit(req, "admin/users/GET");
  if (rateLimitError) return rateLimitError;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.adminUser.findMany({
        where,
        include: { role: true },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.adminUser.count({ where }),
    ]);

    return successResponse({ users, total });
  } catch (err) {
    return serverErrorResponse(err, "admin/users");
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  const founderError = await requireFounder();
  if (founderError) return founderError;
  const rateLimitError = await withRateLimit(req, "admin/users/POST");
  if (rateLimitError) return rateLimitError;

  try {
    const body = await req.json();
    const { name, email, password, roleId, status } = body;

    if (!name || !email) {
      return errorResponse("Name and email are required");
    }

    const existing = await prisma.adminUser.findUnique({ where: { email } });
    if (existing) {
      return errorResponse("Email already exists");
    }

    const user = await prisma.adminUser.create({
      data: {
        name,
        email,
        password: password ? hashSync(password, 12) : null,
        roleId: roleId ? parseInt(roleId) : null,
        status: status || "active",
      },
      include: { role: true },
    });

    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
    await createAuditLog({
      adminId: token?.id ? parseInt(token.id as string) : null,
      action: "user.created",
      resource: "admin_user",
      resourceId: user.id,
      details: `Created user "${user.name}" (${user.email})`,
      ip: getClientIp(req),
    });
    await notifyAdmins({ title: "New Admin User Created", description: `Admin user "${user.name}" (${user.email}) was created.` });

    return successResponse(user, 201);
  } catch (err) {
    return serverErrorResponse(err, "admin/users:create");
  }
}
