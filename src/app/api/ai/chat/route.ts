import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, withRateLimit } from "@/lib/api-utils";
import { logger } from "@/lib/app-logger";

const GREETING_PATTERNS = [/^(hi|hello|hey|howdy|good\s*(morning|afternoon|evening|day)|হাই|হ্যালো|ওহে|নমস্কার|আসসালামু)\b/i];

async function loadConfig() {
  const [aiConfig, settingsList] = await Promise.all([
    prisma.aIConfig.findFirst().catch(() => null),
    prisma.setting.findMany({ select: { key: true, value: true } }).catch(() => []),
  ]);

  const settings: Record<string, string> = {};
  for (const s of settingsList) {
    if (s.value) settings[s.key] = s.value;
  }

  const aiEnabled = aiConfig?.aiEnabled !== false;
  const greetingMessage = aiConfig?.greetingMessage || null;
  const fallbackMessage = aiConfig?.fallbackMessage || null;
  const customReplies: Record<string, string> = {};
  if (aiConfig?.customReplies) {
    try { Object.assign(customReplies, JSON.parse(aiConfig.customReplies)); } catch { /* ignore */ }
  }

  return { aiConfig, settings, aiEnabled, greetingMessage, fallbackMessage, customReplies };
}

function getFallback(lang: string, config: Awaited<ReturnType<typeof loadConfig>>): string {
  if (config.fallbackMessage) return config.fallbackMessage;
  return lang === "bn"
    ? "আপনার বার্তার জন্য ধন্যবাদ। আমাদের টিম শীঘ্রই আপনার সাথে যোগাযোগ করবে।"
    : "Thank you for your message. Our team will contact you shortly.";
}

function getGreeting(lang: string, config: Awaited<ReturnType<typeof loadConfig>>): string {
  if (config.greetingMessage) return config.greetingMessage;
  return lang === "bn"
    ? "হ্যালো! আমি সহায়ক। আমাদের পরিষেবা, প্রকল্প বা অন্য কিছু সম্পর্কে জিজ্ঞাসা করুন।"
    : "Hello! I'm the assistant. Ask about our services, projects, or anything else!";
}

