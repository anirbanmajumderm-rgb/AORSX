import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { ProjectsClient } from "./ProjectsClient";

export async function generateMetadata(): Promise<Metadata> {
  const setting = await prisma.setting.findUnique({ where: { key: "site_name" } });
  const siteName = setting?.value || "Portfolio";
  return {
    title: `Projects | ${siteName}`,
    description: "Explore my portfolio of projects spanning AI, FinTech, E-Commerce, and more.",
  };
}

export const revalidate = 3600;

export default function ProjectsPage() {
  return <ProjectsClient />;
}
