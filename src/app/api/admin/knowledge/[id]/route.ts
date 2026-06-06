import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAuth, serverErrorResponse, notFoundResponse } from "@/lib/api-utils";
import { whitelistFields } from "@/lib/sanitize";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const { id } = await params;
    const numId = parseInt(id);
    if (isNaN(numId)) return errorResponse("Invalid ID");
    const item = await prisma.knowledgeItem.findUnique({ where: { id: numId } });
    if (!item) return notFoundResponse("Knowledge item");
    return successResponse(item);
  } catch (err) {
    return serverErrorResponse(err, "admin/knowledge/[id]");
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const { id } = await params;
    const numId = parseInt(id);
    if (isNaN(numId)) return errorResponse("Invalid ID");
    const existing = await prisma.knowledgeItem.findUnique({ where: { id: numId } });
    if (!existing) return notFoundResponse("Knowledge item");
    const body = await req.json();
    const updated = await prisma.knowledgeItem.update({
      where: { id: numId },
      data: whitelistFields(body, ["category", "title", "content", "tags", "isActive"]),
    });
    return successResponse(updated);
  } catch (err) {
    return serverErrorResponse(err, "admin/knowledge/[id]");
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const { id } = await params;
    const numId = parseInt(id);
    if (isNaN(numId)) return errorResponse("Invalid ID");
    const existing = await prisma.knowledgeItem.findUnique({ where: { id: numId } });
    if (!existing) return notFoundResponse("Knowledge item");
    await prisma.knowledgeItem.delete({ where: { id: numId } });
    return successResponse({ deleted: true });
  } catch (err) {
    return serverErrorResponse(err, "admin/knowledge/[id]");
  }
}
