import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, withRateLimit } from "@/lib/api-utils";

interface DbContext {
  company: Record<string, unknown> | null;
  services: { title: string; description: string | null; icon: string | null }[];
  projects: { title: string; description: string | null; category: string | null; technologies: string | null; projectUrl: string | null }[];
  skills: { name: string; category: string; proficiency: number }[];
  faqs: { question: string; answer: string | null }[];
  packages: { name: string; description: string | null; price: number; currency: string; billingCycle: string; features: string | null; category: string }[];
  knowledgeItems: { title: string; content: string; category: string; tags: string | null }[];
  aiResponses: { keyword: string; response: string; category: string }[];
  config: Record<string, unknown> | null;
  contacts: { type: string; value: string; label: string | null }[];
  settings: Record<string, string>;
}

const GREETING_EN = /^(hi|hello|hey|howdy|good\s*(morning|afternoon|evening|day))\b/i;
const GREETING_BN = /^(হাই|হ্যালো|ওহে|নমস্কার|আসসালামু)/i;

const COMPANY_EN = [/about\s+(the\s+)?(company|us|you)/i, /who\s+(are|is)\s+(you|we)/i, /tell\s+me\s+about/i, /company\s+(info|details|profile)/i];
const COMPANY_BN = [/কোম্পানি\s*সম্পর্কে/i, /আমাদের\s*সম্পর্কে/i, /আপনারা\s*কে/i];

const SERVICE_EN = [/service/i, /what\s+(do\s+)?you\s+(do|offer|provide)/i, /what\s+can\s+you\s+(do|help|offer)/i, /capabilities/i];
const SERVICE_BN = [/সেবা/i, /সার্ভিস/i, /কী\s*কী?\s*(সেবা|সার্ভিস)/i];

const PRICING_EN = [/price/i, /cost/i, /how\s+much/i, /rate/i, /pricing/i, /budget/i, /afford/i];
const PRICING_BN = [/দাম/i, /মূল্য/i, /কত\s*টাকা/i, /প্রাইস/i, /বাজেট/i];

const PACKAGE_EN = [/package/i, /plan/i, /bundle/i];
const PACKAGE_BN = [/প্যাকেজ/i, /প্ল্যান/i];

const SKILL_EN = [/skill/i, /technology/i, /tech\s*stack/i, /technologies?/i, /expertise/i, /what\s+(do\s+)?you\s+(know|use)/i];
const SKILL_BN = [/দক্ষতা/i, /স্কিল/i, /প্রযুক্তি/i, /জানেন/i, /পারেন/i];

const PROJECT_EN = [/project/i, /portfolio/i, /work/i, /case\s+study/i, /showcase/i, /past\s+work/i];
const PROJECT_BN = [/প্রকল্প/i, /প্রজেক্ট/i, /পোর্টফোলিও/i, /কাজ/i];

const FAQ_EN = [/faq/i, /frequently\s+asked/i, /common\s+question/i];
const FAQ_BN = [/faq/i, /প্রায়শই\s*জিজ্ঞাসিত/i];

const POLICY_EN = [/policy/i, /terms?\b/i, /privacy/i, /refund/i, /rules?\b/i, /commitment/i];
const POLICY_BN = [/নীতি/i, /শর্ত/i, /গোপনীয়তা/i, /নিয়ম/i, /প্রতিশ্রুতি/i];

const CONTACT_EN = [/contact/i, /email/i, /phone/i, /call/i, /address/i, /location/i, /reach\s+us/i, /get\s+in\s+touch/i];
const CONTACT_BN = [/যোগাযোগ/i, /ইমেইল/i, /ফোন/i, /কল/i, /ঠিকানা/i, /লোকেশন/i];

const INQUIRY_EN = [/(hire|recruit)\s+(you|him|her)/i, /(start|begin)\s+(a\s+)?project/i, /(want|would\s+like|looking)\s+to\s+(build|create|develop|make|launch)/i, /(need|want|require)\s+(a\s+)?(website|app|software|platform)/i, /interested\s+in\s+(a\s+)?(quote|proposal)/i, /(i\s+have\s+an?\s+)(idea|project)/i, /lets\s+(work|start|build)/i, /book\s+(a\s+)?(call|meeting|consultation)/i];
const INQUIRY_BN = [/নিয়োগ/i, /প্রকল্প\s*শুরু/i, /বানাতে\s*চাই/i, /তৈরি\s*করতে\s*চাই/i, /দরকার/i, /প্রয়োজন/i, /আইডিয়া\s*আছে/i];

