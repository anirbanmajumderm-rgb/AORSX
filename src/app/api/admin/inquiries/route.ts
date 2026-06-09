import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAuth, serverErrorResponse } from "@/lib/api-utils";
import { whitelistFields } from "@/lib/sanitize";

export async function GET(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const where: any = {};
    if (status) where.status = status;
    const inquiries = await prisma.inquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    const counts = await prisma.inquiry.groupBy({
      by: ["status"],
      _count: { id: true },
    });
    return successResponse({ inquiries, counts });
  } catch (err) {
    return serverErrorResponse(err, "admin/inquiries");
  }
}

export async function PATCH(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const body = await req.json();
    const { id, status, notes } = body;
    if (!id) return errorResponse("Inquiry ID is required");
    const numId = parseInt(id);
    if (isNaN(numId)) return errorResponse("Invalid ID");
    const existing = await prisma.inquiry.findUnique({ where: { id: numId } });
    if (!existing) return errorResponse("Inquiry not found");
    const data: any = {};
    if (status) data.status = status;
    if (notes !== undefined) data.notes = notes;
    const updated = await prisma.inquiry.update({ where: { id: numId }, data });
    return successResponse(updated);
  } catch (err) {
    return serverErrorResponse(err, "admin/inquiries");
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const missing: string[] = [];
  if (!body.name) missing.push("name");
  if (missing.length > 0) return errorResponse(`Missing required fields: ${missing.join(", ")}`);
  try {
    const inquiry = await prisma.inquiry.create({
      data: whitelistFields(body, ["name", "email", "phone", "serviceType", "budget", "timeline", "requirements", "source"]) as any,
    });
    return successResponse(inquiry, 201);
  } catch (err) {
    return serverErrorResponse(err, "admin/inquiries");
  }
}
