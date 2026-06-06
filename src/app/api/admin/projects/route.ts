import { prisma, safeQuery } from "@/lib/prisma";
import { successResponse, requireAuth, serverErrorResponse, slugify, withRateLimit, getClientIp } from "@/lib/api-utils";
import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { createAuditLog } from "@/lib/audit";
import { getToken } from "next-auth/jwt";

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const projects = await safeQuery(
      () => prisma.project.findMany({ orderBy: [{ order: "asc" }, { createdAt: "desc" }], take: 100 }),
      [],
      "admin/projects"
    );
    return successResponse(projects);
  } catch (err) {
    return serverErrorResponse(err, "admin/projects");
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  const rateLimitError = await withRateLimit(req, "admin/projects/POST");
  if (rateLimitError) return rateLimitError;
  try {
    const body = await req.json();
    const slug = slugify(body.title);
    const existing = await prisma.project.findUnique({ where: { slug } });
    if (existing) {
      return new Response(JSON.stringify({ success: false, error: "A project with this title already exists" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const project = await prisma.project.create({
      data: {
        title: body.title,
        slug,
        description: body.description || null,
        content: body.content || null,
        technologies: body.technologies || null,
        clientName: body.clientName || null,
        companyName: body.companyName || null,
        projectUrl: body.projectUrl || null,
        githubUrl: body.githubUrl || null,
        category: body.category || null,
        image: body.image || null,
        featured: body.featured || false,
        order: body.order || 0,
        isActive: body.isActive ?? true,
      },
    });

    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
    await createAuditLog({
      adminId: token?.id ? parseInt(token.id as string) : null,
      action: "project.created",
      resource: "project",
      resourceId: project.id,
      details: `Created project: ${project.title}`,
      ip: getClientIp(req),
    });

    revalidatePath("/api/site-data");
    revalidatePath("/", "layout");
    revalidatePath("/projects", "page");
    revalidatePath("/projects/[slug]", "page");

    return successResponse(project, 201);
  } catch (err) {
    return serverErrorResponse(err, "admin/projects");
  }
}
