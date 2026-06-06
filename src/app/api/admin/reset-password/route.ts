import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { logger } from "@/lib/app-logger";
import { createAuditLog, notifyAdmins } from "@/lib/audit";
import { getClientIp, withRateLimit } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const rateLimitError = await withRateLimit(req, "login");
    if (rateLimitError) return rateLimitError;

    const body = await req.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: "Token and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetToken) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    if (resetToken.usedAt) {
      return NextResponse.json(
        { success: false, error: "This reset link has already been used" },
        { status: 400 }
      );
    }

    if (new Date() > resetToken.expiresAt) {
      return NextResponse.json(
        { success: false, error: "This reset link has expired" },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      const hashedPassword = await hash(password, 12);
      await tx.admin.update({
        where: { id: resetToken.adminId },
        data: { password: hashedPassword },
      });
      await tx.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      });
    });

    const admin = await prisma.admin.findUnique({
      where: { id: resetToken.adminId },
      select: { name: true, email: true },
    });

    if (admin) {
      await notifyAdmins({
        type: "warning",
        title: "Password Reset",
        description: `${admin.name} reset their password`,
      });
    }

    await createAuditLog({
      adminId: resetToken.adminId,
      action: "password.reset",
      resource: "admin",
      resourceId: resetToken.adminId,
      details: "Password reset completed",
      ip: getClientIp(req as any),
    });

    return NextResponse.json(
      { success: true, data: { message: "Password has been reset successfully" } },
      { status: 200 }
    );
  } catch (err) {
    logger.error("Auth", "Reset password error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { success: false, error: "An internal error occurred" },
      { status: 500 }
    );
  }
}
