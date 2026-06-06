import { randomInt } from "crypto";
import { hash, compare } from "bcryptjs";
import { prisma } from "./prisma";

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 5;
const OTP_HASH_ROUNDS = 10;

export function generateOTP(): string {
  const min = Math.pow(10, OTP_LENGTH - 1);
  const max = Math.pow(10, OTP_LENGTH) - 1;
  const otp = randomInt(min, max + 1);
  return otp.toString();
}

export async function hashOTP(otp: string): Promise<string> {
  return hash(otp, OTP_HASH_ROUNDS);
}

export async function verifyOTP(otp: string, codeHash: string): Promise<boolean> {
  return compare(otp, codeHash);
}

export async function createOTPRecord(email: string): Promise<{ otp: string; id: string }> {
  const otp = generateOTP();
  const codeHash = await hashOTP(otp);

  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  const record = await prisma.emailOTP.create({
    data: { email, codeHash, expiresAt },
  });

  return { otp, id: record.id };
}

export async function validateOTPRecord(email: string, otp: string): Promise<{ valid: boolean; reason?: string }> {
  const record = await prisma.emailOTP.findFirst({
    where: {
      email,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    return { valid: false, reason: "No valid OTP found. Request a new one." };
  }

  if (new Date() > record.expiresAt) {
    return { valid: false, reason: "OTP has expired. Request a new one." };
  }

  const match = await verifyOTP(otp, record.codeHash);
  if (!match) {
    return { valid: false, reason: "Invalid OTP. Please try again." };
  }

  await prisma.emailOTP.update({
    where: { id: record.id },
    data: { used: true },
  });

  return { valid: true };
}

export async function invalidateExpiredOTPs(): Promise<number> {
  const result = await prisma.emailOTP.updateMany({
    where: {
      used: false,
      expiresAt: { lt: new Date() },
    },
    data: { used: true },
  });
  return result.count;
}
