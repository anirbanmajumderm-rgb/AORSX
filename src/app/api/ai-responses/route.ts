import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAuth } from "@/lib/api-utils";

export async function GET() {
  try {
    const responses = await prisma.aIResponse.findMany({ orderBy: { category: "asc" } });
    return successResponse(responses);
  } catch {
    return errorResponse("Failed to fetch AI responses");
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const body = await req.json();
    const ai = await prisma.aIResponse.create({
      data: {
        keyword: body.keyword,
        response: body.response,
        category: body.category || "general",
        isActive: body.isActive ?? true,
      },
    });
    return successResponse(ai, 201);
  } catch {
    return errorResponse("Failed to create AI response");
  }
}
