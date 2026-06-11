import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, requireAuth, serverErrorResponse } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const conversations = await prisma.conversation.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: 100,
    });

    const counts = await prisma.conversation.groupBy({
      by: ["status"],
      _count: { id: true },
    });

    const result = await Promise.all(
      conversations.map(async (conv) => {
        const lastMessage = await prisma.chatMessage.findFirst({
          where: { conversationId: conv.id },
          orderBy: { createdAt: "desc" },
          select: { content: true, role: true, createdAt: true },
        });
        return { ...conv, lastMessage };
      })
    );

    return successResponse({ conversations: result, counts });
  } catch (err) {
    return serverErrorResponse(err, "admin/conversations");
  }
}
