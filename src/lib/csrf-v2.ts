import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { randomBytes } from "crypto";

function getSecret(): string {
  return process.env.NEXTAUTH_SECRET || "";
}

export async function generateCsrfToken(): Promise<string> {
  const secret = getSecret();
  const random = randomBytes(32).toString("hex");
  const hmac = await createHmac(random, secret);
  return `${random}.${hmac}`;
}

async function createHmac(data: string, secret: string): Promise<string> {
  const { createHmac: hmac } = await import("crypto");
  return hmac("sha256", secret).update(data).digest("hex").slice(0, 16);
}

export async function getCsrfToken(request: NextRequest): Promise<string | null> {
  const header = request.headers.get("x-csrf-token");
  if (header) return header;

  const cookie = request.cookies.get("csrf-token")?.value;
  return cookie || null;
}

export async function validateCsrfToken(token: string): Promise<boolean> {
  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [random, expectedHmac] = parts;
  const secret = getSecret();
  if (!secret) return false;

  const actualHmac = await createHmac(random, secret);
  return actualHmac === expectedHmac;
}

export async function validateCsrf(request: NextRequest): Promise<NextResponse | null> {
  if (request.method === "GET" || request.method === "HEAD" || request.method === "OPTIONS") return null;

  const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const csrfHeader = await getCsrfToken(request);
  if (!csrfHeader) {
    return NextResponse.json({ success: false, error: "Missing CSRF token" }, { status: 403 });
  }

  const isValid = await validateCsrfToken(csrfHeader);
  if (!isValid) {
    return NextResponse.json({ success: false, error: "Invalid CSRF token" }, { status: 403 });
  }

  return null;
}
