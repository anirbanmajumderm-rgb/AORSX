import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, serverErrorResponse, requireAuth } from "@/lib/api-utils";

const CONFIG_KEYS = [
  "auto_reply_enabled",
  "auto_reply_ai_greeting",
  "auto_reply_ai_fallback",
  "auto_reply_ai_personality",
  "auto_reply_ai_knowledge",
  "company_policy",
  "company_rules",
  "company_commitment",
];

export async function GET() {
  const authErr = await requireAuth();
  if (authErr) return authErr;
  try {
    const settings = await prisma.setting.findMany({
      where: { key: { in: CONFIG_KEYS } },
    });
    const config: Record<string, string | null> = {};
    for (const key of CONFIG_KEYS) {
      const found = settings.find((s) => s.key === key);
      config[key] = found?.value ?? null;
    }
    return successResponse(config);
  } catch (err) {
    return serverErrorResponse(err, "ai-config.get");
  }
}

export async function PUT(request: NextRequest) {
  const authErr = await requireAuth();
  if (authErr) return authErr;
  try {
    const body = await request.json();
    const updates: { key: string; value: string }[] = [];
    for (const key of CONFIG_KEYS) {
      if (body[key] !== undefined) {
        const val = String(body[key]);
        if (val) updates.push({ key, value: val });
      }
    }
    if (updates.length === 0) return errorResponse("No valid config keys provided");
    for (const u of updates) {
      await prisma.setting.upsert({
        where: { key: u.key },
        update: { value: u.value },
        create: { key: u.key, value: u.value },
      });
    }
    return successResponse({ updated: updates.map((u) => u.key) });
  } catch (err) {
    return serverErrorResponse(err, "ai-config.update");
  }
}
