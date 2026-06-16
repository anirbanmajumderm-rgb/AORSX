import { put, del } from "@vercel/blob";
import { writeFile, unlink, mkdir } from "fs/promises";
import { join } from "path";

function useBlob(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

function onVercel(): boolean {
  return !!process.env.VERCEL_URL;
}

export async function storeFile(
  storedName: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  if (useBlob()) {
    const blob = await put(`uploads/${storedName}`, buffer, {
      contentType,
      access: "public",
    });
    return blob.url;
  }

  const uploadDir = onVercel()
    ? join("/tmp", "uploads")
    : join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(join(uploadDir, storedName), buffer);

  return onVercel() ? `/api/file/${storedName}` : `/uploads/${storedName}`;
}

export async function deleteStoredFile(storedName: string, fileUrl?: string): Promise<void> {
  if (useBlob() && fileUrl?.startsWith("http")) {
    await del(fileUrl);
    return;
  }

  const uploadDir = onVercel()
    ? join("/tmp", "uploads")
    : join(process.cwd(), "public", "uploads");
  try {
    await unlink(join(uploadDir, storedName));
  } catch {
    /* file may not exist on disk */
  }
}
