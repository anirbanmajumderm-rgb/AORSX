import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAuth, serverErrorResponse, notFoundResponse } from "@/lib/api-utils";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const { id } = await params;
    const numId = parseInt(id);
    if (isNaN(numId)) return errorResponse("Invalid ID");
    const inquiry = await prisma.inquiry.findUnique({ where: { id: numId } });
    if (!inquiry) return notFoundResponse("Inquiry");
    return successResponse(inquiry);
  } catch (err) {
    return serverErrorResponse(err, "admin/inquiries/[id]");
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const { id } = await params;
    const numId = parseInt(id);
    if (isNaN(numId)) return errorResponse("Invalid ID");
    const existing = await prisma.inquiry.findUnique({ where: { id: numId } });
    if (!existing) return notFoundResponse("Inquiry");
    const body = await req.json();
    const updated = await prisma.inquiry.update({
      where: { id: numId },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.email !== undefined && { email: body.email }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.serviceType !== undefined && { serviceType: body.serviceType }),
        ...(body.budget !== undefined && { budget: body.budget }),
        ...(body.timeline !== undefined && { timeline: body.timeline }),
        ...(body.requirements !== undefined && { requirements: body.requirements }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.notes !== undefined && { notes: body.notes }),
      },
    });
    return successResponse(updated);
  } catch (err) {
    return serverErrorResponse(err, "admin/inquiries/[id]");
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const { id } = await params;
    const numId = parseInt(id);
    if (isNaN(numId)) return errorResponse("Invalid ID");
    const existing = await prisma.inquiry.findUnique({ where: { id: numId } });
    if (!existing) return notFoundResponse("Inquiry");
    await prisma.inquiry.delete({ where: { id: numId } });
    return successResponse({ deleted: true });
  } catch (err) {
    return serverErrorResponse(err, "admin/inquiries/[id]");
  }
}
