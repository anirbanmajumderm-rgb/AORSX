import { prisma } from "./prisma";
import { logger } from "./app-logger";

export async function createAuditLog(params: {
  adminId?: number | null;
  action: string;
  resource?: string | null;
  resourceId?: number | null;
  details?: string | null;
  ip?: string | null;
}) {
  try {
    await prisma.auditLog.create({ data: params as any });
  } catch (err) {
    logger.error("Audit", "Failed to create audit log", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

export async function createNotification(params: {
  adminId?: number;
  type?: string;
  title: string;
  description?: string | null;
  link?: string | null;
}) {
  try {
    await prisma.notification.create({ data: params as any });
  } catch (err) {
    logger.error("Notification", "Failed to create notification", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

export async function notifyAdmins(params: {
  type?: string;
  title: string;
  description?: string;
  link?: string;
}) {
  try {
    const admins = await prisma.admin.findMany({
      select: { id: true },
      take: 100,
    });
    if (admins.length === 0) return;

    const notifications = admins.map((admin) => ({
      adminId: admin.id,
      type: params.type || "info",
      title: params.title,
      description: params.description || null,
      link: params.link || null,
    }));

    await prisma.notification.createMany({ data: notifications });
  } catch (err) {
    logger.error("Notification", "Failed to notify admins", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
