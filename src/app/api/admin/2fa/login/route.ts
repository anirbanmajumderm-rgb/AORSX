import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, serverErrorResponse, getClientIp, withRateLimit } from "@/lib/api-utils";
import { compare } from "bcryptjs";
import { createSessionToken, createTempToken, setSessionCookie } from "@/lib/two-factor";
import { createAuditLog, createNotification } from "@/lib/audit";
import { logger } from "@/lib/app-logger";
import { createOTPRecord } from "@/lib/email-otp";
import { sendOTPEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  const rateLimitError = await withRateLimit(request, "2fa/login");
  if (rateLimitError) return rateLimitError;

  try {
    const body = await request.json();
    const { email: login, password } = body;

    if (!login || !password) {
      return errorResponse("Email or username and password are required", 400);
    }

    const admin = await prisma.admin.findFirst({
      where: { OR: [{ email: login }, { username: login }] },
      select: { id: true, email: true, username: true, name: true, image: true, password: true, twoFactorEnabled: true, email2FAEnabled: true },
    });

    if (!admin) {
      return errorResponse("Invalid email/username or password", 401);
    }

    const isValid = await compare(password, admin.password);
    if (!isValid) {
      createNotification({
        adminId: admin.id,
        type: "warning",
        title: "Failed Login Attempt",
        description: `Failed login attempt for ${login}`,
      });
      createAuditLog({
        adminId: admin.id,
        action: "login.failed",
        resource: "admin",
        resourceId: admin.id,
        details: `Failed login attempt for ${login}`,
        ip: getClientIp(request),
      });
      return errorResponse("Invalid email/username or password", 401);
    }

    if (admin.email2FAEnabled) {
      const tempToken = createTempToken(admin.id, admin.email);
      const { otp } = await createOTPRecord(admin.email);

      await sendOTPEmail({ to: admin.email, otp })
        .catch((err) => logger.error("Email OTP", "Failed to send OTP email", {
          error: err instanceof Error ? err.message : String(err),
        }));

      createAuditLog({
        adminId: admin.id,
        action: "login.email_otp_sent",
        resource: "admin",
        resourceId: admin.id,
        details: "Password verified, email OTP sent",
        ip: getClientIp(request),
      });

      return successResponse({
        requiresEmailOTP: true,
        tempToken,
        message: "Verification code sent to your email",
      });
    }

    if (admin.twoFactorEnabled) {
      const tempToken = createTempToken(admin.id, admin.email);

      createAuditLog({
        adminId: admin.id,
        action: "login.password_verified",
        resource: "admin",
        resourceId: admin.id,
        details: "Password verified, 2FA required",
        ip: getClientIp(request),
      });

      return successResponse({
        requires2FA: true,
        tempToken,
        message: "Two-factor authentication code required",
      });
    }

    const jwtToken = await createSessionToken(admin);
    const response = successResponse({
      message: "Login successful",
      user: { id: admin.id, email: admin.email, name: admin.name },
    });
    setSessionCookie(response, jwtToken);

    createAuditLog({
      adminId: admin.id,
      action: "login.success",
      resource: "admin",
      resourceId: admin.id,
      details: `Successful login for ${login}`,
      ip: getClientIp(request),
    });

    return response;
  } catch (err) {
    return serverErrorResponse(err, "admin/2fa/login");
  }
}
