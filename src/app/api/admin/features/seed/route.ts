import { prisma } from "@/lib/prisma";
import { successResponse, requireAuth, serverErrorResponse } from "@/lib/api-utils";

const defaultFlags = [
  { key: "ai_chatbot", label: "AI Chatbot", description: "Show/hide the AI chatbot on the main site" },
  { key: "contact_form", label: "Contact Form", description: "Enable/disable the contact form on the main site" },
  { key: "faq_section", label: "FAQ Section", description: "Show/hide the FAQ section on the main site" },
  { key: "team_section", label: "Team Section", description: "Show/hide the team/founders section on the main site" },
  { key: "maintenance_mode", label: "Maintenance Mode", description: "Show a maintenance banner on the main site" },
  { key: "new_registrations", label: "New Registrations", description: "Open/close new user registrations" },
  { key: "services_section", label: "Services Section", description: "Show/hide the services section" },
  { key: "projects_section", label: "Projects Section", description: "Show/hide the projects section" },
  { key: "reviews_section", label: "Reviews Section", description: "Show/hide the reviews section" },
];

export async function POST() {
  const authError = await requireAuth();
  if (authError) return authError;
  try {
    const count = await prisma.featureFlag.count();
    if (count > 0) {
      return successResponse({ message: "Feature flags already exist" });
    }
    await prisma.featureFlag.createMany({ data: defaultFlags, skipDuplicates: true });
    return successResponse({ message: `Seeded ${defaultFlags.length} feature flags` });
  } catch (err) {
    return serverErrorResponse(err, "admin/features/seed");
  }
}
