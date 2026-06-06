import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAuth } from "@/lib/api-utils";

export async function GET() {
  try {
    const settings = await prisma.setting.findMany({ orderBy: { key: "asc" } });
    const result: Record<string, string | null> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }
    return successResponse(result);
  } catch {
    return errorResponse("Failed to fetch settings");
  }
}

export async function PUT(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const body = await req.json();
    for (const [key, value] of Object.entries(body)) {
      await prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value), type: "text" },
      });
    }
    revalidatePath("/api/site-data");
    revalidatePath("/", "layout");
    revalidatePath("/projects", "page");
    revalidatePath("/projects/[slug]", "page");
    return successResponse({ updated: true });
  } catch {
    return errorResponse("Failed to update settings");
  }
}
