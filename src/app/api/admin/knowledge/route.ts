import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAuth, serverErrorResponse } from "@/lib/api-utils";
import { whitelistFields, validateRequiredFields } from "@/lib/sanitize";

export async function GET(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const where: any = {};
    if (category) where.category = category;
    const items = await prisma.knowledgeItem.findMany({ where, orderBy: [{ category: "asc" }, { title: "asc" }], take: 100 });
    return successResponse(items);
  } catch (err) {
    return serverErrorResponse(err, "admin/knowledge");
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const body = await req.json();
    const missing = validateRequiredFields(body, ["title", "content"]);
    if (missing.length > 0) return errorResponse(`Missing required fields: ${missing.join(", ")}`);
    const item = await prisma.knowledgeItem.create({
      data: whitelistFields(body, ["category", "title", "content", "tags", "isActive"]) as any,
    });
    return successResponse(item, 201);
  } catch (err) {
    return serverErrorResponse(err, "admin/knowledge");
  }
}
