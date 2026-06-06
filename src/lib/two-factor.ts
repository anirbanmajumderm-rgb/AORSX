import { generateSecret, generateURI, verifySync as otplibVerify } from "otplib";
import { toDataURL as qrCodeToDataURL } from "qrcode";
import { randomBytes, createCipheriv, createDecipheriv, createHash, timingSafeEqual } from "crypto";
import { hash, compare } from "bcryptjs";
import { encode } from "next-auth/jwt";
import { NextResponse } from "next/server";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const BACKUP_CODE_COUNT = 10;
const BACKUP_CODE_LENGTH = 10;
const TEMP_TOKEN_EXPIRY = 5 * 60 * 1000;

function getEncryptionKey(): Buffer {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is required for 2FA encryption");
  return createHash("sha256").update(secret).digest();
}

export function encryptSecret(plainText: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

export function decryptSecret(encryptedText: string): string {
  const key = getEncryptionKey();
  const parts = encryptedText.split(":");
  if (parts.length !== 3) throw new Error("Invalid encrypted secret format");
  const iv = Buffer.from(parts[0], "hex");
  const authTag = Buffer.from(parts[1], "hex");
  const encrypted = parts[2];
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export function generateTOTPSecret(email: string): { secret: string; otpauthUrl: string } {
  const secret = generateSecret();
  const otpauthUrl = generateURI({
    issuer: "A-ORSX Admin",
    label: email,
    secret,
    strategy: "totp",
  });
  return { secret, otpauthUrl };
}

export function verifyTOTP(token: string, secret: string): boolean {
  try {
    const result = otplibVerify({ token, secret, epochTolerance: 1 });
    return result.valid;
  } catch {
    return false;
  }
}

export async function generateQRCodeDataUrl(otpauthUrl: string): Promise<string> {
  return qrCodeToDataURL(otpauthUrl, {
    width: 256,
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
  });
}

function generateRandomCode(length: number): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  const bytes = randomBytes(length);
  for (let i = 0; i < length; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

export function generateBackupCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
    const part1 = generateRandomCode(4);
    const part2 = generateRandomCode(6);
    codes.push(`${part1}-${part2}`);
  }
  return codes;
}

export async function hashBackupCodes(codes: string[]): Promise<string[]> {
  return Promise.all(codes.map((code) => hash(code, 10)));
}

export async function verifyBackupCode(
  code: string,
  hashedCodes: string[]
): Promise<number | null> {
  for (let i = 0; i < hashedCodes.length; i++) {
    const isValid = await compare(code, hashedCodes[i]);
    if (isValid) return i;
  }
  return null;
}

export async function createSessionToken(
  admin: { id: number; email: string; name: string; image?: string | null }
): Promise<string> {
  const isSecure = process.env.NODE_ENV === "production";
  const cookieName = isSecure ? "__Secure-authjs.session-token" : "authjs.session-token";
  return encode({
    token: {
      id: String(admin.id),
      email: admin.email,
      name: admin.name,
      picture: admin.image || null,
    },
    secret: process.env.NEXTAUTH_SECRET!,
    salt: cookieName,
    maxAge: 24 * 60 * 60,
  });
}

export function createTempToken(adminId: number, email: string): string {
  const payload = JSON.stringify({ adminId, email, exp: Date.now() + TEMP_TOKEN_EXPIRY });
  const encoded = Buffer.from(payload).toString("base64url");
  const hmac = createHash("sha256")
    .update(encoded + (process.env.NEXTAUTH_SECRET || ""))
    .digest("hex")
    .slice(0, 16);
  return `${encoded}.${hmac}`;
}

export function verifyTempToken(token: string): { adminId: number; email: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [encoded, signature] = parts;
    const expectedSig = createHash("sha256")
      .update(encoded + (process.env.NEXTAUTH_SECRET || ""))
      .digest("hex")
      .slice(0, 16);
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) return null;
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (Date.now() > payload.exp) return null;
    return { adminId: payload.adminId, email: payload.email };
  } catch {
    return null;
  }
}

export function setSessionCookie(response: NextResponse, token: string): void {
  const isSecure = process.env.NODE_ENV === "production";
  const cookieName = isSecure ? "__Secure-authjs.session-token" : "authjs.session-token";
  response.cookies.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecure,
    path: "/",
    maxAge: 24 * 60 * 60,
  });
}
