import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, serverErrorResponse, requireAuth, notFoundResponse } from "@/lib/api-utils";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authErr = await requireAuth();
  if (authErr) return authErr;
  try {
    const { id } = await params;
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) return errorResponse("Invalid ID");
    const body = await request.json();
    const existing = await prisma.knowledgeItem.findUnique({ where: { id: numericId } });
    if (!existing) return notFoundResponse("KnowledgeItem");
    const updated = await prisma.knowledgeItem.update({
      where: { id: numericId },
      data: {
        question: body.question ?? existing.question,
        answer: body.answer ?? existing.answer,
        category: body.category ?? existing.category,
        keywords: body.keywords ?? existing.keywords,
        isActive: body.isActive ?? existing.isActive,
      },
    });
    return successResponse(updated);
  } catch (err) {
    return serverErrorResponse(err, "knowledge.update");
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authErr = await requireAuth();
  if (authErr) return authErr;
  try {
    const { id } = await params;
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) return errorResponse("Invalid ID");
    const existing = await prisma.knowledgeItem.findUnique({ where: { id: numericId } });
    if (!existing) return notFoundResponse("KnowledgeItem");
    await prisma.knowledgeItem.delete({ where: { id: numericId } });
    return successResponse({ deleted: true });
  } catch (err) {
    return serverErrorResponse(err, "knowledge.delete");
  }
}
