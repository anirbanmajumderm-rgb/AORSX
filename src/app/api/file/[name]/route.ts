import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;
  const safeName = name.replace(/\.\.\//g, "").replace(/\.\.\\/g, "").replace(/[^a-zA-Z0-9._-]/g, "");
  const filePath = join("/tmp", "uploads", safeName);

  try {
    const buffer = await readFile(filePath);
    const ext = safeName.split(".").pop()?.toLowerCase() || "";
    const mimeMap: Record<string, string> = {
      jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
      gif: "image/gif", webp: "image/webp", svg: "image/svg+xml",
      pdf: "application/pdf", zip: "application/zip",
    };
    const contentType = mimeMap[ext] || "application/octet-stream";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "File not found" }, { status: 404 });
  }
}
