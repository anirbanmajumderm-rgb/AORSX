import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, serverErrorResponse, getClientIp, withRateLimit } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const rateLimitError = await withRateLimit(request, "2fa/status");
  if (rateLimitError) return rateLimitError;

  try {
    const email = request.nextUrl.searchParams.get("email");
    if (!email) return errorResponse("Email is required", 400);

    const admin = await prisma.admin.findUnique({
      where: { email },
      select: { twoFactorEnabled: true },
    });

    if (!admin) return errorResponse("Admin not found", 404);

    return successResponse({ twoFactorEnabled: admin.twoFactorEnabled });
  } catch (err) {
    return serverErrorResponse(err, "admin/2fa/status");
  }
}
