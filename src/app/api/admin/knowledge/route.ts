import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, serverErrorResponse, requireAuth } from "@/lib/api-utils";

export async function GET() {
  const authErr = await requireAuth();
  if (authErr) return authErr;
  try {
    const items = await prisma.knowledgeItem.findMany({ orderBy: { createdAt: "desc" } });
    return successResponse(items);
  } catch (err) {
    return serverErrorResponse(err, "knowledge.list");
  }
}

export async function POST(request: NextRequest) {
  const authErr = await requireAuth();
  if (authErr) return authErr;
  try {
    const body = await request.json();
    const { question, answer, category, keywords } = body;
    if (!question || typeof question !== "string" || !question.trim()) {
      return errorResponse("Question is required");
    }
    const item = await prisma.knowledgeItem.create({
      data: {
        question: question.trim(),
        answer: answer || null,
        category: category || "general",
        keywords: keywords || null,
      },
    });
    return successResponse(item, 201);
  } catch (err) {
    return serverErrorResponse(err, "knowledge.create");
  }
}
