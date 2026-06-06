import { prisma, safeQuery } from "@/lib/prisma";
import { successResponse, requireAuth, serverErrorResponse, withRateLimit, getClientIp } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { createAuditLog } from "@/lib/audit";
import { getToken } from "next-auth/jwt";

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  const rateLimitError = await withRateLimit(request, "admin/ai-config/GET");
  if (rateLimitError) return rateLimitError;
  try {
    const config = await safeQuery(() => prisma.aIConfig.findFirst(), null, "ai-config:get");
    return successResponse(config);
  } catch (err) {
    return serverErrorResponse(err, "admin/ai-config");
  }
}

export async function PUT(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  const rateLimitError = await withRateLimit(request, "admin/ai-config/PUT");
  if (rateLimitError) return rateLimitError;
  try {
    const body = await request.json();
    const existing = await prisma.aIConfig.findFirst();
    const data: any = {};
    if (body.systemPrompt !== undefined) data.systemPrompt = body.systemPrompt;
    if (body.keywords !== undefined) data.keywords = Array.isArray(body.keywords) ? JSON.stringify(body.keywords) : body.keywords;
    if (body.tone !== undefined) data.tone = body.tone;
    if (body.maxResponseLength !== undefined) data.maxResponseLength = body.maxResponseLength;
    if (body.restrictedTopics !== undefined) data.restrictedTopics = Array.isArray(body.restrictedTopics) ? JSON.stringify(body.restrictedTopics) : body.restrictedTopics;
    if (body.greetingMessage !== undefined) data.greetingMessage = body.greetingMessage;

    const config = existing
      ? await prisma.aIConfig.update({ where: { id: existing.id }, data })
      : await prisma.aIConfig.create({ data });

    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
    await createAuditLog({ adminId: token?.id ? parseInt(token.id as string) : null, action: "ai_config.updated", resource: "ai_config", details: "AI configuration updated", ip: getClientIp(request) });

    return successResponse(config);
  } catch (err) {
    return serverErrorResponse(err, "admin/ai-config");
  }
}
