import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAuth, serverErrorResponse } from "@/lib/api-utils";
import { whitelistFields, validateRequiredFields } from "@/lib/sanitize";

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const packages = await prisma.package.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
    return successResponse(packages);
  } catch (err) {
    return serverErrorResponse(err, "admin/packages");
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const body = await req.json();
    const missing = validateRequiredFields(body, ["name", "price"]);
    if (missing.length > 0) return errorResponse(`Missing required fields: ${missing.join(", ")}`);
    const pkg = await prisma.package.create({
      data: whitelistFields(body, ["name", "description", "price", "currency", "billingCycle", "features", "category", "isActive", "sortOrder"]) as any,
    });
    return successResponse(pkg, 201);
  } catch (err) {
    return serverErrorResponse(err, "admin/packages");
  }
}
