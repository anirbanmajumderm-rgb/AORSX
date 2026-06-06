import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, requireAuth, serverErrorResponse, withRateLimit } from "@/lib/api-utils";
import { getToken } from "next-auth/jwt";

export async function POST(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  const rateLimitError = await withRateLimit(req, "admin/notifications/mark-read/POST");
  if (rateLimitError) return rateLimitError;

  try {
    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
    const adminId = token?.id ? parseInt(token.id as string) : 0;

    const body = await req.json();

    if (body.all) {
      await prisma.notification.updateMany({
        where: { adminId },
        data: { read: true },
      });
    } else if (body.id) {
      const notification = await prisma.notification.findUnique({ where: { id: body.id } });
      if (!notification) {
        return new Response(JSON.stringify({ success: false, error: "Notification not found" }), { status: 404 });
      }
      if (notification.adminId && notification.adminId !== adminId) {
        return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), { status: 403 });
      }
      await prisma.notification.update({
        where: { id: body.id },
        data: { read: true },
      });
    }

    return successResponse({ success: true });
  } catch (err) {
    return serverErrorResponse(err, "admin/notifications:mark-read");
  }
}
