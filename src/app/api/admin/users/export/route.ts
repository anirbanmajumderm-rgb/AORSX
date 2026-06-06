import { prisma, safeQuery } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-utils";
import { NextResponse } from "next/server";

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const users = await safeQuery(() => prisma.adminUser.findMany({ orderBy: { createdAt: "desc" } }), [], "users:export");
    const header = "Name,Email,Role,Status,Joined Date,Last Active\n";
    const rows = (users as any[]).map(u =>
      `${u.name || ""},${u.email || ""},${u.role?.name || "N/A"},${u.status || "active"},${u.createdAt?.toISOString().split("T")[0] || ""},${u.lastActive?.toISOString().split("T")[0] || "Never"}`
    ).join("\n");

    return new NextResponse(header + rows, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=users-export.csv",
      },
    });
  } catch {
    return new NextResponse("Export failed", { status: 500 });
  }
}
