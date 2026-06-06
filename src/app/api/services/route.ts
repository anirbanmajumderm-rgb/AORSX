import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAuth } from "@/lib/api-utils";

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });
    return successResponse(services);
  } catch {
    return errorResponse("Failed to fetch services");
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const body = await req.json();
    const service = await prisma.service.create({
      data: {
        title: body.title,
        description: body.description || null,
        icon: body.icon || null,
        order: body.order || 0,
        isActive: body.isActive ?? true,
      },
    });
    return successResponse(service, 201);
  } catch {
    return errorResponse("Failed to create service");
  }
}
