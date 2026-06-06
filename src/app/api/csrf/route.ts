import { NextResponse } from "next/server";
import { generateCsrfToken } from "@/lib/csrf-v2";

export const dynamic = "force-dynamic";

export async function GET() {
  const token = await generateCsrfToken();
  return NextResponse.json({ success: true, data: { token } });
}
