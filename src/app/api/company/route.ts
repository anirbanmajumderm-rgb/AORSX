import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAuth } from "@/lib/api-utils";

export async function GET() {
  try {
    const company = await prisma.company.findFirst();
    return successResponse(company);
  } catch {
    return errorResponse("Company info not found", 404);
  }
}

export async function PUT(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const body = await req.json();
    const existing = await prisma.company.findFirst();
    if (existing) {
      const company = await prisma.company.update({ where: { id: existing.id }, data: body });
      revalidatePath("/api/site-data");
      revalidatePath("/", "layout");
      revalidatePath("/projects", "page");
      revalidatePath("/projects/[slug]", "page");
      return successResponse(company);
    }
    const company = await prisma.company.create({ data: body });
    revalidatePath("/api/site-data");
    revalidatePath("/", "layout");
    revalidatePath("/projects", "page");
    revalidatePath("/projects/[slug]", "page");
    return successResponse(company, 201);
  } catch {
    return errorResponse("Failed to update company info");
  }
}
