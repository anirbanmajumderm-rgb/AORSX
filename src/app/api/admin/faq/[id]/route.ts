import { prisma } from "@/lib/prisma";
import { successResponse, requireAuth, serverErrorResponse, withRateLimit, getClientIp } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { createAuditLog } from "@/lib/audit";
import { getToken } from "next-auth/jwt";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authError = await requireAuth();
  if (authError) return authError;
  const rateLimitError = await withRateLimit(request, "admin/faq/[id]/DELETE");
  if (rateLimitError) return rateLimitError;
  try {
    const idNum = parseInt(id);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "faq";
    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
    const adminId = token?.id ? parseInt(token.id as string) : null;

    if (type === "question") {
      await prisma.question.delete({ where: { id: idNum } });
      await createAuditLog({ adminId, action: "question.deleted", resource: "question", resourceId: idNum, details: `Deleted question #${idNum}`, ip: getClientIp(request) });
    } else {
      await prisma.fAQ.delete({ where: { id: idNum } });
      await createAuditLog({ adminId, action: "faq.deleted", resource: "faq", resourceId: idNum, details: `Deleted FAQ #${idNum}`, ip: getClientIp(request) });
    }
    return successResponse({ success: true });
  } catch (err) {
    return serverErrorResponse(err, "admin/faq/[id]");
  }
}
