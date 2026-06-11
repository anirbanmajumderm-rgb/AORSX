import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAuth, serverErrorResponse } from "@/lib/api-utils";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id },
    });

    if (!conversation) return errorResponse("Conversation not found", 404);

    const messages = await prisma.chatMessage.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "asc" },
    });

    return successResponse({ conversation, messages });
  } catch (err) {
    return serverErrorResponse(err, "admin/conversations/[id]");
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const body = await req.json();
    const { status } = body;

    const existing = await prisma.conversation.findUnique({
      where: { id },
    });
    if (!existing) return errorResponse("Conversation not found", 404);

    const data: Record<string, unknown> = {};
    if (status) data.status = status;

    const updated = await prisma.conversation.update({
      where: { id },
      data,
    });

    return successResponse(updated);
  } catch (err) {
    return serverErrorResponse(err, "admin/conversations/[id]");
  }
}
