import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/app-logger";
import { sendPasswordResetEmail } from "@/lib/email";
import { withRateLimit } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const rateLimitError = await withRateLimit(req, "login");
    if (rateLimitError) return rateLimitError;

    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    const admin = await prisma.admin.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    });

    if (!admin) {
      return NextResponse.json({
        success: true,
        data: { message: "If an account exists with that email, a reset link has been sent." },
      });
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        adminId: admin.id,
        token,
        expiresAt,
      },
    });

    const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/admin/reset-password?token=${token}`;

    await sendPasswordResetEmail({
      to: admin.email,
      name: admin.name,
      resetUrl,
    }).catch((err) => {
      logger.error("Auth", "Failed to send password reset email", {
        error: err instanceof Error ? err.message : String(err),
      });
    });

    return NextResponse.json({
      success: true,
      data: { message: "If an account exists with that email, a reset link has been sent." },
    });
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
