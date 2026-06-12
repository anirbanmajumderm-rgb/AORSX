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
  } catch (err) {
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
    return NextResponse.json({ success: true, data: message });
  } catch (err) {
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
