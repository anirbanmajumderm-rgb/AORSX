import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAuth } from "@/lib/api-utils";

export async function GET() {
  try {
    const items = await prisma.whyChooseMe.findMany({ orderBy: { order: "asc" } });
    return successResponse(items);
  } catch {
    return errorResponse("Failed to fetch items");
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const body = await req.json();
    const item = await prisma.whyChooseMe.create({
      data: {
        title: body.title,
        description: body.description || null,
        icon: body.icon || null,
        order: body.order || 0,
        isActive: body.isActive ?? true,
      },
    });
    return successResponse(item, 201);
  } catch {
    return errorResponse("Failed to create item");
  }
}
