import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, requireAuth } from "@/lib/api-utils";
import { storeFile } from "@/lib/storage";

const ALLOWED_MIME_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
  "application/pdf", "application/zip",
];

const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "svg", "pdf", "zip"];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return errorResponse("No file uploaded");

    if (file.size > MAX_FILE_SIZE) {
      return errorResponse("File size exceeds 10MB limit", 400);
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return errorResponse(`File type .${ext} is not allowed. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`, 400);
    }

    if (file.type && !ALLOWED_MIME_TYPES.includes(file.type)) {
      return errorResponse(`MIME type ${file.type} is not allowed`, 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const storedName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const fileUrl = await storeFile(storedName, buffer, file.type || `image/${ext}`);

    const record = await prisma.uploadedFile.create({
      data: {
        originalName: file.name,
        storedName,
        filePath: fileUrl,
        fileType: file.type || ext,
        fileSize: file.size,
        uploadType: "admin",
      },
    });

    return successResponse({
      url: fileUrl,
      name: file.name,
      size: file.size,
      id: record.id,
    });
  } catch {
    return errorResponse("Failed to upload file");
  }
}

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const files = await prisma.uploadedFile.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return successResponse(files);
  } catch {
    return errorResponse("Failed to fetch uploads");
  }
}
