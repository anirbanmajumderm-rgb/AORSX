import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, requireAuth, serverErrorResponse, withRateLimit, getClientIp } from "@/lib/api-utils";
import { createAuditLog } from "@/lib/audit";
import { getToken } from "next-auth/jwt";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  const rateLimitError = await withRateLimit(req, "admin/notifications/GET");
  if (rateLimitError) return rateLimitError;

  try {
    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
    const adminId = token?.id ? parseInt(token.id as string) : 0;

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "all";

    const where: Record<string, unknown> = {};
    if (filter === "unread") where.read = false;
    if (adminId) where.adminId = adminId;

    const [notifications, unreadCount, total] = await Promise.all([
      prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, take: 50 }),
      prisma.notification.count({ where: { ...where, read: false } }),
      prisma.notification.count({ where }),
    ]);

    return successResponse({ notifications, unreadCount, total });
  } catch (err) {
    return serverErrorResponse(err, "admin/notifications");
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  const rateLimitError = await withRateLimit(req, "admin/notifications/POST");
  if (rateLimitError) return rateLimitError;

  try {
    const body = await req.json();
    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
    const adminId = token?.id ? parseInt(token.id as string) : null;

    if (!body.title) {
      return new Response(JSON.stringify({ success: false, error: "Title is required" }), { status: 400 });
    }

    const notification = await prisma.notification.create({
      data: {
        adminId,
        type: body.type || "info",
        title: body.title,
        description: body.description || null,
        link: body.link || null,
      },
    });

    await createAuditLog({
      adminId,
      action: "notification.created",
      resource: "notification",
      resourceId: notification.id,
      details: `Created notification: "${notification.title}"`,
      ip: getClientIp(req),
    });

    return successResponse(notification, 201);
  } catch (err) {
    return serverErrorResponse(err, "admin/notifications:create");
  }
}

export async function DELETE(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  const rateLimitError = await withRateLimit(req, "admin/notifications/DELETE");
  if (rateLimitError) return rateLimitError;

  try {
    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
    const adminId = token?.id ? parseInt(token.id as string) : 0;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return new Response(JSON.stringify({ success: false, error: "Missing notification ID" }), { status: 400 });

    const notification = await prisma.notification.findUnique({ where: { id: parseInt(id) } });
    if (!notification) return new Response(JSON.stringify({ success: false, error: "Notification not found" }), { status: 404 });

    if (notification.adminId && notification.adminId !== adminId) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), { status: 403 });
    }

    await prisma.notification.delete({ where: { id: parseInt(id) } });

    await createAuditLog({
      adminId,
      action: "notification.deleted",
      resource: "notification",
      resourceId: parseInt(id),
      details: `Deleted notification: "${notification.title}"`,
      ip: getClientIp(req),
    });

    return successResponse({ deleted: true });
  } catch (err) {
    return serverErrorResponse(err, "admin/notifications:delete");
  }
}
