import { prisma } from "./prisma";
import { logger } from "./app-logger";

type AuditLogInput = {
  adminId?: number | null;
  action: string;
  resource?: string | null;
  resourceId?: number | null;
  details?: string | null;
  ip?: string | null;
};

export async function createAuditLog(params: AuditLogInput) {
  try {
    await prisma.auditLog.create({ data: params });
  } catch (err) {
    logger.error("Audit", "Failed to create audit log", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

type NotificationInput = {
  adminId?: number;
  type?: string;
  title: string;
  description?: string | null;
  link?: string | null;
};

export async function createNotification(params: NotificationInput) {
  try {
    await prisma.notification.create({ data: params });
  } catch (err) {
    logger.error("Notification", "Failed to create notification", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

type NotifyParams = {
  type?: string;
  title: string;
  description?: string;
  link?: string;
};

export async function notifyAdmins(params: NotifyParams) {
  try {
    const admins: { id: number }[] = await prisma.admin.findMany({
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