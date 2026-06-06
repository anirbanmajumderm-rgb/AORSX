export interface EnvVars {
  DATABASE_URL: string;
  NEXTAUTH_SECRET: string;
  NEXTAUTH_URL?: string;
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  EMAIL_FROM?: string;
}

const REQUIRED_VARS: (keyof EnvVars)[] = ["DATABASE_URL", "NEXTAUTH_SECRET"];

export function validateEnv(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  for (const key of REQUIRED_VARS) {
    if (!process.env[key]) missing.push(key);
  }
  return { valid: missing.length === 0, missing };
}

export function getEnv(): EnvVars {
  return {
    DATABASE_URL: process.env.DATABASE_URL || "",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || "",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    EMAIL_FROM: process.env.EMAIL_FROM,
  };
}

export function getBaseUrl(): string {
  return process.env.NEXTAUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
}
