import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, serverErrorResponse, getClientIp, withRateLimit } from "@/lib/api-utils";
import { verifyBackupCode, createSessionToken, setSessionCookie, verifyTempToken } from "@/lib/two-factor";
import { createAuditLog } from "@/lib/audit";

export async function POST(request: NextRequest) {
  const rateLimitError = await withRateLimit(request, "2fa/backup");
  if (rateLimitError) return rateLimitError;

  try {
    const body = await request.json();
    const { tempToken, backupCode } = body;

    if (!tempToken || !backupCode) {
      return errorResponse("Temporary token and backup code are required", 400);
    }

    const payload = verifyTempToken(tempToken);
    if (!payload) {
      return errorResponse("Session expired. Please login again.", 401);
    }

    const admin = await prisma.admin.findUnique({
      where: { id: payload.adminId },
      select: {
        id: true, email: true, name: true, image: true,
        twoFactorEnabled: true, twoFactorBackupCodes: true,
      },
    });

    if (!admin || !admin.twoFactorEnabled) {
      return errorResponse("Two-factor authentication is not enabled for this account", 400);
    }

    if (!admin.twoFactorBackupCodes || admin.twoFactorBackupCodes.length === 0) {
      return errorResponse("No backup codes remaining", 400);
    }

    const codeIndex = await verifyBackupCode(backupCode, admin.twoFactorBackupCodes);
    if (codeIndex === null) {
      createAuditLog({
        adminId: admin.id,
        action: "2fa.backup_code.failed",
        resource: "admin",
        resourceId: admin.id,
        details: "Invalid backup code used during login",
        ip: getClientIp(request),
      });
      return errorResponse("Invalid backup code", 401);
    }

    const updatedCodes = [...admin.twoFactorBackupCodes];
    updatedCodes.splice(codeIndex, 1);

    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        twoFactorBackupCodes: updatedCodes,
        twoFactorVerifiedAt: new Date(),
      },
    });

    const jwtToken = await createSessionToken(admin);
    const response = successResponse({
      message: "Login successful with backup code",
      user: { id: admin.id, email: admin.email, name: admin.name },
      remainingCodes: updatedCodes.length,
    });
    setSessionCookie(response, jwtToken);

    createAuditLog({
      adminId: admin.id,
      action: "2fa.backup_code.used",
      resource: "admin",
      resourceId: admin.id,
      details: "Backup code used for login",
      ip: getClientIp(request),
    });

    return response;
  } catch (err) {
    return serverErrorResponse(err, "admin/2fa/backup-code");
  }
}
