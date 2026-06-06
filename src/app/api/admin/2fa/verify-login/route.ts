import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, serverErrorResponse, getClientIp, withRateLimit } from "@/lib/api-utils";
import { decryptSecret, verifyTOTP, createSessionToken, setSessionCookie, verifyTempToken } from "@/lib/two-factor";
import { createAuditLog } from "@/lib/audit";

export async function POST(request: NextRequest) {
  const rateLimitError = await withRateLimit(request, "2fa/verify-login");
  if (rateLimitError) return rateLimitError;

  try {
    const body = await request.json();
    const { tempToken, otp } = body;

    if (!tempToken || !otp) {
      return errorResponse("Temporary token and OTP are required", 400);
    }

    const payload = verifyTempToken(tempToken);
    if (!payload) {
      return errorResponse("Session expired. Please login again.", 401);
    }

    const admin = await prisma.admin.findUnique({
      where: { id: payload.adminId },
      select: { id: true, email: true, name: true, image: true, twoFactorEnabled: true, twoFactorSecret: true },
    });

    if (!admin || !admin.twoFactorEnabled || !admin.twoFactorSecret) {
      return errorResponse("Two-factor authentication is not enabled for this account", 400);
    }

    const decryptedSecret = decryptSecret(admin.twoFactorSecret);
    const isValid = verifyTOTP(otp, decryptedSecret);

    if (!isValid) {
      createAuditLog({
        adminId: admin.id,
        action: "2fa.otp.failed",
        resource: "admin",
        resourceId: admin.id,
        details: "Invalid OTP during login",
        ip: getClientIp(request),
      });
      return errorResponse("Invalid verification code. Please try again.", 401);
    }

    await prisma.admin.update({
      where: { id: admin.id },
      data: { twoFactorVerifiedAt: new Date() },
    });

    const jwtToken = await createSessionToken(admin);
    const response = successResponse({
      message: "Login successful",
      user: { id: admin.id, email: admin.email, name: admin.name },
    });
    setSessionCookie(response, jwtToken);

    createAuditLog({
      adminId: admin.id,
      action: "2fa.otp.success",
      resource: "admin",
      resourceId: admin.id,
      details: "Successful OTP verification during login",
      ip: getClientIp(request),
    });

    return response;
  } catch (err) {
    return serverErrorResponse(err, "admin/2fa/verify-login");
  }
}
