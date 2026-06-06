import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAuth, serverErrorResponse, withRateLimit } from "@/lib/api-utils";
import { auth } from "@/lib/auth";
import { encryptSecret, verifyTOTP, generateBackupCodes, hashBackupCodes } from "@/lib/two-factor";
import { createAuditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  const rateLimitError = await withRateLimit(request, "2fa/verify-setup");
  if (rateLimitError) return rateLimitError;

  try {
    const session = await auth();
    const adminEmail = session?.user?.email;
    if (!adminEmail) return errorResponse("Session not found", 401);

    const admin = await prisma.admin.findUnique({
      where: { email: adminEmail },
      select: { id: true, twoFactorEnabled: true },
    });
    if (!admin) return errorResponse("Admin not found", 404);
    if (admin.twoFactorEnabled) return errorResponse("Two-factor authentication is already enabled", 400);

    const body = await request.json();
    const { secret, token } = body;

    if (!secret || !token) {
      return errorResponse("Secret and verification token are required", 400);
    }

    const isValid = verifyTOTP(token, secret);
    if (!isValid) {
      createAuditLog({
        adminId: admin.id,
        action: "2fa.setup.invalid_otp",
        resource: "admin",
        resourceId: admin.id,
        details: "Invalid OTP during 2FA setup",
        ip: getClientIp(request),
      });
      return errorResponse("Invalid verification code. Please try again.", 400);
    }

    const encryptedSecret = encryptSecret(secret);
    const backupCodes = generateBackupCodes();
    const hashedBackupCodes = await hashBackupCodes(backupCodes);

    await prisma.admin.update({
      where: { id: admin.id },
      data: {
        twoFactorSecret: encryptedSecret,
        twoFactorBackupCodes: hashedBackupCodes,
        twoFactorEnabled: true,
        twoFactorVerifiedAt: new Date(),
      },
    });

    createAuditLog({
      adminId: admin.id,
      action: "2fa.enabled",
      resource: "admin",
      resourceId: admin.id,
      details: "Two-factor authentication enabled",
      ip: getClientIp(request),
    });

    return successResponse({
      message: "Two-factor authentication enabled successfully",
      backupCodes,
    });
  } catch (err) {
    return serverErrorResponse(err, "admin/2fa/verify-setup");
  }
}
