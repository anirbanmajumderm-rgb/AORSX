import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getSecurityHeaders, getCspPolicy } from "@/lib/security-headers";

const FOUNDER_ROLES = ["superadmin", "founder"];

async function getTokenSafe(req: NextRequest) {
  try {
    return await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  } catch {
    return null;
  }
}

const publicPaths = [
  "/admin/login",
  "/api/health",
  "/api/auth",
  "/admin/forgot-password",
  "/admin/reset-password",
  "/api/admin/reset-password",
  "/api/admin/analytics/record",
  "/api/admin/2fa/login",
  "/api/admin/2fa/status",
  "/api/admin/2fa/verify-login",
  "/api/admin/2fa/backup-code",
];

const founderOnlyPaths = [
  "/admin/roles",
  "/admin/users",
  "/admin/settings",
];

const allowedOrigins = [
  "http://localhost:3000",
  ...(process.env.NEXTAUTH_URL ? [process.env.NEXTAUTH_URL] : []),
  ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
].filter(Boolean) as string[];

function addSecurityHeaders(response: NextResponse): void {
  const headers = getSecurityHeaders();
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  const csp = getCspPolicy();
  response.headers.set("Content-Security-Policy", csp);
}

function addRequestId(response: NextResponse): void {
  const requestId = crypto.randomUUID().slice(0, 8);
  response.headers.set("x-request-id", requestId);
}

function validateOriginRequest(req: NextRequest): { valid: boolean; reason?: string } {
  const origin = req.headers.get("origin");
  const method = req.method;
  const isMutation = method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE";

  if (!origin) {
    if (isMutation && (req.nextUrl.pathname.startsWith("/api/admin/") || req.nextUrl.pathname.startsWith("/admin/"))) {
      return { valid: false, reason: "Origin header required for mutating requests" };
    }
    return { valid: true };
  }

  if (origin === "null") {
    return { valid: false, reason: "Null origin not allowed" };
  }

  try {
    const originUrl = new URL(origin);
    return {
      valid: allowedOrigins.some((o) => {
        try {
          const allowedUrl = new URL(o);
          return allowedUrl.origin === originUrl.origin;
        } catch {
          return false;
        }
      }),
      reason: "Origin not allowed",
    };
  } catch {
    return { valid: false, reason: "Invalid origin URL" };
  }
}

async function validateCsrfForMutation(req: NextRequest): Promise<NextResponse | null> {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") return null;
  if (!req.nextUrl.pathname.startsWith("/api/admin/")) return null;

  const { validateCsrf } = await import("@/lib/csrf-v2");
  return validateCsrf(req);
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  try {
    const originCheck = validateOriginRequest(req);
    if (!originCheck.valid) {
      return new NextResponse(
        JSON.stringify({ success: false, error: originCheck.reason || "Invalid origin" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    if (publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
      const response = NextResponse.next();
      addSecurityHeaders(response);
      addRequestId(response);
      response.headers.set("x-pathname", pathname);
      return response;
    }

    if (!pathname.startsWith("/admin/") && !pathname.startsWith("/api/admin/")) {
      const response = NextResponse.next();
      addSecurityHeaders(response);
      addRequestId(response);
      response.headers.set("x-pathname", pathname);
      return response;
    }

    const token = await getTokenSafe(req);
    const isLoggedIn = !!token;

    if (!isLoggedIn) {
      if (pathname.startsWith("/api/admin/")) {
        return new NextResponse(
          JSON.stringify({ success: false, error: "Unauthorized" }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const csrfError = await validateCsrfForMutation(req);
    if (csrfError) return csrfError;

    const isFounderRoute = founderOnlyPaths.some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    );
    if (isFounderRoute) {
      try {
        const { prisma } = await import("@/lib/prisma");
        const admin = await prisma.admin.findUnique({
          where: { email: token.email as string },
        });
        if (!admin || !FOUNDER_ROLES.includes(admin.role)) {
          if (pathname.startsWith("/api/admin/")) {
            return new NextResponse(
              JSON.stringify({ success: false, error: "Forbidden" }),
              { status: 403, headers: { "Content-Type": "application/json" } }
            );
          }
          return NextResponse.redirect(new URL("/admin/dashboard", req.url));
        }
      } catch {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      }
    }

    const response = NextResponse.next();
    addSecurityHeaders(response);
    addRequestId(response);
    response.headers.set("x-pathname", pathname);
    if (isLoggedIn) response.headers.set("x-authenticated", "true");
    return response;
  } catch {
    if (pathname.startsWith("/admin/") && pathname !== "/admin/login") {
      try {
        const loginUrl = new URL("/admin/login", req.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        loginUrl.searchParams.set("error", "SessionError");
        return NextResponse.redirect(loginUrl);
      } catch {
        return NextResponse.redirect(new URL("/admin/login", req.url));
      }
    }
    const response = NextResponse.next();
    addSecurityHeaders(response);
    addRequestId(response);
    return response;
  }
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
