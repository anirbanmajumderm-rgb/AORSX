export type BackoffStrategy = "fixed" | "exponential" | "linear" | "jitter";

export interface RetryOptions {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  strategy: BackoffStrategy;
  retryOn: (err: unknown) => boolean;
  onRetry: (attempt: number, err: unknown, delay: number) => void;
}

const defaultOptions: RetryOptions = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  strategy: "exponential",
  retryOn: () => true,
  onRetry: () => {},
};

export function calculateDelay(attempt: number, options: RetryOptions): number {
  let delay: number;
  switch (options.strategy) {
    case "fixed":
      delay = options.baseDelay;
      break;
    case "exponential":
      delay = options.baseDelay * Math.pow(2, attempt - 1);
      break;
    case "linear":
      delay = options.baseDelay * attempt;
      break;
    case "jitter":
      delay = options.baseDelay * Math.pow(2, attempt - 1);
      delay = delay * (0.5 + Math.random() * 0.5);
      break;
  }
  return Math.min(delay, options.maxDelay);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retry<T>(
  fn: () => Promise<T>,
  options?: Partial<RetryOptions>
): Promise<T> {
  const opts: RetryOptions = { ...defaultOptions, ...options };
  let lastErr: unknown;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < opts.maxAttempts && opts.retryOn(err)) {
        const delay = calculateDelay(attempt, opts);
        opts.onRetry(attempt, err, delay);
        await sleep(delay);
      } else {
        throw err;
      }
    }
  }
  throw lastErr;
}

export function isRetryableError(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (
      msg.includes("econnrefused") ||
      msg.includes("etimedout") ||
      msg.includes("enotfound") ||
      msg.includes("socket hang up") ||
      msg.includes("connect econnreset") ||
      msg.includes("database") ||
      msg.includes("timeout") ||
      msg.includes("locked") ||
      msg.includes("busy") ||
      msg.includes("interrupted")
    ) {
      return true;
    }
  }
  return false;
}
