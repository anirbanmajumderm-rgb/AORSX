import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { logger } from "@/lib/app-logger";
import { getClientIp, withRateLimit } from "@/lib/api-utils";
import { sendPasswordResetEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const rateLimitError = await withRateLimit(req, "login");
    if (rateLimitError) return rateLimitError;

    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    const sanitizedEmail = email.trim().toLowerCase();
    const admin = await prisma.admin.findUnique({ where: { email: sanitizedEmail } });
    if (!admin) {
      return NextResponse.json(
        { success: true, data: { message: "If that email exists, a reset link has been sent." } },
        { status: 200 }
      );
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.$transaction(async (tx) => {
      await tx.passwordResetToken.updateMany({
        where: { adminId: admin.id, usedAt: null, expiresAt: { gt: new Date() } },
        data: { expiresAt: new Date(0) },
      });

      await tx.passwordResetToken.create({
        data: { adminId: admin.id, token, expiresAt },
      });
    });

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/admin/reset-password?token=${token}`;

    const result = await sendPasswordResetEmail({
      to: admin.email,
      name: admin.name,
      resetUrl,
    });

    if (!result.success) {
      logger.error("Auth", "Failed to send password reset email", {
        email: admin.email,
        error: result.error,
      });
    }

    return NextResponse.json(
      { success: true, data: { message: "If that email exists, a reset link has been sent." } },
      { status: 200 }
    );
  } catch (err) {
    logger.error("Auth", "Forgot password error", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { success: false, error: "An internal error occurred" },
      { status: 500 }
    );
  }
}
