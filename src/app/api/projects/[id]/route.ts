import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, slugify, requireAuth } from "@/lib/api-utils";
import { whitelistFields } from "@/lib/sanitize";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const { id } = await params;
    const numId = parseInt(id);
    if (isNaN(numId)) return errorResponse("Invalid ID");
    const body = await req.json();
    const data = whitelistFields(body, ["title", "slug", "description", "content", "technologies", "clientName", "companyName", "projectUrl", "githubUrl", "category", "image", "featured", "order", "isActive"]);
    if (body.title) {
      (data as Record<string, unknown>).slug = slugify(body.title);
    }
    const item = await prisma.project.update({ where: { id: numId }, data });
    return successResponse(item);
  } catch {
    return errorResponse("Failed to update project");
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const { id } = await params;
    const numId = parseInt(id);
    if (isNaN(numId)) return errorResponse("Invalid ID");
    await prisma.project.delete({ where: { id: numId } });
    return successResponse({ deleted: true });
  } catch {
    return errorResponse("Failed to delete project");
  }
}
