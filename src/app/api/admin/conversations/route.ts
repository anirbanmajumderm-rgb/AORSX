import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, requireAuth, serverErrorResponse } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (status && status !== "all") where.status = status;
    if (search) {
      where.OR = [
        { clientName: { contains: search, mode: "insensitive" } },
        { clientEmail: { contains: search, mode: "insensitive" } },
      ];
    }

    const conversations = await prisma.conversation.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: 100,
    });

    const result = await Promise.all(
      conversations.map(async (conv) => {
        const lastMessage = await prisma.chatMessage.findFirst({
          where: { conversationId: conv.id },
          orderBy: { createdAt: "desc" },
          select: { content: true, role: true, createdAt: true },
        });
        const messageCount = await prisma.chatMessage.count({
          where: { conversationId: conv.id },
        });
        return { ...conv, lastMessage, messageCount };
      })
    );

    const counts = await prisma.conversation.groupBy({
      by: ["status"],
      _count: { id: true },
    });

    const totalCount = await prisma.conversation.count();
    const unreadCount = await prisma.conversation.count({ where: { unread: true } });

    return successResponse({
      conversations: result,
      counts: { all: totalCount, unread: unreadCount, ...Object.fromEntries(counts.map(c => [c.status, c._count.id])) },
    });
  } catch (err) {
    return serverErrorResponse(err, "admin/conversations");
  }
}
