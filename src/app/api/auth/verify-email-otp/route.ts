import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, serverErrorResponse, getClientIp, withRateLimit } from "@/lib/api-utils";
import { createSessionToken, setSessionCookie, verifyTempToken } from "@/lib/two-factor";
import { validateOTPRecord, invalidateExpiredOTPs } from "@/lib/email-otp";
import { createAuditLog } from "@/lib/audit";

export async function POST(request: NextRequest) {
  const rateLimitError = await withRateLimit(request, "email-otp/verify");
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
      select: { id: true, email: true, name: true, image: true, email2FAEnabled: true },
    });

    if (!admin || !admin.email2FAEnabled) {
      return errorResponse("Email OTP verification is not enabled for this account", 400);
    }

    await invalidateExpiredOTPs();

    const result = await validateOTPRecord(admin.email, otp);

    if (!result.valid) {
      createAuditLog({
        adminId: admin.id,
        action: "email_otp.failed",
        resource: "admin",
        resourceId: admin.id,
        details: result.reason || "Invalid email OTP",
        ip: getClientIp(request),
      });
      return errorResponse(result.reason || "Invalid verification code", 401);
    }

    const jwtToken = await createSessionToken(admin);
    const response = successResponse({
      message: "Login successful",
      user: { id: admin.id, email: admin.email, name: admin.name },
    });
    setSessionCookie(response, jwtToken);

    createAuditLog({
      adminId: admin.id,
      action: "email_otp.success",
      resource: "admin",
      resourceId: admin.id,
      details: "Successful email OTP verification during login",
      ip: getClientIp(request),
    });

    return response;
  } catch (err) {
    return serverErrorResponse(err, "auth/verify-email-otp");
  }
}
