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
    const item = await prisma.fAQ.update({ where: { id: numId }, data: whitelistFields(body, ["question", "answer", "order", "isActive"]) });
    return successResponse(item);
  } catch {
    return errorResponse("Failed to update FAQ");
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const { id } = await params;
    const numId = parseInt(id);
    if (isNaN(numId)) return errorResponse("Invalid ID");
    await prisma.fAQ.delete({ where: { id: numId } });
    return successResponse({ deleted: true });
  } catch {
    return errorResponse("Failed to delete FAQ");
  }
}
