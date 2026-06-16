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
    const existing = await prisma.inquiry.findUnique({ where: { id: numericId } });
    if (!existing) return notFoundResponse("Inquiry");
    const updated = await prisma.inquiry.update({
      where: { id: numericId },
      data: {
        status: body.status ?? existing.status,
        response: body.response ?? existing.response,
        name: body.name ?? existing.name,
        email: body.email ?? existing.email,
        category: body.category ?? existing.category,
      },
    });
    return successResponse(updated);
  } catch (err) {
    return serverErrorResponse(err, "inquiries.update");
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authErr = await requireAuth();
  if (authErr) return authErr;
  try {
    const { id } = await params;
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) return errorResponse("Invalid ID");
    const existing = await prisma.inquiry.findUnique({ where: { id: numericId } });
    if (!existing) return notFoundResponse("Inquiry");
    await prisma.inquiry.delete({ where: { id: numericId } });
    return successResponse({ deleted: true });
  } catch (err) {
    return serverErrorResponse(err, "inquiries.delete");
  }
}
