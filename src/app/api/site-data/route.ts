import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

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
      prisma.service.findMany({ where: { isActive: true }, orderBy: { order: "asc" }, take: 50 }),
      prisma.project.findMany({ where: { isActive: true }, orderBy: [{ order: "asc" }, { createdAt: "desc" }], take: 50 }),
      prisma.review.findMany({ where: { isApproved: true, isSpam: false }, orderBy: { createdAt: "desc" }, take: 50 }),
      prisma.fAQ.findMany({ where: { isActive: true }, orderBy: { order: "asc" }, take: 50 }),
      prisma.setting.findMany({ take: 50 }),
      prisma.company.findFirst(),
      prisma.skill.findMany({ where: { isActive: true }, orderBy: [{ category: "asc" }, { order: "asc" }], take: 50 }),
      prisma.whyChooseMe.findMany({ where: { isActive: true }, orderBy: { order: "asc" }, take: 50 }),
      prisma.contact.findMany({ where: { isActive: true }, orderBy: { order: "asc" }, take: 50 }),
      prisma.featureFlag.findMany({ take: 50 }),
      prisma.websiteControl.findMany({ take: 50 }),
      prisma.teamMember.findMany({ where: { isActive: true }, orderBy: { displayOrder: "asc" }, take: 50 }),
    ]);

    const settingsObj: Record<string, string | null> = {};
    for (const s of settingsList) settingsObj[s.key] = s.value;

    const featureFlagsObj: Record<string, boolean> = {};
    for (const f of featureFlags) featureFlagsObj[f.key] = f.enabled;

    for (const c of websiteControls) {
      const mappedKey = controlKeyMapping[c.key] ?? c.key;
      featureFlagsObj[mappedKey] = c.enabled;
    }

    return NextResponse.json({
      success: true,
      data: {
        services,
        projects,
        reviews,
        faq,
        settings: settingsObj,
        company,
        skills,
        whyChooseMe,
        contacts,
        featureFlags: featureFlagsObj,
        teamMembers,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch site data" },
      { status: 500 }
    );
  }
}
