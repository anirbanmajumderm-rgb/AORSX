import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAuth, serverErrorResponse, withRateLimit, getClientIp } from "@/lib/api-utils";
import { auth } from "@/lib/auth";
import { compare } from "bcryptjs";
import { createAuditLog } from "@/lib/audit";

export async function POST(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  const rateLimitError = await withRateLimit(request, "2fa/disable");
  if (rateLimitError) return rateLimitError;

  try {
    const session = await auth();
    const adminEmail = session?.user?.email;
    if (!adminEmail) return errorResponse("Session not found", 401);

    const body = await request.json();
    const { password } = body;

    if (!password) return errorResponse("Password is required to disable 2FA", 400);

    const admin = await prisma.admin.findUnique({
      where: { email: adminEmail },
      select: { id: true, password: true, twoFactorEnabled: true },
    });
    if (!admin) return errorResponse("Admin not found", 404);
    if (!admin.twoFactorEnabled) return errorResponse("Two-factor authentication is not enabled", 400);

    const isPasswordValid = await compare(password, admin.password);
    if (!isPasswordValid) {
      createAuditLog({
        adminId: admin.id,
        action: "2fa.disable.invalid_password",
        resource: "admin",
        resourceId: admin.id,
        details: "Invalid password provided to disable 2FA",
        ip: getClientIp(request),
      });
      return errorResponse("Invalid password", 401);
    }

    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
        twoFactorEnabled: false,
        twoFactorVerifiedAt: null,
      },
    });

    createAuditLog({
      adminId: admin.id,
      action: "2fa.disabled",
      resource: "admin",
      resourceId: admin.id,
      details: "Two-factor authentication disabled",
      ip: getClientIp(request),
    });

    return successResponse({ message: "Two-factor authentication disabled" });
  } catch (err) {
    return serverErrorResponse(err, "admin/2fa/disable");
  }
}
