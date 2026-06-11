import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAuth, serverErrorResponse } from "@/lib/api-utils";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const body = await req.json();
    const { content } = body;
    if (!content || typeof content !== "string") return errorResponse("Content is required");

    const existing = await prisma.conversation.findUnique({
      where: { id },
    });
    if (!existing) return errorResponse("Conversation not found", 404);

    const message = await prisma.chatMessage.create({
      data: {
        conversationId: id,
        role: "admin",
        content: content.trim(),
      },
    });

    await prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    return successResponse(message, 201);
  } catch (err) {
    return serverErrorResponse(err, "admin/conversations/[id]/messages");
  }
}
