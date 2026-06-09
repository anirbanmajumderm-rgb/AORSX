import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAuth } from "@/lib/api-utils";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const showAll = url.searchParams.get("admin") === "true";
    if (showAll) {
      const authError = await requireAuth();
      if (authError) return authError;
    }
    const contacts = await prisma.contact.findMany({
      where: showAll ? undefined : { isActive: true },
      orderBy: { order: "asc" },
      take: 50,
    });
    return successResponse(contacts);
  } catch {
    return errorResponse("Failed to fetch contacts");
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const body = await req.json();
    const contact = await prisma.contact.create({
      data: {
        type: body.type,
        value: body.value,
        label: body.label || null,
        icon: body.icon || null,
        order: body.order || 0,
        isActive: body.isActive ?? true,
      },
    });
    return successResponse(contact, 201);
  } catch {
    return errorResponse("Failed to create contact");
  }
}