type Category = "greeting" | "company_info" | "services" | "pricing" | "packages" | "skills" | "projects" | "faq" | "policies" | "contact" | "inquiry_collection" | "general";

function classifyMessage(text: string, lang: string): Category {
  const msg = text.trim();
  const isBn = lang === "bn";

  if (GREETING_EN.test(msg) || GREETING_BN.test(msg)) return "greeting";

  const checks = isBn
    ? [
        [INQUIRY_BN, "inquiry_collection"],
        [FAQ_BN, "faq"],
        [COMPANY_BN, "company_info"],
        [SERVICE_BN, "services"],
        [PACKAGE_BN, "packages"],
        [PRICING_BN, "pricing"],
        [SKILL_BN, "skills"],
        [PROJECT_BN, "projects"],
        [CONTACT_BN, "contact"],
        [POLICY_BN, "policies"],
      ] as const
    : [
        [INQUIRY_EN, "inquiry_collection"],
        [FAQ_EN, "faq"],
        [COMPANY_EN, "company_info"],
        [SERVICE_EN, "services"],
        [PACKAGE_EN, "packages"],
        [PRICING_EN, "pricing"],
        [SKILL_EN, "skills"],
        [PROJECT_EN, "projects"],
        [CONTACT_EN, "contact"],
        [POLICY_EN, "policies"],
      ] as const;

  for (const [patterns, category] of checks) {
    for (const p of patterns) {
      if (p.test(msg)) return category as Category;
    }
  }

  return "general";
}

async function fetchDbContext(): Promise<DbContext> {
  const [company, services, projects, skills, faqs, packages, knowledgeItems, aiResponses, config, contacts, settingsList] = await Promise.all([
    prisma.company.findFirst().catch(() => null),
    prisma.service.findMany({ where: { isActive: true }, select: { title: true, description: true, icon: true }, orderBy: { order: "asc" } }).catch(() => []),
    prisma.project.findMany({ where: { isActive: true }, select: { title: true, description: true, category: true, technologies: true, projectUrl: true }, orderBy: { order: "asc" } }).catch(() => []),
    prisma.skill.findMany({ where: { isActive: true }, select: { name: true, category: true, proficiency: true }, orderBy: { order: "asc" } }).catch(() => []),
    prisma.fAQ.findMany({ where: { isActive: true }, select: { question: true, answer: true }, orderBy: { order: "asc" } }).catch(() => []),
    prisma.package.findMany({ where: { isActive: true }, select: { name: true, description: true, price: true, currency: true, billingCycle: true, features: true, category: true }, orderBy: { sortOrder: "asc" } }).catch(() => []),
    prisma.knowledgeItem.findMany({ where: { isActive: true }, select: { title: true, content: true, category: true, tags: true } }).catch(() => []),
    prisma.aIResponse.findMany({ where: { isActive: true }, select: { keyword: true, response: true, category: true } }).catch(() => []),
    prisma.aIConfig.findFirst().catch(() => null),
    prisma.contact.findMany({ where: { isActive: true }, select: { type: true, value: true, label: true }, orderBy: { order: "asc" } }).catch(() => []),
    prisma.setting.findMany({ select: { key: true, value: true } }).catch(() => []),
  ]);

  const settings: Record<string, string> = {};
  for (const s of settingsList) {
    if (s.value) settings[s.key] = s.value;
  }

  return { company, services, projects, skills, faqs, packages, knowledgeItems, aiResponses, config, contacts, settings };
}

function matchKeyword(msg: string, items: { keyword: string; response: string }[]): string | null {
  const lower = msg.toLowerCase();
  for (const item of items) {
    if (lower.includes(item.keyword.toLowerCase())) return item.response;
  }
  return null;
}

function formatPrice(p: { price: number; currency: string; billingCycle: string }): string {
  return `${p.currency} ${p.price}${p.billingCycle !== "one-time" ? `/${p.billingCycle}` : ""}`;
}