async function buildResponse(msg: string, lang: string, config: Awaited<ReturnType<typeof loadConfig>>): Promise<string> {
  const lower = msg.toLowerCase();

  if (GREETING_PATTERNS.some(p => p.test(msg))) {
    return getGreeting(lang, config);
  }

  if (config.customReplies) {
    for (const [keyword, reply] of Object.entries(config.customReplies)) {
      if (lower.includes(keyword.toLowerCase())) return reply;
    }
  }

  try {
    const [company, services, projects, faqs, knowledgeItems, aiResponses] = await Promise.all([
      prisma.company.findFirst().catch(() => null),
      prisma.service.findMany({ where: { isActive: true }, select: { title: true, description: true }, orderBy: { order: "asc" } }).catch(() => []),
      prisma.project.findMany({ where: { isActive: true }, select: { title: true, description: true, technologies: true }, orderBy: { order: "asc" } }).catch(() => []),
      prisma.fAQ.findMany({ where: { isActive: true }, select: { question: true, answer: true }, orderBy: { order: "asc" } }).catch(() => []),
      prisma.knowledgeItem.findMany({ where: { isActive: true }, select: { title: true, content: true, category: true, tags: true } }).catch(() => []),
      prisma.aIResponse.findMany({ where: { isActive: true }, select: { keyword: true, response: true } }).catch(() => []),
    ]);

    for (const item of aiResponses) {
      if (lower.includes(item.keyword.toLowerCase())) return item.response;
    }

    const matchedKnowledge = knowledgeItems.find(k =>
      lower.includes(k.title.toLowerCase()) ||
      (k.tags && k.tags.toLowerCase().split(",").some((t: string) => lower.includes(t.trim())))
    );
    if (matchedKnowledge) return matchedKnowledge.content;

    const matchedFaq = faqs.find(f =>
      lower.includes(f.question.toLowerCase()) ||
      (f.answer && lower.includes(f.answer.toLowerCase().slice(0, 20)))
    );
    if (matchedFaq?.answer) return matchedFaq.answer;

    const matchedService = services.find(s => lower.includes(s.title.toLowerCase()));
    if (matchedService) {
      return lang === "bn"
        ? `${matchedService.title}${matchedService.description ? ` — ${matchedService.description}` : ""}`
        : `${matchedService.title}${matchedService.description ? ` — ${matchedService.description}` : ""}`;
    }

    if (/(about|company|who\s+(are|is)|tell\s+me\s+about)/i.test(msg) && company) {
      const parts: string[] = [];
      if (company.name) parts.push(company.name);
      if (company.tagline) parts.push(company.tagline);
      if (company.description) parts.push(company.description);
      if (parts.length) return parts.join(". ") + ".";
    }

    if (/(project|portfolio|work)/i.test(msg) && projects.length) {
      const list = projects.map(p => `• ${p.title}${p.description ? ` — ${p.description}` : ""}${p.technologies ? ` (${p.technologies})` : ""}`).join("\n");
      return lang === "bn" ? `আমাদের প্রকল্প:\n${list}` : `Our projects:\n${list}`;
    }

    if (/(skill|technology|tech|expertise)/i.test(msg)) {
      const skills = await prisma.skill.findMany({ where: { isActive: true }, select: { name: true, category: true }, orderBy: { category: "asc" } }).catch(() => []);
      if (skills.length) {
        const byCat: Record<string, string[]> = {};
        for (const s of skills) {
          const cat = s.category || "Other";
          if (!byCat[cat]) byCat[cat] = [];
          byCat[cat].push(s.name);
        }
        const list = Object.entries(byCat).map(([cat, items]) => `${cat}: ${items.join(", ")}`).join("\n");
        return lang === "bn" ? `আমাদের দক্ষতা:\n${list}` : `Our expertise:\n${list}`;
      }
    }

    if (/(price|cost|how\s+much|pricing|package|plan)/i.test(msg)) {
      const packages = await prisma.package.findMany({ where: { isActive: true }, select: { name: true, description: true, price: true, currency: true, billingCycle: true }, orderBy: { sortOrder: "asc" } }).catch(() => []);
      if (packages.length) {
        const list = packages.map(p => {
          const price = `${p.currency} ${p.price}${p.billingCycle !== "one-time" ? `/${p.billingCycle}` : ""}`;
          return `• ${p.name} — ${price}${p.description ? `\n  ${p.description}` : ""}`;
        }).join("\n");
        return lang === "bn" ? `আমাদের প্যাকেজ:\n${list}` : `Our packages:\n${list}`;
      }
    }

    if (/(contact|email|phone|address)/i.test(msg)) {
      const contacts = await prisma.contact.findMany({ where: { isActive: true }, select: { type: true, value: true, label: true }, orderBy: { order: "asc" } }).catch(() => []);
      const parts: string[] = [];
      if (company?.email) parts.push(`${lang === "bn" ? "ইমেইল" : "Email"}: ${company.email}`);
      if (company?.phone) parts.push(`${lang === "bn" ? "ফোন" : "Phone"}: ${company.phone}`);
      if (company?.address) parts.push(`${lang === "bn" ? "ঠিকানা" : "Address"}: ${company.address}`);
      for (const c of contacts) {
        parts.push(`${c.label || c.type}: ${c.value}`);
      }
      if (parts.length) return parts.join("\n");
    }
  } catch (err) {
    logger.error("Chat", "Error building response", { error: String(err) });
  }

  return getFallback(lang, config);
}

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

    const config = await loadConfig();
    if (!config.aiEnabled) {
      return errorResponse("AI chat is disabled");
    }

    const originalMessage = message.trim();
    const responseText = await buildResponse(originalMessage, lang || "en", config);

    let convId = conversationId || null;

    if (!convId) {
      const conv = await prisma.conversation.create({
        data: { status: "active" },
      });
      convId = conv.id;
    }

    await prisma.chatMessage.create({
      data: { conversationId: convId as string, role: "user", content: originalMessage },
    });

    await prisma.chatMessage.create({
      data: { conversationId: convId as string, role: "assistant", content: responseText },
    });

    await prisma.conversation.update({
      where: { id: convId as string },
      data: { updatedAt: new Date() },
    });

    return successResponse({ response: responseText, conversationId: convId });
  } catch (err) {
    logger.error("Chat", "AI chat error", { error: String(err) });
    return errorResponse("AI chat error");
  }
}
