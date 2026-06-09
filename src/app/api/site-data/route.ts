import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { logger } from "@/lib/app-logger";

const ONE_MINUTE = 60;
const ONE_HOUR = 3600;

let cachedData: { data: any; ts: number } | null = null;
const CACHE_TTL = 30_000;

const controlKeyMapping: Record<string, string> = {
  show_services: "services_section",
  show_projects: "projects_section",
  show_reviews: "reviews_section",
  show_faq: "faq_section",
  show_contact: "contact_form",
  maintenance_mode: "maintenance_mode",
  registration_enabled: "new_registrations",
};

export async function GET() {
  if (cachedData && Date.now() - cachedData.ts < CACHE_TTL) {
    const response = NextResponse.json(cachedData.data);
    response.headers.set(
      "Cache-Control",
      `public, s-maxage=${ONE_MINUTE}, stale-while-revalidate=${ONE_HOUR}`
    );
    return response;
  }

  try {
    const [
      services,
      projects,
      reviews,
      faq,
      settingsList,
      company,
      skills,
      whyChooseMe,
      contacts,
      featureFlags,
      websiteControls,
      teamMembers,
    ] = await Promise.all([
      prisma.service.findMany({
        where: { isActive: true },
        orderBy: { order: "asc" },
        select: { id: true, title: true, description: true, icon: true, order: true },
        take: 50,
      }),
      prisma.project.findMany({
        where: { isActive: true },
        orderBy: [{ order: "asc" }, { createdAt: "desc" }],
        select: { id: true, title: true, slug: true, description: true, technologies: true, image: true, featured: true, order: true },
        take: 50,
      }),
      prisma.review.findMany({
        where: { isApproved: true, isSpam: false },
        orderBy: { createdAt: "desc" },
        select: { id: true, projectId: true, reviewerName: true, rating: true, reviewText: true, createdAt: true },
        take: 50,
      }),
      prisma.fAQ.findMany({
        where: { isActive: true },
        orderBy: { order: "asc" },
        select: { id: true, question: true, answer: true, order: true },
        take: 50,
      }),
      prisma.setting.findMany({
        select: { key: true, value: true },
        take: 50,
      }),
      prisma.company.findFirst({
        select: { id: true, name: true, tagline: true, description: true, logo: true, favicon: true, founderName: true, founderRole: true, founderImage: true, email: true, phone: true, address: true, linkedin: true, twitter: true, github: true },
      }),
      prisma.skill.findMany({
        where: { isActive: true },
        orderBy: [{ category: "asc" }, { order: "asc" }],
        select: { id: true, category: true, name: true, proficiency: true, icon: true, order: true },
        take: 50,
      }),
      prisma.whyChooseMe.findMany({
        where: { isActive: true },
        orderBy: { order: "asc" },
        select: { id: true, title: true, description: true, icon: true, order: true },
        take: 50,
      }),
      prisma.contact.findMany({
        where: { isActive: true },
        orderBy: { order: "asc" },
        select: { id: true, type: true, value: true, label: true, icon: true, order: true },
        take: 50,
      }),
      prisma.featureFlag.findMany({
        select: { key: true, enabled: true },
        take: 50,
      }),
      prisma.websiteControl.findMany({
        select: { key: true, enabled: true },
        take: 50,
      }),
      prisma.teamMember.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: "asc" },
        select: { id: true, name: true, role: true, bio: true, photo: true, displayOrder: true, isFounder: true },
        take: 50,
      }),
    ]);

    const settingsObj: Record<string, string | null> = {};
    for (const s of settingsList) settingsObj[s.key] = s.value;

    const featureFlagsObj: Record<string, boolean> = {};
    for (const f of featureFlags) featureFlagsObj[f.key] = f.enabled;

    for (const c of websiteControls) {
      const mappedKey = controlKeyMapping[c.key] ?? c.key;
      featureFlagsObj[mappedKey] = c.enabled;
    }

    const result = {
      success: true,
      data: {
        services, projects, reviews, faq, settings: settingsObj, company,
        skills, whyChooseMe, contacts, featureFlags: featureFlagsObj, teamMembers,
      },
    };

    cachedData = { data: result, ts: Date.now() };

    const response = NextResponse.json(result);
    response.headers.set(
      "Cache-Control",
      `public, s-maxage=${ONE_MINUTE}, stale-while-revalidate=${ONE_HOUR}`
    );

    return response;
  } catch (err) {
    logger.error("API", "site-data failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { success: false, error: "Failed to fetch site data" },
      { status: 500,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
}
