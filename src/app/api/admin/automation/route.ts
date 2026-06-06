import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAuth, serverErrorResponse, withRateLimit, getClientIp } from "@/lib/api-utils";
import { createAuditLog } from "@/lib/audit";
import { getToken } from "next-auth/jwt";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  const rateLimitError = await withRateLimit(request, "admin/automation/GET");
  if (rateLimitError) return rateLimitError;

  try {
    const workflows = await prisma.automation.findMany({ orderBy: { createdAt: "desc" } });

    const enriched = workflows.map((w) => {
      let configObj: Record<string, unknown> = {};
      try {
        configObj = w.config ? JSON.parse(w.config) : {};
      } catch {
        configObj = {};
      }
      return {
        ...w,
        config: configObj,
        schedule: configObj.schedule || w.trigger,
        interval: configObj.interval || "daily",
        autoResponder: configObj.autoResponder ?? false,
        retention: configObj.retention || "30days",
        template: configObj.template || "default",
      };
    });

    return successResponse(enriched);
  } catch (err) {
    return serverErrorResponse(err, "admin/automation");
  }
}

export async function PUT(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  const rateLimitError = await withRateLimit(req, "admin/automation/PUT");
  if (rateLimitError) return rateLimitError;

  try {
    const body = await req.json();
    const { id, status, schedule, interval, autoResponder, retention, template, name, description, trigger, lastRunAt } = body;

    if (!id) return errorResponse("Workflow ID is required");

    const parsedId = parseInt(id);
    if (isNaN(parsedId)) return errorResponse("Invalid workflow ID");

    const existing = await prisma.automation.findUnique({ where: { id: parsedId } });
    if (!existing) return errorResponse("Workflow not found", 404);

    const updateData: Record<string, unknown> = {};

    if (status) updateData.status = status;
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (trigger) updateData.trigger = trigger;
    if (lastRunAt) updateData.lastRunAt = new Date(lastRunAt);

    const existingConfig: Record<string, unknown> = {};
    try {
      if (existing.config) Object.assign(existingConfig, JSON.parse(existing.config));
    } catch {}

    const configChanged = schedule || interval !== undefined || autoResponder !== undefined || retention || template;
    if (configChanged) {
      if (schedule) existingConfig.schedule = schedule;
      if (interval) existingConfig.interval = interval;
      if (autoResponder !== undefined) existingConfig.autoResponder = autoResponder;
      if (retention) existingConfig.retention = retention;
      if (template) existingConfig.template = template;
      updateData.config = JSON.stringify(existingConfig);
    }

    const workflow = await prisma.automation.update({
      where: { id: parsedId },
      data: updateData,
    });

    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
    await createAuditLog({
      adminId: token?.id ? parseInt(token.id as string) : null,
      action: "automation.updated",
      resource: "automation",
      resourceId: parsedId,
      details: `Updated workflow "${workflow.name}"`,
      ip: getClientIp(req),
    });

    return successResponse(workflow);
  } catch (err) {
    return serverErrorResponse(err, "admin/automation:update");
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  const rateLimitError = await withRateLimit(req, "admin/automation/POST");
  if (rateLimitError) return rateLimitError;

  try {
    const body = await req.json();
    const { name, description, trigger, config } = body;

    if (!name) return errorResponse("Workflow name is required");

    const configStr = config ? JSON.stringify(config) : null;

    const workflow = await prisma.automation.create({
      data: { name, description, trigger: trigger || "schedule", config: configStr },
    });

    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
    await createAuditLog({
      adminId: token?.id ? parseInt(token.id as string) : null,
      action: "automation.created",
      resource: "automation",
      resourceId: workflow.id,
      details: `Created workflow "${workflow.name}"`,
      ip: getClientIp(req),
    });

    return successResponse(workflow, 201);
  } catch (err) {
    return serverErrorResponse(err, "admin/automation:create");
  }
}
