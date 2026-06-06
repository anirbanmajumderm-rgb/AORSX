export function sanitizeInput(value: string): string {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/[<>"'']/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    .trim();
}

export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase().replace(/[<>"'()]/g, "");
}

export function sanitizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function whitelistFields<T extends Record<string, unknown>>(
  body: Record<string, unknown>,
  allowedFields: readonly (keyof T)[]
): T {
  const result: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (body[field as string] !== undefined) {
      result[field as string] = body[field as string];
    }
  }
  return result as T;
}

export function validateRequiredFields(
  body: Record<string, unknown>,
  requiredFields: string[]
): string[] {
  const missing: string[] = [];
  for (const field of requiredFields) {
    if (!body[field] || (typeof body[field] === "string" && !body[field].toString().trim())) {
      missing.push(field);
    }
  }
  return missing;
}

export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  stringFields: (keyof T)[]
): T {
  const result = { ...obj };
  for (const field of stringFields) {
    if (typeof result[field] === "string") {
      result[field] = sanitizeInput(result[field] as string) as T[keyof T];
    }
  }
  return result;
}