// ---- Response Builders ----

function greeting(db: DbContext, isBn: boolean): string {
  const name = (db.company?.name as string) || "Assistant";
  const svcCount = db.services.length;
  return isBn
    ? `আমি ${name}-এর সহায়ক।${svcCount ? ` আমরা ${svcCount} ধরনের পরিষেবা দিয়ে থাকি।` : ""} কীভাবে আপনাকে সাহায্য করতে পারি?`
    : `I'm the ${name} assistant.${svcCount ? ` We offer ${svcCount} services.` : ""} How can I help you?`;
}

function companyInfo(db: DbContext, isBn: boolean): string {
  const c = db.company;
  if (!c) return isBn ? "কোম্পানির তথ্য পাওয়া যায়নি।" : "Company information is not available.";

  const parts: string[] = [];
  const name = (c.name as string) || "";
  const tagline = (c.tagline as string) || "";
  const desc = (c.description as string) || "";

  if (name) parts.push(isBn ? `আমরা ${name}` : name);
  if (tagline) parts.push(isBn ? `আমাদের মূলমন্ত্র: ${tagline}` : tagline);
  if (desc) parts.push(desc);

  return parts.join(". ") + ".";
}

function servicesResponse(db: DbContext, msg: string, isBn: boolean): string {
  if (!db.services.length) return isBn ? "বর্তমানে কোনো পরিষেবা তালিকাভুক্ত নেই।" : "No services are currently listed.";

  const lower = msg.toLowerCase();
  const matched = db.services.filter(s => lower.includes(s.title.toLowerCase()) || (s.description && lower.includes(s.description.toLowerCase())));

  if (matched.length > 0) {
    return matched.map(s => {
      const pkg = db.packages.find(p => p.name.toLowerCase().includes(s.title.toLowerCase()) || p.category.toLowerCase().includes(s.title.toLowerCase()));
      const line = `• ${s.title}${s.description ? ` — ${s.description}` : ""}`;
      return pkg ? `${line}\n  ${isBn ? "প্যাকেজ" : "Package"}: ${pkg.name} — ${formatPrice(pkg)}` : line;
    }).join("\n");
  }

  const list = db.services.map(s => `• ${s.title}${s.description ? ` — ${s.description}` : ""}`).join("\n");
  return isBn
    ? `আমাদের পরিষেবাসমূহ:\n${list}\n\nবিস্তারিত জানতে যেকোনো পরিষেবার নাম বলুন।`
    : `Our services:\n${list}\n\nMention a service name for details.`;
}

function packagesResponse(db: DbContext, isBn: boolean): string {
  if (!db.packages.length) return isBn ? "কোনো প্যাকেজ নেই।" : "No packages available.";

  const list = db.packages.map(p => {
    const price = formatPrice(p);
    const features = p.features ? `\n  ${isBn ? "বৈশিষ্ট্য" : "Features"}: ${p.features.replace(/,/g, ", ")}` : "";
    return `• ${p.name} — ${price}${p.description ? `\n  ${p.description}` : ""}${features}`;
  }).join("\n");

  return isBn ? `আমাদের প্যাকেজ:\n${list}` : `Our packages:\n${list}`;
}

function pricingResponse(db: DbContext, msg: string, isBn: boolean): string {
  const lower = msg.toLowerCase();
  const matched = db.services.filter(s => lower.includes(s.title.toLowerCase()));

  if (matched.length > 0) {
    const lines = matched.map(s => {
      const pkg = db.packages.find(p => p.name.toLowerCase().includes(s.title.toLowerCase()) || p.category.toLowerCase().includes(s.title.toLowerCase()));
      return pkg
        ? `${s.title}: ${pkg.name} — ${formatPrice(pkg)}`
        : `${s.title}: ${isBn ? "যোগাযোগ করুন" : "Contact us"}`;
    });
    return (isBn ? "মূল্য:\n" : "Pricing:\n") + lines.join("\n");
  }

  if (db.packages.length) return packagesResponse(db, isBn);
  return isBn ? "মূল্যের জন্য যোগাযোগ করুন।" : "Contact us for pricing.";
}

