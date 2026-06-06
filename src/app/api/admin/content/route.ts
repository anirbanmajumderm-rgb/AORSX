import { prisma, safeQuery } from "@/lib/prisma";
import { successResponse, errorResponse, requireAuth, serverErrorResponse, withRateLimit, getClientIp } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { createAuditLog, notifyAdmins } from "@/lib/audit";
import { getToken } from "next-auth/jwt";

export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  const rateLimitError = await withRateLimit(request, "admin/content/GET");
  if (rateLimitError) return rateLimitError;
  try {
    const [settingsList, services, whyChooseMe, company] = await Promise.all([
      safeQuery(() => prisma.setting.findMany(), [], "content:settings"),
      safeQuery(() => prisma.service.findMany({ orderBy: { order: "asc" } }), [], "content:services"),
      safeQuery(() => prisma.whyChooseMe.findMany({ orderBy: { order: "asc" } }), [], "content:whyChooseMe"),
      safeQuery(() => prisma.company.findFirst(), null, "content:company"),
    ]);
    const settings: Record<string, string | null> = {};
    for (const s of settingsList) settings[s.key] = s.value;
    return successResponse({ settings, services, whyChooseMe, company });
  } catch (err) {
    return serverErrorResponse(err, "admin/content");
  }
}

export async function PATCH(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  const rateLimitError = await withRateLimit(request, "admin/content/PATCH");
  if (rateLimitError) return rateLimitError;
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return errorResponse("Invalid request body");
    }

    await prisma.$transaction(async (tx) => {
      if (body.updates && Array.isArray(body.updates)) {
        for (const update of body.updates) {
          if (!update.key || typeof update.key !== 'string') continue;
          await tx.setting.upsert({
            where: { key: update.key },
            update: { value: String(update.value ?? "") },
            create: { key: update.key, value: String(update.value ?? "") },
          });
        }
      }

      if (body.services && Array.isArray(body.services)) {
        await tx.service.deleteMany();
        for (let i = 0; i < body.services.length; i++) {
          const s = body.services[i];
          if (!s.title || typeof s.title !== 'string') continue;
          await tx.service.create({
            data: { title: s.title, description: s.description || "", icon: s.icon || null, order: s.order ?? i, isActive: true },
          });
        }
      }

      if (body.whyChooseMe && Array.isArray(body.whyChooseMe)) {
        await tx.whyChooseMe.deleteMany();
        for (let i = 0; i < body.whyChooseMe.length; i++) {
          const w = body.whyChooseMe[i];
          if (!w.title || typeof w.title !== 'string') continue;
          await tx.whyChooseMe.create({
            data: { title: w.title, description: w.description || "", icon: w.icon || null, order: w.order ?? i, isActive: true },
          });
        }
      }

      if (body.company && typeof body.company === 'object') {
        const cleanCompany: Record<string, any> = {};
        const allowedFields = ['name', 'tagline', 'description', 'founderName', 'founderRole', 'founderBio', 'founderImage', 'email', 'phone', 'address', 'linkedin', 'twitter', 'github', 'logo', 'mission', 'vision', 'aboutText'];
        for (const key of allowedFields) {
          if (key in body.company) cleanCompany[key] = body.company[key];
        }
        const existing = await tx.company.findFirst();
        if (existing) {
          await tx.company.update({ where: { id: existing.id }, data: cleanCompany });
        } else {
          await tx.company.create({ data: cleanCompany as any });
        }
      } else {
        const siteNameUpdate = body.updates?.find((u: any) => u.key === 'site_name');
        if (siteNameUpdate?.value) {
          const existing = await tx.company.findFirst();
          if (existing) {
            await tx.company.update({ where: { id: existing.id }, data: { name: String(siteNameUpdate.value) } });
          }
        }
      }
    });

    revalidatePath("/api/site-data");
    revalidatePath("/", "layout");
    revalidatePath("/projects", "page");
    revalidatePath("/projects/[slug]", "page");

    const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
    const sections: string[] = [];
    if (body.updates) sections.push("settings");
    if (body.services) sections.push("services");
    if (body.whyChooseMe) sections.push("whyChooseMe");
    if (body.company) sections.push("company");
    await createAuditLog({
      adminId: token?.id ? parseInt(token.id as string) : null,
      action: "content.updated",
      resource: "site_content",
      details: "Site content settings updated",
      ip: getClientIp(request),
    });
    await notifyAdmins({ title: "Content Updated", description: `Content section(s) updated: ${sections.length > 0 ? sections.join(", ") : "settings"}` });

    return successResponse({ success: true });
  } catch (err) {
    return serverErrorResponse(err, "admin/content");
  }
}
