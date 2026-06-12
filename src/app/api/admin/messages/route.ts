import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, requireAuth, serverErrorResponse } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const status = req.nextUrl.searchParams.get("status");
    const search = req.nextUrl.searchParams.get("search")?.trim();

    const where: Record<string, unknown> = {};
    if (status && status !== "all") where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const conversations = await prisma.conversation.findMany({
      where: where as any,
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });
    const data = conversations.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      status: c.status,
      unread: c.unread,
      lastMessage: c.messages[0]?.content || null,
      lastMessageAt: c.messages[0]?.createdAt || c.updatedAt,
      createdAt: c.createdAt,
    }));
    const total = conversations.length;
    const unread = conversations.filter((c) => c.unread).length;
    return successResponse({ conversations: data, counts: { total, unread } });
  } catch (err) {
    return serverErrorResponse(err, "admin/messages");
  }
}
