import { NextRequest } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAuth } from "@/lib/api-utils";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const { id } = await params;
    const numId = parseInt(id);
    if (isNaN(numId)) return errorResponse("Invalid ID");

    const file = await prisma.uploadedFile.findUnique({ where: { id: numId } });
    if (!file) return errorResponse("File not found", 404);

    const isVercel = !!process.env.VERCEL_URL;
    const filePath = isVercel
      ? path.join("/tmp", "uploads", file.storedName)
      : path.join(process.cwd(), "public", "uploads", file.storedName);

    try { await unlink(filePath); } catch { /* file may not exist on disk */ }

    await prisma.uploadedFile.delete({ where: { id: numId } });
    return successResponse({ deleted: true });
  } catch {
    return errorResponse("Failed to delete file");
  }
}
