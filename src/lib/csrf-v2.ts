import { NextResponse, NextRequest } from "next/server";

function getSecret(): string {
  return process.env.NEXTAUTH_SECRET || "";
}

export async function generateCsrfToken(): Promise<string | null> {
  try {
    const secret = getSecret();
    if (!secret) {
      console.warn("[CSRF] NEXTAUTH_SECRET not set, skipping CSRF token generation");
      return null;
    }
    const random = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const hmac = await createHmac(random, secret);
    return `${random}.${hmac}`;
  } catch (err) {
    console.error("[CSRF] Token generation failed:", err);
    return null;
  }
}

async function createHmac(data: string, secret: string): Promise<string> {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.subtle !== "undefined") {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw", encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false, ["sign"]
      );
      const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
      return Array.from(new Uint8Array(signature))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("").slice(0, 16);
    }
  } catch (e) {
    console.warn("[CSRF] Web Crypto unavailable, using fallback hash:", e);
  }
  let hash = 0;
  const combined = data + "::" + secret;
  for (let i = 0; i < combined.length; i++) {
    hash = ((hash << 5) - hash) + combined.charCodeAt(i);
    hash |= 0;
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
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
  try {
    const actualHmac = await createHmac(random, secret);
    if (actualHmac.length !== expectedHmac.length) return false;
    return timingSafeEqual(actualHmac, expectedHmac);
  } catch {
    return false;
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function validateCsrf(request: NextRequest): Promise<NextResponse | null> {
  if (request.method === "GET" || request.method === "HEAD" || request.method === "OPTIONS") return null;

  const secret = getSecret();
  if (!secret) {
    console.warn("[CSRF] NEXTAUTH_SECRET not set - skipping CSRF validation");
    return null;
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
