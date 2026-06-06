import { NextRequest, NextResponse } from "next/server";
import { requireAuth, errorResponse, serverErrorResponse, withRateLimit } from "@/lib/api-utils";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  const rateLimitError = await withRateLimit(request, "admin/team/upload/POST");
  if (rateLimitError) return rateLimitError;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) return errorResponse("No file provided", 400);

    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      return errorResponse("Invalid file type. Allowed: JPEG, PNG, WebP, GIF", 400);
    }

    if (file.size > 5 * 1024 * 1024) {
      return errorResponse("File too large. Max 5MB", 400);
    }

    const ext = file.name.split(".").pop() || "jpg";
    const filename = `team-${randomUUID()}.${ext}`;
    const uploadDir = join(process.cwd(), "public", "uploads");

    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(join(uploadDir, filename), buffer);

    return NextResponse.json({
      success: true,
      data: { url: `/uploads/${filename}` },
    });
  } catch (err) {
    return serverErrorResponse(err, "admin/team/upload");
  }
}
