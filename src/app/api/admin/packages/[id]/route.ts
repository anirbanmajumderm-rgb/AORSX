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
    const existing = await prisma.package.findUnique({ where: { id: numericId } });
    if (!existing) return notFoundResponse("Package");
    const updated = await prisma.package.update({
      where: { id: numericId },
      data: {
        name: body.name ?? existing.name,
        description: body.description ?? existing.description,
        price: body.price ?? existing.price,
        features: body.features ?? existing.features,
        isActive: body.isActive ?? existing.isActive,
      },
    });
    return successResponse(updated);
  } catch (err) {
    return serverErrorResponse(err, "packages.update");
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authErr = await requireAuth();
  if (authErr) return authErr;
  try {
    const { id } = await params;
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) return errorResponse("Invalid ID");
    const existing = await prisma.package.findUnique({ where: { id: numericId } });
    if (!existing) return notFoundResponse("Package");
    await prisma.package.delete({ where: { id: numericId } });
    return successResponse({ deleted: true });
  } catch (err) {
    return serverErrorResponse(err, "packages.delete");
  }
}
