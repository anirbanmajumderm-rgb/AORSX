import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, serverErrorResponse, requireAuth } from "@/lib/api-utils";

export async function GET() {
  const authErr = await requireAuth();
  if (authErr) return authErr;
  try {
    const inquiries = await prisma.inquiry.findMany({ orderBy: { createdAt: "desc" } });
    return successResponse(inquiries);
  } catch (err) {
    return serverErrorResponse(err, "inquiries.list");
  }
}

export async function POST(request: NextRequest) {
  const authErr = await requireAuth();
  if (authErr) return authErr;
  try {
    const body = await request.json();
    const { name, email, message, category } = body;
    if (!message || typeof message !== "string" || !message.trim()) {
      return errorResponse("Message is required");
    }
    const inquiry = await prisma.inquiry.create({
      data: {
        name: name || null,
        email: email || null,
        message: message.trim(),
        category: category || "general",
      },
    });
    return successResponse(inquiry, 201);
  } catch (err) {
    return serverErrorResponse(err, "inquiries.create");
  }
}
