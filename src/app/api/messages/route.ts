import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const visitorId = req.nextUrl.searchParams.get("visitorId");
    if (!visitorId) {
      return NextResponse.json({ success: false, error: "visitorId required" }, { status: 400 });
    }
    const conversation = await prisma.conversation.findFirst({
      where: { visitorId },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json({ success: true, data: conversation });
  } catch {
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { visitorId, name, email } = body;
    if (!visitorId || !name?.trim()) {
      return NextResponse.json({ success: false, error: "visitorId and name required" }, { status: 400 });
    }
    const existing = await prisma.conversation.findFirst({
      where: { visitorId, status: "active" },
    });
    if (existing) {
      return NextResponse.json({ success: true, data: existing });
    }
    const conversation = await prisma.conversation.create({
      data: {
        visitorId,
        name: name.trim(),
        email: email?.trim() || null,
      },
    });
    return NextResponse.json({ success: true, data: conversation });
  } catch {
    return NextResponse.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
