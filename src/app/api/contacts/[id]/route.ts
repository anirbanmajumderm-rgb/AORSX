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
    const item = await prisma.contact.update({ where: { id: numId }, data: whitelistFields(body, ["type", "value", "label", "icon", "order", "isActive"]) });
    return successResponse(item);
  } catch {
    return errorResponse("Failed to update contact");
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const { id } = await params;
    const numId = parseInt(id);
    if (isNaN(numId)) return errorResponse("Invalid ID");
    await prisma.contact.delete({ where: { id: numId } });
    return successResponse({ deleted: true });
  } catch {
    return errorResponse("Failed to delete contact");
  }
}
