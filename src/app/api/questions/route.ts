import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAuth, withRateLimit } from "@/lib/api-utils";

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const questions = await prisma.question.findMany({ orderBy: { createdAt: "desc" } });
    return successResponse(questions);
  } catch {
    return errorResponse("Failed to fetch questions");
  }
}

export async function POST(req: NextRequest) {
  try {
    const rateLimitError = await withRateLimit(req, "contact/submit");
    if (rateLimitError) return rateLimitError;

    const body = await req.json();
    const question = await prisma.question.create({
      data: {
        visitorName: body.visitorName,
        visitorEmail: body.visitorEmail,
        visitorPhone: body.visitorPhone || null,
        question: body.question,
      },
    });
    return successResponse(question, 201);
  } catch {
    return errorResponse("Failed to submit question");
  }
}
