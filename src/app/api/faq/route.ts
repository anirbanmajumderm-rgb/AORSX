import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAuth } from "@/lib/api-utils";

export async function GET() {
  try {
    const faq = await prisma.fAQ.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });
    return successResponse(faq);
  } catch {
    return errorResponse("Failed to fetch FAQs");
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const body = await req.json();
    const faq = await prisma.fAQ.create({
      data: {
        question: body.question,
        answer: body.answer || null,
        order: body.order || 0,
        isActive: body.isActive ?? true,
      },
    });
    return successResponse(faq, 201);
  } catch {
    return errorResponse("Failed to create FAQ");
  }
}
