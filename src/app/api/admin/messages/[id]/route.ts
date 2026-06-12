import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, requireAuth, serverErrorResponse, errorResponse } from "@/lib/api-utils";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const { id } = await params;
    const body = await req.json();
    const { content } = body;
    if (!content?.trim()) {
      return NextResponse.json({ success: false, error: "Content required" }, { status: 400 });
    }
    const conversation = await prisma.conversation.findUnique({
      where: { id },
    });
    if (!conversation) {
      return NextResponse.json({ success: false, error: "Conversation not found" }, { status: 404 });
    }
    const message = await prisma.message.create({
      data: {
        conversationId: id,
        sender: "admin",
        content: content.trim(),
      },
    });
    await prisma.conversation.update({
      where: { id },
      data: { status: "active", updatedAt: new Date() },
    });
    return NextResponse.json({ success: true, data: message });
  } catch (err) {
    return serverErrorResponse(err, "admin/messages/reply");
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const { id } = await params;
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!conversation) {
      return errorResponse("Conversation not found", 404);
    }
    return successResponse(conversation);
  } catch (err) {
    return serverErrorResponse(err, "admin/messages/[id]");
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const { id } = await params;
    const body = await req.json();
    const allowed = ["status", "unread"];
    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = body[key];
    }
    const updated = await prisma.conversation.update({
      where: { id },
      data,
    });
    return successResponse(updated);
  } catch (err) {
    return serverErrorResponse(err, "admin/messages/patch");
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const { id } = await params;
    await prisma.message.deleteMany({ where: { conversationId: id } });
    await prisma.conversation.delete({ where: { id } });
    return successResponse({ deleted: true });
  } catch (err) {
    return serverErrorResponse(err, "admin/messages/delete");
  }
}