function skillsResponse(db: DbContext, isBn: boolean): string {
  if (!db.skills.length) return isBn ? "কোনো দক্ষতা তালিকাভুক্ত নেই।" : "No skills listed.";

  const byCat: Record<string, string[]> = {};
  for (const s of db.skills) {
    const cat = s.category || "Other";
    if (!byCat[cat]) byCat[cat] = [];
    byCat[cat].push(`${s.name} (${s.proficiency}%)`);
  }

  const list = Object.entries(byCat).map(([cat, items]) => `${cat}: ${items.join(", ")}`).join("\n");
  return isBn ? `আমাদের দক্ষতা:\n${list}` : `Our expertise:\n${list}`;
}

function projectsResponse(db: DbContext, isBn: boolean): string {
  if (!db.projects.length) return isBn ? "কোনো প্রকল্প নেই।" : "No projects listed.";

  const list = db.projects.map(p =>
    `• ${p.title}${p.category ? ` (${p.category})` : ""}${p.description ? `\n  ${p.description}` : ""}${p.technologies ? `\n  ${isBn ? "প্রযুক্তি" : "Tech"}: ${p.technologies}` : ""}`
  ).join("\n");

  return isBn ? `আমাদের প্রকল্প:\n${list}` : `Our projects:\n${list}`;
}

function faqResponse(db: DbContext, msg: string, isBn: boolean): string {
  const lower = msg.toLowerCase();
  const matched = db.faqs.find(f => f.question.toLowerCase().includes(lower) || lower.includes(f.question.toLowerCase()));
  if (matched?.answer) return matched.answer;

  if (db.faqs.length) {
    const list = db.faqs.map((f, i) => `${i + 1}. ${f.question}`).join("\n");
    return isBn
      ? `সাধারণ জিজ্ঞাসা:\n${list}\n\nবিস্তারিত জানতে একটি প্রশ্ন নির্বাচন করুন।`
      : `FAQ:\n${list}\n\nSelect a question for details.`;
  }

  return isBn ? "কোনো FAQ নেই।" : "No FAQ entries.";
}

function policiesResponse(db: DbContext, isBn: boolean): string {
  const policy = db.settings["company_policy"];
  const rules = db.settings["company_rules"];
  const commitment = db.settings["company_commitment"];

  if (!policy && !rules && !commitment) {
    return isBn ? "ওয়েবসাইটের ফুটারে নীতি ও শর্তাবলী দেখুন।" : "Check our website footer for policies and terms.";
  }

  const parts: string[] = [];
  if (policy) parts.push(isBn ? `**নীতি:**\n${policy}` : `**Policy:**\n${policy}`);
  if (rules) parts.push(isBn ? `**নিয়ম:**\n${rules}` : `**Rules:**\n${rules}`);
  if (commitment) parts.push(isBn ? `**প্রতিশ্রুতি:**\n${commitment}` : `**Commitment:**\n${commitment}`);
  return parts.join("\n\n");
}

function contactResponse(db: DbContext, isBn: boolean): string {
  const c = db.company;
  const parts: string[] = [];

  if (c?.email) parts.push(isBn ? `ইমেইল: ${c.email}` : `Email: ${c.email}`);
  if (c?.phone) parts.push(isBn ? `ফোন: ${c.phone}` : `Phone: ${c.phone}`);
  if (c?.address) parts.push(isBn ? `ঠিকানা: ${c.address}` : `Address: ${c.address}`);

  for (const ct of db.contacts) {
    const label = ct.label || ct.type;
    parts.push(`${label}: ${ct.value}`);
  }

  if (!parts.length) return isBn ? "যোগাযোগের তথ্য নেই।" : "No contact info available.";
  return (isBn ? "যোগাযোগ:\n" : "Contact:\n") + parts.join("\n");
}

