import { PrismaClient } from "@prisma/client";
import { retry, isRetryableError, sleep } from "./retry";
import { logger } from "./app-logger";

const PRISMA_QUERY_TIMEOUT = 15000;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_BASE_DELAY = 1000;

let prismaClientFailed = false;

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
  prismaInitPromise: Promise<void> | undefined;
};

async function attemptReconnect(client: ReturnType<typeof createPrismaClient>): Promise<boolean> {
  for (let i = 0; i < MAX_RECONNECT_ATTEMPTS; i++) {
    try {
      await client.$connect();
      await client.$queryRaw`SELECT 1`;
      prismaClientFailed = false;
      logger.info("Prisma", `Reconnected successfully after ${i + 1} attempt(s)`);
      return true;
    } catch (err) {
      const delay = RECONNECT_BASE_DELAY * Math.pow(2, i) * (0.5 + Math.random() * 0.5);
      logger.warn("Prisma", `Reconnect attempt ${i + 1}/${MAX_RECONNECT_ATTEMPTS} failed`, {
        error: err instanceof Error ? err.message : String(err),
        nextRetryMs: Math.round(delay),
      });
      if (i < MAX_RECONNECT_ATTEMPTS - 1) {
        await sleep(delay);
      }
    }
  }
  prismaClientFailed = true;
  logger.error("Prisma", `Failed to reconnect after ${MAX_RECONNECT_ATTEMPTS} attempts`);
  return false;
}

function createPrismaClient() {
  const client = new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });

  return client;
}

function getPrisma() {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const client = createPrismaClient();
  globalForPrisma.prisma = client;

  const connectPromise = client.$connect()
    .then(() => {
      prismaClientFailed = false;
      logger.info("Prisma", "Client connected successfully");
    })
    .catch((err: unknown) => {
      prismaClientFailed = true;
      logger.error("Prisma", "Initial connection failed", {
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    });

  globalForPrisma.prismaInitPromise = connectPromise;

  return client;
}

export const prisma = getPrisma();

export async function waitForPrisma(): Promise<void> {
  if (globalForPrisma.prismaInitPromise) {
    await globalForPrisma.prismaInitPromise;
  }
}

export { attemptReconnect };

export async function checkDatabaseHealth(): Promise<{
  connected: boolean;
  latency?: number;
  error?: string;
  prismaClientOk?: boolean;
  reconnectable?: boolean;
}> {
  await waitForPrisma();
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const latency = Date.now() - start;

    let prismaClientOk = true;
    try {
      const adminCount = await prisma.admin.count();
      prismaClientOk = adminCount >= 0;
    } catch {
      prismaClientOk = false;
    }

    return {
      connected: true,
      latency,
      prismaClientOk,
      reconnectable: !prismaClientFailed,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logger.error("Prisma", "Health check failed", { error: errorMsg });

    if (!prismaClientFailed && globalForPrisma.prisma) {
      logger.info("Prisma", "Health check triggered reconnection attempt");
      attemptReconnect(globalForPrisma.prisma);
    }

    return {
      connected: false,
      error: errorMsg,
      reconnectable: !prismaClientFailed,
    };
  }
}

export async function safeQuery<T>(
  queryFn: () => Promise<T>,
  fallback: T,
  context: string
): Promise<T> {
  await waitForPrisma();
  try {
    return await retry(
      async () => {
        const timeoutPromise = new Promise<T>((_, reject) =>
          setTimeout(
            () => reject(new Error(`Query timeout after ${PRISMA_QUERY_TIMEOUT}ms`)),
            PRISMA_QUERY_TIMEOUT
          )
        );
        return Promise.race([queryFn(), timeoutPromise]);
      },
      {
        maxAttempts: 2,
        baseDelay: 1000,
        strategy: "jitter",
        onRetry: (attempt, err) => {
          logger.warn("Prisma", `Retrying ${context} (${attempt})`, {
            error: err instanceof Error ? err.message : String(err),
          });
        },
      }
    );
  } catch (err) {
    logger.error("Prisma", `Query failed for ${context}`, {
      error: err instanceof Error ? err.message : String(err),
    });

    if (isRetryableError(err) && !prismaClientFailed && globalForPrisma.prisma) {
      logger.info("Prisma", "Query failure triggered reconnection");
      attemptReconnect(globalForPrisma.prisma);
    }

    return fallback;
  }
}

export async function gracefulShutdown(): Promise<void> {
  try {
    await prisma.$disconnect();
    logger.info("Prisma", "Disconnected");
  } catch (err) {
    logger.error("Prisma", "Disconnect failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

export function isPrismaHealthy(): boolean {
  return !prismaClientFailed;
}
