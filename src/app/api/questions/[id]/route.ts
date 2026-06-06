import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAuth } from "@/lib/api-utils";
import { whitelistFields } from "@/lib/sanitize";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const { id } = await params;
    const numId = parseInt(id);
    if (isNaN(numId)) return errorResponse("Invalid ID");
    const body = await req.json();
    const question = await prisma.question.update({ where: { id: numId }, data: whitelistFields(body, ["visitorName", "visitorEmail", "visitorPhone", "question", "adminReply", "isImportant", "isSpam", "status"]) });
    return successResponse(question);
  } catch {
    return errorResponse("Failed to update question");
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const { id } = await params;
    const numId = parseInt(id);
    if (isNaN(numId)) return errorResponse("Invalid ID");
    await prisma.question.delete({ where: { id: numId } });
    return successResponse({ deleted: true });
  } catch {
    return errorResponse("Failed to delete question");
  }
}
