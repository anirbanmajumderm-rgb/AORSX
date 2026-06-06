import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getClientIp } from "@/lib/api-utils";
import { checkRateLimit } from "@/lib/rate-limit-db";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const rateResult = await checkRateLimit(ip, "analytics/record");
  if (!rateResult.success) {
    return NextResponse.json(
      { success: false, error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rateResult.resetInMs / 1000)) } }
    );
  }

  try {
    const body = await request.json();

    const page = typeof body.page === "string" ? body.page.slice(0, 500) : "/";
    const visitorId = typeof body.visitorId === "string" ? body.visitorId.slice(0, 64) : null;
    const referrer = typeof body.referrer === "string" ? body.referrer.slice(0, 500) : null;
    const country = typeof body.country === "string" ? body.country.slice(0, 100) : null;
    const device = typeof body.device === "string" ? body.device.slice(0, 50) : null;

    if (body.eventType === "pageview") {
      await prisma.pageView.create({
        data: { page, referrer, country, device, visitorId },
      });
    } else {
      const type = typeof body.type === "string" ? body.type.slice(0, 50) : "click";
      const label = typeof body.label === "string" ? body.label.slice(0, 200) : null;
      const metadata = body.metadata
        ? JSON.stringify(body.metadata).slice(0, 2000)
        : null;

      await prisma.interaction.create({
        data: { type, page, label, metadata, visitorId },
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
