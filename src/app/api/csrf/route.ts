import { NextResponse } from "next/server";
import { generateCsrfToken } from "@/lib/csrf-v2";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const token = await generateCsrfToken();
    if (!token) {
      return NextResponse.json({ success: false, error: "CSRF not available (NEXTAUTH_SECRET missing or crypto unavailable)" });
    }
    return NextResponse.json({ success: true, data: { token } });
  } catch (err) {
    console.error("[CSRF] Route error:", err);
    return NextResponse.json({ success: false, error: "CSRF generation failed" });
  }
}
