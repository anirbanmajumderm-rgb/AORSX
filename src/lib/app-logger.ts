export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  duration?: number;
  data?: Record<string, unknown>;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};

const currentLevel: LogLevel =
  (process.env.LOG_LEVEL as LogLevel) ||
  (process.env.NODE_ENV === "production" ? "info" : "debug");

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function formatTimestamp(): string {
  return new Date().toISOString();
}

function createEntry(
  level: LogLevel,
  context: string,
  message: string,
  data?: Record<string, unknown>,
  duration?: number
): LogEntry {
  return { timestamp: formatTimestamp(), level, context, message, duration, data };
}

function writeEntry(entry: LogEntry): void {
  if (!shouldLog(entry.level)) return;

  const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.context}]`;
  const duration = entry.duration ? ` (${entry.duration}ms)` : "";
  const dataStr = entry.data ? ` ${JSON.stringify(entry.data)}` : "";

  switch (entry.level) {
    case "error":
    case "fatal":
      console.error(`${prefix} ${entry.message}${duration}${dataStr}`);
      break;
    case "warn":
      console.warn(`${prefix} ${entry.message}${duration}${dataStr}`);
      break;
    default:
      console.log(`${prefix} ${entry.message}${duration}${dataStr}`);
  }
}

export const logger = {
  debug(context: string, message: string, data?: Record<string, unknown>): void {
    writeEntry(createEntry("debug", context, message, data));
  },

  info(context: string, message: string, data?: Record<string, unknown>): void {
    writeEntry(createEntry("info", context, message, data));
  },

  warn(context: string, message: string, data?: Record<string, unknown>): void {
    writeEntry(createEntry("warn", context, message, data));
  },

  error(context: string, message: string, data?: Record<string, unknown>): void {
    writeEntry(createEntry("error", context, message, data));
  },

  fatal(context: string, message: string, data?: Record<string, unknown>): void {
    writeEntry(createEntry("fatal", context, message, data));
  },

  timed<T>(context: string, message: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    return fn()
      .then((result) => {
        writeEntry(createEntry("info", context, message, undefined, Date.now() - start));
        return result;
      })
      .catch((err) => {
        writeEntry(
          createEntry("error", context, `${message} failed`, {
            error: err instanceof Error ? err.message : String(err),
          },
          Date.now() - start)
        );
        throw err;
      });
  },
};
