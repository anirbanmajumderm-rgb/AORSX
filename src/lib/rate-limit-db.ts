import { prisma } from "./prisma";

const LIMITS: Record<string, { window: number; max: number }> = {
  default: { window: 60 * 1000, max: 60 },
  login: { window: 60 * 1000, max: 5 },
  "contact/submit": { window: 60 * 1000, max: 3 },
  "analytics/record": { window: 60 * 1000, max: 120 },
  admin: { window: 60 * 1000, max: 120 },
  "2fa/setup": { window: 60 * 1000, max: 3 },
  "2fa/verify-setup": { window: 60 * 1000, max: 5 },
  "2fa/verify-login": { window: 60 * 1000, max: 5 },
  "2fa/login": { window: 60 * 1000, max: 5 },
  "2fa/backup": { window: 60 * 1000, max: 5 },
  "2fa/disable": { window: 60 * 1000, max: 3 },
  "2fa/status": { window: 60 * 1000, max: 30 },
  "email-otp/generate": { window: 60 * 1000, max: 3 },
  "email-otp/verify": { window: 60 * 1000, max: 5 },
};

export async function checkRateLimit(
  key: string,
  context: string = "default"
): Promise<{ success: boolean; remaining: number; resetInMs: number }> {
  const config = LIMITS[context] || LIMITS.default;

  try {
    const now = new Date();
    await prisma.rateLimit.deleteMany({
      where: { expiresAt: { lt: now } },
    });

    const existing = await prisma.rateLimit.findFirst({
      where: {
        key,
        expiresAt: { gt: now },
      },
    });

    if (!existing) {
      const expiresAt = new Date(now.getTime() + config.window);
      await prisma.rateLimit.create({
        data: { key, count: 1, expiresAt },
      });
      return { success: true, remaining: config.max - 1, resetInMs: config.window };
    }

    if (existing.count >= config.max) {
      const resetInMs = existing.expiresAt.getTime() - now.getTime();
      return { success: false, remaining: 0, resetInMs: Math.max(resetInMs, 1000) };
    }

    await prisma.rateLimit.update({
      where: { id: existing.id },
      data: { count: existing.count + 1 },
    });

    return { success: true, remaining: config.max - existing.count - 1, resetInMs: existing.expiresAt.getTime() - now.getTime() };
  } catch {
    const now = Date.now();
    return { success: true, remaining: config.max - 1, resetInMs: now + config.window - now };
  }
}

export async function clearExpiredRateLimits(): Promise<void> {
  try {
    await prisma.rateLimit.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  } catch {
    // silently fail
  }
}