function generalResponse(db: DbContext, msg: string, isBn: boolean): string {
  const name = (db.company?.name as string) || "Assistant";

  const aiMatch = matchKeyword(msg, db.aiResponses);
  if (aiMatch) return aiMatch;

  const knowledgeMatch = db.knowledgeItems.find(k =>
    msg.toLowerCase().includes(k.title.toLowerCase()) ||
    (k.tags && k.tags.toLowerCase().includes(msg.toLowerCase()))
  );
  if (knowledgeMatch) return knowledgeMatch.content;

  const faqMatch = db.faqs.find(f => msg.toLowerCase().includes(f.question.toLowerCase()));
  if (faqMatch?.answer) return faqMatch.answer;

  const svcMatch = db.services.find(s => msg.toLowerCase().includes(s.title.toLowerCase()));
  if (svcMatch) {
    return isBn
      ? `${svcMatch.title}${svcMatch.description ? ` — ${svcMatch.description}` : ""}${db.packages.length ? `\n\nপ্যাকেজ বা মূল্য জানতে চাইলে জিজ্ঞাসা করুন।` : ""}`
      : `${svcMatch.title}${svcMatch.description ? ` — ${svcMatch.description}` : ""}${db.packages.length ? `\n\nAsk about packages or pricing.` : ""}`;
  }

  const svcCount = db.services.length;
  const projCount = db.projects.length;
  const skillCount = db.skills.length;

  if (isBn) {
    return `আমি ${name}-এর সহকারী।${svcCount ? ` আমরা ${svcCount}টি পরিষেবা` : ""}${projCount ? `, ${projCount}টি প্রকল্প` : ""}${skillCount ? ` এবং ${skillCount}টি দক্ষতা` : ""} নিয়ে কাজ করি।\n\nযে বিষয়ে জানতে চান:\n• পরিষেবা\n• প্রকল্প\n• দক্ষতা\n• প্যাকেজ ও মূল্য\n• যোগাযোগ\n• নীতি`;
  }

  return `I'm ${name}'s assistant.${svcCount ? ` We offer ${svcCount} services` : ""}${projCount ? `, ${projCount} projects` : ""}${skillCount ? ` and ${skillCount} skills` : ""}.\n\nAsk me about:\n• Services\n• Projects\n• Skills\n• Packages & pricing\n• Contact\n• Policies`;
}

function extractEmail(text: string): string | null {
  const m = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  return m ? m[0] : null;
}

function extractPhone(text: string): string | null {
  const m = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/);
  return m ? m[0] : null;
}

