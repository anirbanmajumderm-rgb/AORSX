import { prisma } from "@/lib/prisma";
import { successResponse, requireAuth, serverErrorResponse, withRateLimit } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
    const adminId = token?.id ? parseInt(token.id as string) : 0;
    let prefs = await prisma.notificationPreference.findUnique({ where: { adminId } });
    if (!prefs) {
      prefs = await prisma.notificationPreference.create({ data: { adminId } });
    }
    return successResponse(prefs);
  } catch (err) {
    return serverErrorResponse(err, "admin/notifications/preferences");
  }
}

export async function PUT(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  const rateLimitError = await withRateLimit(request, "admin/notifications/preferences/PUT");
  if (rateLimitError) return rateLimitError;
  try {
    const body = await request.json();
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
    const adminId = token?.id ? parseInt(token.id as string) : 0;

    const prefs = await prisma.notificationPreference.upsert({
      where: { adminId },
      update: {
        newUserSignup: body.newUserSignup ?? undefined,
        newFaqSubmission: body.newFaqSubmission ?? undefined,
        newContactSubmission: body.newContactSubmission ?? undefined,
        analyticsAnomaly: body.analyticsAnomaly ?? undefined,
        failedLogin: body.failedLogin ?? undefined,
        contentPublish: body.contentPublish ?? undefined,
      },
      create: {
        adminId,
        newUserSignup: body.newUserSignup ?? true,
        newFaqSubmission: body.newFaqSubmission ?? true,
        newContactSubmission: body.newContactSubmission ?? true,
        analyticsAnomaly: body.analyticsAnomaly ?? false,
        failedLogin: body.failedLogin ?? true,
        contentPublish: body.contentPublish ?? true,
      },
    });
    return successResponse(prefs);
  } catch (err) {
    return serverErrorResponse(err, "admin/notifications/preferences");
  }
}
