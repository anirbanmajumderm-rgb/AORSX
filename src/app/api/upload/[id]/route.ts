import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAuth } from "@/lib/api-utils";
import { deleteStoredFile } from "@/lib/storage";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const { id } = await params;
    const numId = parseInt(id);
    if (isNaN(numId)) return errorResponse("Invalid ID");

    const file = await prisma.uploadedFile.findUnique({ where: { id: numId } });
    if (!file) return errorResponse("File not found", 404);

    await deleteStoredFile(file.storedName, file.filePath);
    await prisma.uploadedFile.delete({ where: { id: numId } });
    return successResponse({ deleted: true });
  } catch {
    return errorResponse("Failed to delete file");
  }
}
