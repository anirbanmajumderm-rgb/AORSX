import { checkDatabaseHealth } from "./prisma";
import os from "os";
import fs from "fs";
import path from "path";

export interface DiagnosticReport {
  timestamp: string;
  environment: string;
  uptime: number;
  uptimeHuman: string;
  memory: {
    heapUsed: string;
    heapTotal: string;
    rss: string;
    heapUsedPercent: string;
  };
  database: {
    connected: boolean;
    latency?: number;
    error?: string;
    prismaClientOk?: boolean;
  };
  env: {
    valid: boolean;
    missing: string[];
    nodeVersion: string;
    nextauthUrl: string;
    databaseUrl: string;
    nextVersion: string;
  };
  system: {
    platform: string;
    nodeVersion: string;
    pid: number;
    hostname: string;
    cpuCores: number;
    totalMemory: string;
    freeMemory: string;
  };
  cache: {
    nextBuildExists: boolean;
    tsBuildInfoExists: boolean;
    dbFileExists: boolean;
    dbFileSize: string;
  };
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

function formatBytes(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

export async function runDiagnostics(): Promise<DiagnosticReport> {
  const memory = process.memoryUsage();
  const heapUsedPercent = ((memory.heapUsed / memory.heapTotal) * 100).toFixed(1);

  const report: DiagnosticReport = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    uptime: process.uptime(),
    uptimeHuman: formatUptime(process.uptime()),
    memory: {
      heapUsed: formatBytes(memory.heapUsed),
      heapTotal: formatBytes(memory.heapTotal),
      rss: formatBytes(memory.rss),
      heapUsedPercent: `${heapUsedPercent}%`,
    },
    database: { connected: false },
    env: {
      valid: true,
      missing: [],
      nodeVersion: process.version,
      nextauthUrl: process.env.NEXTAUTH_URL || "not set",
      databaseUrl: process.env.DATABASE_URL || "not set",
      nextVersion: "16.2.6",
    },
    system: {
      platform: process.platform,
      nodeVersion: process.version,
      pid: process.pid,
      hostname: os.hostname(),
      cpuCores: os.cpus().length,
      totalMemory: formatBytes(os.totalmem()),
      freeMemory: formatBytes(os.freemem()),
    },
    cache: {
      nextBuildExists: false,
      tsBuildInfoExists: false,
      dbFileExists: false,
      dbFileSize: "0MB",
    },
  };

  for (const key of ["DATABASE_URL", "NEXTAUTH_SECRET", "NEXTAUTH_URL"] as const) {
    if (!process.env[key]) report.env.missing.push(key);
  }
  report.env.valid = report.env.missing.length === 0;

  const projectRoot = process.cwd();

  const nextPath = path.join(projectRoot, ".next");
  const tsBuildPath = path.join(projectRoot, "tsconfig.tsbuildinfo");
  const dbPath = path.join(projectRoot, "prisma", "dev.db");

  try {
    report.cache.nextBuildExists = fs.existsSync(nextPath);
    report.cache.tsBuildInfoExists = fs.existsSync(tsBuildPath);
    if (fs.existsSync(dbPath)) {
      report.cache.dbFileExists = true;
      const stats = fs.statSync(dbPath);
      report.cache.dbFileSize = formatBytes(stats.size);
    }
  } catch {
    // ignore fs errors in diagnostics
  }

  const dbHealth = await checkDatabaseHealth();
  report.database = {
    connected: dbHealth.connected,
    latency: dbHealth.latency,
    error: dbHealth.error,
    prismaClientOk: dbHealth.prismaClientOk,
  };

  return report;
}

export function logError(context: string, err: unknown): void {
  const msg = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [ERROR] [${context}] ${msg}`);
  if (stack) {
    console.error(`[${timestamp}] [STACK] ${stack.split("\n").slice(0, 4).join("\n")}`);
  }
}