function extractName(text: string): string | null {
  const patterns = [
    /(?:my\s+name\s+is|i(?:'m| am)|call\s+me)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i,
    /(?:আমার\s*নাম|আমি|ডাকবেন)\s+([\u0980-\u09FF]+(?:\s+[\u0980-\u09FF]+)?)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1].trim();
  }
  return null;
}

function extractRequirements(text: string, name: string | null): string | null {
  const cleaned = name ? text.replace(new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "").trim() : text;
  const triggers = [
    /(?:need|want|looking\s+for|require|interested\s+in|would\s+like|planning\s+(?:to|for)|idea\s+(?:is|for|about))\s+(.+)/i,
    /(?:আমার\s+(?:প্রয়োজন|দরকার|চাই|আইডিয়া|প্ল্যান))\s+(.+)/i,
    /(?:requirements?|প্রয়োজনীয়তা)\s*[:\-]?\s*(.+)/i,
    /(?:build|create|develop|make|design)\s+(?:a\s+|an\s+)?(.+)/i,
  ];
  for (const t of triggers) {
    const m = cleaned.match(t);
    if (m && m[1].trim().length > 3) return m[1].trim();
  }
  if (cleaned.length > 10) return cleaned;
  return null;
}

function handleInquiry(msg: string, originalMessage: string, db: DbContext, isBn: boolean): { response: string; inquiry: Record<string, unknown> | null } {
  const name = extractName(originalMessage);
  const email = extractEmail(originalMessage);
  const phone = extractPhone(originalMessage);
  const requirements = extractRequirements(originalMessage, name);

  const collected: Record<string, unknown> = {};
  if (name) collected.name = name;
  if (email) collected.email = email;
  if (phone) collected.phone = phone;
  if (requirements) collected.requirements = requirements;

  const hasName = !!name;
  const hasContact = !!email || !!phone;
  const hasReqs = !!requirements && requirements.length > 5;

  if (hasName && hasContact && hasReqs) {
    return {
      response: isBn
        ? `ধন্যবাদ${name ? ` ${name}` : ""}! আপনার তথ্য সংরক্ষণ করা হয়েছে। আমরা শীঘ্রই যোগাযোগ করব${email ? ` ${email}-এ` : phone ? ` ফোনে` : ""}।`
        : `Thank you${name ? ` ${name}` : ""}! Your information has been recorded. We'll contact you soon${email ? ` at ${email}` : phone ? ` via phone` : ""}.`,
      inquiry: collected,
    };
  }

  const missing: string[] = [];
  if (!hasName) missing.push(isBn ? "নাম" : "name");
  if (!hasContact) missing.push(isBn ? "ইমেইল/ফোন" : "email/phone");
  if (!hasReqs) missing.push(isBn ? "প্রয়োজনীয়তা" : "requirements");

  return {
    response: isBn
      ? `আপনার আগ্রহের জন্য ধন্যবাদ! অনুগ্রহ করে আপনার ${missing.join(", ")} জানান।`
      : `Thank you for your interest! Please share your ${missing.join(", ")}.`,
    inquiry: null,
  };
}

const categoryBuilders: Record<string, (db: DbContext, msg: string, isBn: boolean) => string> = {
  greeting: (db, _, isBn) => greeting(db, isBn),
  company_info: (db, _, isBn) => companyInfo(db, isBn),
  services: servicesResponse,
  pricing: pricingResponse,
  packages: (db, _, isBn) => packagesResponse(db, isBn),
  skills: (db, _, isBn) => skillsResponse(db, isBn),
  projects: (db, _, isBn) => projectsResponse(db, isBn),
  faq: faqResponse,
  policies: (db, _, isBn) => policiesResponse(db, isBn),
  contact: (db, _, isBn) => contactResponse(db, isBn),
  general: generalResponse,
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get("conversationId");
  if (!conversationId) return errorResponse("conversationId required");

  const after = parseInt(searchParams.get("after") || "0", 10);

  try {
    const messages = await prisma.chatMessage.findMany({
      where: { conversationId, id: { gt: after } },
      select: { id: true, content: true, role: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });
    return successResponse({ messages });
  } catch {
    return errorResponse("Failed to fetch messages");
  }
}

export async function POST(req: NextRequest) {
  try {
    const rateLimitError = await withRateLimit(req, "ai-chat");
    if (rateLimitError) return rateLimitError;

    const { message, lang, conversationId } = await req.json();
    if (!message || typeof message !== "string") return errorResponse("Message is required");

    const originalMessage = message.trim();
    const msg = originalMessage.toLowerCase();
    const isBn = lang === "bn";

    const db = await fetchDbContext();
    const category = classifyMessage(msg, lang);

    let responseText: string;
    let inquiryData: Record<string, unknown> | null = null;

    if (category === "inquiry_collection") {
      const result = handleInquiry(msg, originalMessage, db, isBn);
      responseText = result.response;
      inquiryData = result.inquiry;
    } else {
      const builder = categoryBuilders[category] || categoryBuilders.general;
      responseText = builder(db, msg, isBn);
    }

    let convId = conversationId || null;

    if (!convId) {
      const conv = await prisma.conversation.create({
        data: {
          clientName: inquiryData?.name as string | undefined,
          clientEmail: inquiryData?.email as string | undefined,
          status: "active",
        },
      });
      convId = conv.id;
    }

    await prisma.chatMessage.create({
      data: {
        conversationId: convId as string,
        role: "user",
        content: originalMessage,
      },
    });

    await prisma.chatMessage.create({
      data: {
        conversationId: convId as string,
        role: "assistant",
        content: responseText,
      },
    });

    await prisma.conversation.update({
      where: { id: convId as string },
      data: { updatedAt: new Date() },
    });

    if (inquiryData) {
      prisma.inquiry.create({
        data: {
          name: (inquiryData.name as string) || "Unknown",
          email: (inquiryData.email as string) || null,
          phone: (inquiryData.phone as string) || null,
          requirements: (inquiryData.requirements as string) || null,
          source: "ai-chat",
          status: "new",
        },
      }).catch(() => {});
    }

    return successResponse({ response: responseText, conversationId: convId, inquiryCreated: !!inquiryData });
  } catch (err) {
    console.error("AI chat error:", err);
    return errorResponse("AI chat error");
  }
}
