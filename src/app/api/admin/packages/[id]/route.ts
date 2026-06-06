import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAuth, serverErrorResponse, notFoundResponse } from "@/lib/api-utils";
import { whitelistFields } from "@/lib/sanitize";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const { id } = await params;
    const numId = parseInt(id);
    if (isNaN(numId)) return errorResponse("Invalid ID");
    const existing = await prisma.package.findUnique({ where: { id: numId } });
    if (!existing) return notFoundResponse("Package");
    const body = await req.json();
    const updated = await prisma.package.update({
      where: { id: numId },
      data: whitelistFields(body, ["name", "description", "price", "currency", "billingCycle", "features", "category", "isActive", "sortOrder"]),
    });
    return successResponse(updated);
  } catch (err) {
    return serverErrorResponse(err, "admin/packages/[id]");
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const { id } = await params;
    const numId = parseInt(id);
    if (isNaN(numId)) return errorResponse("Invalid ID");
    const existing = await prisma.package.findUnique({ where: { id: numId } });
    if (!existing) return notFoundResponse("Package");
    await prisma.package.delete({ where: { id: numId } });
    return successResponse({ deleted: true });
  } catch (err) {
    return serverErrorResponse(err, "admin/packages/[id]");
  }
}
