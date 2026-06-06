import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAuth, serverErrorResponse } from "@/lib/api-utils";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

function maskKey(key: string): string {
  if (key.length <= 12) return key.slice(0, 8) + "****";
  return key.slice(0, 12) + "****" + key.slice(-4);
}

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const keys = await prisma.apiKey.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        key: true,
        status: true,
        lastUsedAt: true,
        requests: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const maskedKeys = keys.map((k) => ({
      ...k,
      key: maskKey(k.key),
      fullKey: undefined,
    }));

    return successResponse(maskedKeys);
  } catch (err) {
    return serverErrorResponse(err, "admin/api-keys");
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const body = await req.json();
    const { name } = body;

    if (!name) return errorResponse("Key name is required");
    if (name.length < 2) return errorResponse("Key name must be at least 2 characters");

    const prefix = name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "").slice(0, 8);
    const secret = randomBytes(24).toString("hex");
    const fullKey = `sk_${prefix}_${secret}`;

    const apiKey = await prisma.apiKey.create({
      data: { name, key: fullKey, status: "active" },
    });

    return successResponse({
      ...apiKey,
      key: fullKey,
      maskedKey: maskKey(fullKey),
    }, 201);
  } catch (err) {
    return serverErrorResponse(err, "admin/api-keys:create");
  }
}

export async function DELETE(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const body = await req.json();
    if (!body.id) return errorResponse("Key ID is required");

    const existing = await prisma.apiKey.findUnique({ where: { id: body.id } });
    if (!existing) return errorResponse("API key not found", 404);

    await prisma.apiKey.delete({ where: { id: body.id } });
    return successResponse({ deleted: true });
  } catch (err) {
    return serverErrorResponse(err, "admin/api-keys:delete");
  }
}
