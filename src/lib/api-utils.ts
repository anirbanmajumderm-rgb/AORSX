import { NextResponse, NextRequest } from "next/server";
import { auth } from "./auth";
import { logError } from "./diagnostics";
import { logger } from "./app-logger";
import { checkRateLimit } from "./rate-limit-db";
import { validateCsrf } from "./csrf-v2";

const FOUNDER_ROLES = ["superadmin", "founder"];

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(
  message: string,
  status = 400,
  details?: unknown
) {
  const body: Record<string, unknown> = { success: false, error: message };
  if (details !== undefined) {
    body.details = details;
  }
  return NextResponse.json(body, { status });
}

export function serverErrorResponse(err: unknown, context: string) {
  logError(`API:${context}`, err);
  const message = "An internal error occurred";
  const details =
    process.env.NODE_ENV === "development"
      ? err instanceof Error
        ? err.message
        : String(err)
      : undefined;
  return errorResponse(message, 500, details);
}

export async function requireAuth(): Promise<NextResponse | null> {
  try {
    const session = await auth();
    if (!session?.user) {
      logger.warn("API", "Unauthorized access attempt");
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    return null;
  } catch (err) {
    logError("requireAuth", err);
    logger.error("API", "Auth check failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { success: false, error: "Authentication check failed" },
      { status: 500 }
    );
  }
}

export async function requireFounder(): Promise<NextResponse | null> {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    const { prisma } = await import("./prisma");
    const admin = await prisma.admin.findUnique({
      where: { email: session.user.email },
      select: { role: true },
    });
    if (!admin || !FOUNDER_ROLES.includes(admin.role)) {
      logger.warn("API", "Founder-only route access denied", {
        email: session.user.email,
        role: admin?.role,
      });
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }
    return null;
  } catch (err) {
    logError("requireFounder", err);
    return NextResponse.json(
      { success: false, error: "Authorization check failed" },
      { status: 500 }
    );
  }
}

export function getClientIp(request: NextRequest): string {
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp;
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const ip = forwarded.split(",")[0]?.trim();
    if (ip && ip !== "unknown" && ip !== "127.0.0.1") return ip;
  }
  return request.headers.get("x-real-ip") || "127.0.0.1";
}

export async function withRateLimit(
  request: NextRequest,
  context: string
): Promise<NextResponse | null> {
  const ip = getClientIp(request);
  const result = await checkRateLimit(ip, context);
  if (!result.success) {
    logger.warn("API", `Rate limit exceeded for ${context} from ${ip}`);
    return NextResponse.json(
      { success: false, error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(result.resetInMs / 1000)),
        },
      }
    );
  }
  return null;
}

export async function withCsrfProtection(
  request: NextRequest
): Promise<NextResponse | null> {
  return validateCsrf(request);
}

export async function apiHandler(
  handler: () => Promise<NextResponse>,
  context: string
): Promise<NextResponse> {
  const start = Date.now();
  try {
    const result = await handler();
    const duration = Date.now() - start;
    if (duration > 1000) {
      logger.warn("API", `${context} took ${duration}ms`, { duration });
    }
    return result;
  } catch (err) {
    const duration = Date.now() - start;
    logError(`API:${context}`, err);
    logger.error("API", `${context} failed after ${duration}ms`, {
      error: err instanceof Error ? err.message : String(err),
      duration,
    });
    return serverErrorResponse(err, context);
  }
}

export async function withErrorHandling(
  handler: () => Promise<NextResponse>,
  context: string
): Promise<NextResponse> {
  return apiHandler(handler, context);
}

export function notFoundResponse(resource: string) {
  return NextResponse.json(
    { success: false, error: `${resource} not found` },
    { status: 404 }
  );
}

export function validationErrorResponse(errors: string[]) {
  return NextResponse.json(
    { success: false, error: "Validation failed", details: errors },
    { status: 422 }
  );
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

export function getBaseUrl(): string {
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function cacheResponse(response: NextResponse, maxAge = 60): void {
  response.headers.set(
    "Cache-Control",
    `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 2}`
  );
}
