import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProjectDetailClient } from "./ProjectDetailClient";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const projects: { slug: string }[] = await prisma.project.findMany({ select: { slug: true } });
  return projects.map((project) => ({
    slug: project.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = await prisma.project.findUnique({ where: { slug } });

  if (!project) {
    return { title: "Project Not Found" };
  }

  const siteSetting = await prisma.setting.findUnique({ where: { key: "site_name" } });
  const siteName = siteSetting?.value || "Portfolio";
  return {
    title: `${project.title} | ${siteName}`,
    description: project.description || "",
  };
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const project = await prisma.project.findUnique({ where: { slug } });

  if (!project) {
    return notFound();
  }

  return <ProjectDetailClient project={project} />;
}
