import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ success: true, data: messages });
  } catch {
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    const body = await req.json();
    const { content } = body;
    if (!content?.trim()) {
      return NextResponse.json({ success: false, error: "Content required" }, { status: 400 });
    }
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) {
      return NextResponse.json({ success: false, error: "Conversation not found" }, { status: 404 });
    }
    const message = await prisma.message.create({
      data: {
        conversationId,
        sender: "visitor",
        content: content.trim(),
      },
    });
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { unread: true, updatedAt: new Date() },
    });

    let autoReply: unknown = null;
    try {
      const enabledSetting = await prisma.setting.findUnique({
        where: { key: "auto_reply_enabled" },
      });
      if (enabledSetting?.value === "true") {
        const autoReplySetting = await prisma.setting.findUnique({
          where: { key: "auto_reply_message" },
        });
        const autoReplyText = autoReplySetting?.value?.trim();
        if (autoReplyText) {
          const lastAdminMsg = await prisma.message.findFirst({
            where: { conversationId, sender: "admin" },
            orderBy: { createdAt: "desc" },
          });
          const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
          const adminOffline = !lastAdminMsg || lastAdminMsg.createdAt < fiveMinAgo;
          if (adminOffline) {
            autoReply = await prisma.message.create({
              data: {
                conversationId,
                sender: "admin",
                content: autoReplyText,
              },
            });
          }
        }
      }
    } catch {}

    return NextResponse.json({ success: true, data: message, autoReply });
  } catch {
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
