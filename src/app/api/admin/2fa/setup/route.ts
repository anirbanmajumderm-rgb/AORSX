import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAuth, serverErrorResponse, withRateLimit } from "@/lib/api-utils";
import { auth } from "@/lib/auth";
import { generateTOTPSecret, generateQRCodeDataUrl } from "@/lib/two-factor";

export async function POST(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  const rateLimitError = await withRateLimit(request, "2fa/setup");
  if (rateLimitError) return rateLimitError;

  try {
    const session = await auth();
    const adminEmail = session?.user?.email;
    if (!adminEmail) return errorResponse("Session not found", 401);

    const admin = await prisma.admin.findUnique({
      where: { email: adminEmail },
      select: { id: true, email: true, twoFactorEnabled: true, twoFactorSecret: true },
    });
    if (!admin) return errorResponse("Admin not found", 404);
    if (admin.twoFactorEnabled) return errorResponse("Two-factor authentication is already enabled", 400);

    const { secret, otpauthUrl } = generateTOTPSecret(admin.email);
    const qrCode = await generateQRCodeDataUrl(otpauthUrl);

    return successResponse({ secret, qrCode, otpauthUrl });
  } catch (err) {
    return serverErrorResponse(err, "admin/2fa/setup");
  }
}
