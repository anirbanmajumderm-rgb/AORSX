import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, slugify, requireAuth } from "@/lib/api-utils";

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
      take: 100,
    });
    return successResponse(projects, 200, 60);
  } catch {
    return errorResponse("Failed to fetch projects");
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const body = await req.json();
    const slug = slugify(body.title);
    const existing = await prisma.project.findUnique({ where: { slug } });
    if (existing) return errorResponse("A project with this title already exists");

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
    return successResponse(project, 201);
  } catch {
    return errorResponse("Failed to create project");
  }
}
