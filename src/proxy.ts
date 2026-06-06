import { NextRequest, NextResponse } from "next/server";
import { getSecurityHeaders, getCspPolicy } from "@/lib/security-headers";

const FOUNDER_ROLES = ["superadmin", "founder"];

async function getTokenSafe(req: NextRequest) {
  try {
    const { getToken } = await import("next-auth/jwt");
    return await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  } catch {
    return null;
  }
}

const protectedPaths = [
  "/admin/dashboard",
  "/admin/content",
  "/admin/team",
  "/admin/faq",
  "/admin/ai-training",
  "/admin/users",
  "/admin/roles",
  "/admin/notifications",
  "/admin/features",
  "/admin/settings",
  "/admin/profile",
  "/admin/analytics",
  "/admin/automation",
  "/admin/controls",
  "/admin/ai",
  "/admin/site-manager",
  "/admin/projects",
];

const publicPaths = ["/admin/login", "/api/health", "/api/auth", "/admin/forgot-password", "/admin/reset-password"];

const founderOnlyPaths = [
  "/admin/roles",
  "/admin/users",
  "/admin/settings",
];

function addSecurityHeaders(response: NextResponse): void {
  const headers = getSecurityHeaders();
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  const csp = getCspPolicy();
  response.headers.set("Content-Security-Policy", csp);
}

function validateOriginRequest(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  if (origin === "null") return false;
  try {
    const allowedOrigins = [
      "http://localhost:3000",
      process.env.NEXTAUTH_URL || "",
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
    ].filter((s) => s.length > 0);
    const originUrl = new URL(origin);
    return allowedOrigins.some((o) => {
      try {
        const allowedUrl = new URL(o);
        return allowedUrl.origin === originUrl.origin;
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

function addRequestId(response: NextResponse): void {
  const requestId = crypto.randomUUID().slice(0, 8);
  response.headers.set("x-request-id", requestId);
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  try {
    if (!validateOriginRequest(req)) {
      return new NextResponse(
        JSON.stringify({ success: false, error: "Invalid origin" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
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
    const isProtectedRoute = protectedPaths.some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    );

    if (isProtectedRoute && !isLoggedIn) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (isLoggedIn && pathname === "/admin/login") {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }

    if (isLoggedIn && isProtectedRoute) {
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
            return NextResponse.redirect(new URL("/admin/dashboard", req.url));
          }
        } catch {
          return NextResponse.redirect(new URL("/admin/dashboard", req.url));
        }
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
