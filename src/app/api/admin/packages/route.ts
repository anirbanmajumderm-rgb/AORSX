import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, serverErrorResponse, requireAuth } from "@/lib/api-utils";

export async function GET() {
  const authErr = await requireAuth();
  if (authErr) return authErr;
  try {
    const packages = await prisma.package.findMany({ orderBy: { createdAt: "desc" } });
    return successResponse(packages);
  } catch (err) {
    return serverErrorResponse(err, "packages.list");
  }
}

export async function POST(request: NextRequest) {
  const authErr = await requireAuth();
  if (authErr) return authErr;
  try {
    const body = await request.json();
    const { name, description, price, features } = body;
    if (!name || typeof name !== "string" || !name.trim()) {
      return errorResponse("Name is required");
    }
    const pkg = await prisma.package.create({
      data: {
        name: name.trim(),
        description: description || null,
        price: price || null,
        features: features || null,
      },
    });
    return successResponse(pkg, 201);
  } catch (err) {
    return serverErrorResponse(err, "packages.create");
  }
}
