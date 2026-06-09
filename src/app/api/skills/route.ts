import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAuth } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const showAll = url.searchParams.get("admin") === "true";
    if (showAll) {
      const authError = await requireAuth();
      if (authError) return authError;
    }
    const skills = await prisma.skill.findMany({
      where: showAll ? undefined : { isActive: true },
      orderBy: [{ category: "asc" }, { order: "asc" }],
    });
    return successResponse(skills);
  } catch {
    return errorResponse("Failed to fetch skills");
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const body = await req.json();
    const skill = await prisma.skill.create({
      data: {
        category: body.category,
        name: body.name,
        proficiency: body.proficiency || 0,
        icon: body.icon || null,
        order: body.order || 0,
        isActive: body.isActive ?? true,
      },
    });
    return successResponse(skill, 201);
  } catch {
    return errorResponse("Failed to create skill");
  }
}
