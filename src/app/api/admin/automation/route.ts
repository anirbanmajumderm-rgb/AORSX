import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { Automation } from "@prisma/client";
import {
  successResponse,
  errorResponse,
  requireAuth,
  serverErrorResponse,
  withRateLimit,
  getClientIp,
} from "@/lib/api-utils";
import { createAuditLog } from "@/lib/audit";
import { getToken } from "next-auth/jwt";

export const dynamic = "force-dynamic";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AutomationConfig {
  schedule?: string;
  interval?: string;
  autoResponder?: boolean;
  retention?: string;
  template?: string;
  [key: string]: unknown;
}

interface UpdateAutomationBody {
  id: string | number;
  status?: string;
  name?: string;
  description?: string;
  trigger?: string;
  lastRunAt?: string;
  schedule?: string;
  interval?: string;
  autoResponder?: boolean;
  retention?: string;
  template?: string;
}

interface CreateAutomationBody {
  name?: string;
  description?: string;
  trigger?: string;
  config?: AutomationConfig;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseConfig(raw: string | null): AutomationConfig {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as AutomationConfig;
  } catch {
    return {};
  }
}

async function getAdminId(req: NextRequest): Promise<number | null> {
  const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
  if (!token?.id) return null;
  const parsed = parseInt(token.id as string, 10);
  return isNaN(parsed) ? null : parsed;
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  const rateLimitError = await withRateLimit(request, "admin/automation/GET");
  if (rateLimitError) return rateLimitError;

  try {
    const workflows = await prisma.automation.findMany({
      orderBy: { createdAt: "desc" },
    });

    const enriched = workflows.map((w: Automation) => {
      const config = parseConfig(w.config);
      return {
        ...w,
        config,
        schedule:      config.schedule      ?? w.trigger,
        interval:      config.interval      ?? "daily",
        autoResponder: config.autoResponder ?? false,
        retention:     config.retention     ?? "30days",
        template:      config.template      ?? "default",
      };
    });

    return successResponse(enriched);
  } catch (err) {
    return serverErrorResponse(err, "admin/automation:GET");
  }
}

// ─── PUT ──────────────────────────────────────────────────────────────────────

export async function PUT(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  const rateLimitError = await withRateLimit(req, "admin/automation/PUT");
  if (rateLimitError) return rateLimitError;

  try {
    const body: UpdateAutomationBody = await req.json();
    const {
      id, status, name, description, trigger, lastRunAt,
      schedule, interval, autoResponder, retention, template,
    } = body;

    if (!id) return errorResponse("Workflow ID is required");

    const parsedId = parseInt(String(id), 10);
    if (isNaN(parsedId)) return errorResponse("Invalid workflow ID");

    const existing = await prisma.automation.findUnique({ where: { id: parsedId } });
    if (!existing) return errorResponse("Workflow not found", 404);

    // Build scalar update fields
    const updateData: Record<string, unknown> = {};
    if (status      !== undefined) updateData.status      = status;
    if (name        !== undefined) updateData.name        = name;
    if (description !== undefined) updateData.description = description;
    if (trigger     !== undefined) updateData.trigger     = trigger;
    if (lastRunAt   !== undefined) updateData.lastRunAt   = new Date(lastRunAt);

    // Merge config fields
    const hasConfigChange =
      schedule !== undefined ||
      interval !== undefined ||
      autoResponder !== undefined ||
      retention !== undefined ||
      template !== undefined;

    if (hasConfigChange) {
      const existingConfig = parseConfig(existing.config);
      if (schedule      !== undefined) existingConfig.schedule      = schedule;
      if (interval      !== undefined) existingConfig.interval      = interval;
      if (autoResponder !== undefined) existingConfig.autoResponder = autoResponder;
      if (retention     !== undefined) existingConfig.retention     = retention;
      if (template      !== undefined) existingConfig.template      = template;
      updateData.config = JSON.stringify(existingConfig);
    }

    const workflow = await prisma.automation.update({
      where: { id: parsedId },
      data: updateData,
    });

    await createAuditLog({
      adminId: await getAdminId(req),
      action: "automation.updated",
      resource: "automation",
      resourceId: parsedId,
      details: `Updated workflow "${workflow.name}"`,
      ip: getClientIp(req),
    });

    return successResponse(workflow);
  } catch (err) {
    return serverErrorResponse(err, "admin/automation:PUT");
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  const rateLimitError = await withRateLimit(req, "admin/automation/POST");
  if (rateLimitError) return rateLimitError;

  try {
    const body: CreateAutomationBody = await req.json();
    const { name, description, trigger, config } = body;

    if (!name?.trim()) return errorResponse("Workflow name is required");

    const workflow = await prisma.automation.create({
      data: {
        name: name.trim(),
        description,
        trigger: trigger ?? "schedule",
        config: config ? JSON.stringify(config) : null,
      },
    });

    await createAuditLog({
      adminId: await getAdminId(req),
      action: "automation.created",
      resource: "automation",
      resourceId: workflow.id,
      details: `Created workflow "${workflow.name}"`,
      ip: getClientIp(req),
    });

    return successResponse(workflow, 201);
  } catch (err) {
    return serverErrorResponse(err, "admin/automation:POST");
  }
}