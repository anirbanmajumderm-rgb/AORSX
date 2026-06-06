import { prisma, safeQuery } from "@/lib/prisma";
import { successResponse, requireAuth, serverErrorResponse, errorResponse, withRateLimit, getClientIp } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { createAuditLog, notifyAdmins } from "@/lib/audit";
import { getToken } from "next-auth/jwt";

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  const rateLimitError = await withRateLimit(request, "admin/faq/GET");
  if (rateLimitError) return rateLimitError;
  try {
    const [faqItems, questions] = await Promise.all([
      safeQuery(() => prisma.fAQ.findMany({ orderBy: { order: "asc" }, take: 100 }), [], "faq:list"),
      safeQuery(() => prisma.question.findMany({ orderBy: { createdAt: "desc" }, take: 100 }), [], "faq:questions"),
    ]);
    return successResponse({ faqItems, questions });
  } catch (err) {
    return serverErrorResponse(err, "admin/faq");
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  const rateLimitError = await withRateLimit(request, "admin/faq/POST");
  if (rateLimitError) return rateLimitError;
  try {
    const body = await request.json();
    const { type } = body;
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
    const adminId = token?.id ? parseInt(token.id as string) : null;

    if (type === "faq") {
      const faq = await prisma.fAQ.create({
        data: {
          question: body.question,
          answer: body.answer || null,
          order: body.order ?? 0,
          isActive: body.isActive ?? true,
        },
      });
      await createAuditLog({ adminId, action: "faq.created", resource: "faq", resourceId: faq.id, details: `Created FAQ: "${faq.question}"`, ip: getClientIp(request) });
      await notifyAdmins({ title: "New FAQ Added", description: `FAQ question: "${faq.question}"` });
      revalidatePath("/api/site-data");
      revalidatePath("/", "layout");
      return successResponse(faq, 201);
    } else if (type === "answer") {
      const updated = await prisma.question.update({
        where: { id: parseInt(body.questionId) },
        data: {
          adminReply: body.answer,
          status: body.status || "answered",
        },
      });
      await createAuditLog({ adminId, action: "question.answered", resource: "question", resourceId: updated.id, details: `Answered question #${updated.id}`, ip: getClientIp(request) });
      revalidatePath("/api/site-data");
      revalidatePath("/", "layout");
      return successResponse(updated);
    }

    return errorResponse("Invalid type", 400);
  } catch (err) {
    return serverErrorResponse(err, "admin/faq");
  }
}
