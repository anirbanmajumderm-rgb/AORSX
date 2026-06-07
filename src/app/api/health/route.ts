import { NextResponse } from "next/server";
import { prisma, checkDatabaseHealth } from "@/lib/prisma";
const APP_VERSION = "2.0.0";

export async function GET() {
  const start = Date.now();

  const isProd = process.env.NODE_ENV === "production";

  const status: Record<string, unknown> = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: APP_VERSION,
    environment: process.env.NODE_ENV || "development",
    database: { status: "unknown" },
  };

  if (!isProd) {
    const pkg = await import("next/package.json");
    const os = await import("os");
    const memory = process.memoryUsage();
    Object.assign(status, {
      uptime: process.uptime(),
      uptimeHuman: formatUptime(process.uptime()),
      nextjs: { version: pkg.version },
      auth: {
        configured: !!process.env.NEXTAUTH_URL,
        secretConfigured: !!process.env.NEXTAUTH_SECRET,
      },
      system: {
        memory: `${(memory.heapUsed / 1024 / 1024).toFixed(1)}MB`,
        platform: process.platform,
        cpuCores: os.cpus().length,
        nodeVersion: process.version,
      },
    });
  }

  try {
    const dbHealth = await checkDatabaseHealth();
    status.database = {
      status: dbHealth.connected ? "connected" : "disconnected",
      latency: dbHealth.latency,
    };

    if (!dbHealth.connected) {
      status.status = "degraded";
    }

    if (dbHealth.connected) {
      try {
        const adminCount = await prisma.admin.count().catch(() => -1);
        if (adminCount === 0) status.status = "degraded";
        if (!isProd) {
          (status.database as Record<string, unknown>).adminCount = adminCount >= 0 ? adminCount : undefined;
        }
      } catch {
        if (status.status === "healthy") status.status = "degraded";
      }
    }
  } catch {
    status.database = { status: "error" };
    status.status = "unhealthy";
  }

  const totalLatency = Date.now() - start;
  const httpStatus =
    status.status === "healthy" ? 200
    : status.status === "degraded" ? 503 : 500;

  const response = NextResponse.json(
    { ...status, latency: totalLatency },
    { status: httpStatus }
  );

  response.headers.set("x-health-status", status.status as string);
  response.headers.set("x-health-latency", `${totalLatency}ms`);
  response.headers.set("x-app-version", APP_VERSION);

  return response;
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(" ");
}
