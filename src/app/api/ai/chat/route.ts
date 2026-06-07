import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, withRateLimit } from "@/lib/api-utils";

type MessageCategory =
  | "greeting"
  | "company_info"
  | "services"
  | "pricing"
  | "packages"
  | "skills"
  | "projects"
  | "faq"
  | "policies"
  | "contact"
  | "inquiry_collection"
  | "general";

interface DbContext {
  company: Record<string, unknown> | null;
  services: { title: string; description: string | null; icon: string | null }[];
  projects: { title: string; description: string | null; category: string | null; technologies: string | null; projectUrl: string | null }[];
  skills: { name: string; category: string; proficiency: number }[];
  faqs: { question: string; answer: string | null }[];
  whys: { title: string; description: string | null }[];
  packages: { name: string; description: string | null; price: number; currency: string; billingCycle: string; features: string | null; category: string }[];
  knowledgeItems: { title: string; content: string; category: string; tags: string | null }[];
  featureFlags: { key: string; enabled: boolean }[];
  aiResponses: { keyword: string; response: string; category: string }[];
  config: Record<string, unknown> | null;
  contacts: { type: string; value: string; label: string | null }[];
  settings: Record<string, string>;
}

const STOP_WORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "can", "shall", "to", "of", "in", "for",
  "on", "with", "at", "by", "from", "as", "into", "through", "during",
  "before", "after", "above", "below", "between", "out", "off", "over",
  "under", "again", "further", "then", "once", "this", "that", "these",
  "those", "i", "me", "my", "we", "our", "you", "your", "he", "him",
  "his", "she", "her", "it", "its", "they", "them", "their", "what",
  "which", "who", "whom", "when", "where", "why", "how", "all", "each",
  "every", "both", "few", "more", "most", "some", "any", "no", "not",
  "only", "own", "same", "so", "than", "too", "very", "just", "about",
  "up", "if", "or", "and", "but", "because", "while", "until", "now",
  "here", "there", "please", "yes", "no", "hi", "hello", "hey",
]);

function tokenize(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^\w\s\u0980-\u09FF]/g, " ")
    .split(/\s+/)
    .filter((w: string) => w.length > 2 && !STOP_WORDS.has(w));
}

function computeTfScore(queryTokens: string[], text: string): number {
  const lower = text.toLowerCase();
  let score = 0;
  for (const token of queryTokens) {
    const count = (lower.match(new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
    if (count > 0) score += 1 + Math.log(count);
  }
  return score;
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function fuzzyMatch(query: string, target: string): number {
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase().trim();
  if (t.includes(q)) return 0;
  if (q.length <= 4) {
    const dist = levenshtein(q, t.substring(0, q.length));
    return dist;
  }
  const words = q.split(/\s+/);
  let totalDist = 0;
  for (const word of words) {
    const tWords = t.split(/\s+/);
    let bestDist = word.length;
    for (const tw of tWords) {
      const d = levenshtein(word, tw);
      if (d < bestDist) bestDist = d;
    }
    totalDist += bestDist;
  }
  return totalDist;
}

const GREETINGS_EN = /^(hi|hello|hey|howdy)\b/i;
const GREETINGS_TIME_EN = /\b(good\s*(morning|evening|afternoon|day))\b/i;
const GREETINGS_BN = /^(হাই|হ্যালো|ওহে|নমস্কার|আসসালামু)/i;

const COMPANY_EN = [/about\s+(the\s+)?(company|us|you)/i, /who\s+(are|is)\s+(you|we|anirban)/i, /tell\s+me\s+about/i, /company\s+(info|information|details|profile|overview)/i, /what\s+(is|does)\s+(your|the)\s+company/i];
const COMPANY_BN = [/কোম্পানি\s*সম্পর্কে/i, /আমাদের\s*সম্পর্কে/i, /আপনারা\s*কে/i, /তোমরা\s*কে/i, /কোম্পানির\s*তথ্য/i, /কোম্পানি\s*বিষয়ে/i];

const SERVICE_EN = [/service/i, /what\s+(do\s+)?you\s+(do|offer|provide)/i, /what\s+(services|work)\s+do\s+you/i, /what\s+can\s+you\s+(do|help|offer)/i, /capabilities/i, /solutions/i];
const SERVICE_BN = [/সেবা/i, /সার্ভিস/i, /কী\s*(কী)?\s*(সেবা|সার্ভিস)/i, /আপনারা\s*(কী)\s*(করে|করেন)/i];

const PRICING_EN = [/price/i, /cost/i, /how\s+much/i, /rate/i, /pricing/i, /charging/i, /what('s| is) the (cost|price)/i, /afford/i, /budget/i, /cheap/i, /expensive/i, /how\s+much\s+(does|do|is|are)\s+/i, /what('s| is) the (rate|fee)/i];
const PRICING_BN = [/দাম/i, /মূল্য/i, /কত\s*টাকা/i, /প্রাইস/i, /কস্ট/i, /বাজেট/i, /সস্তা/i];

const PACKAGE_EN = [/package/i, /plan/i, /bundle/i, /pricing\s+plan/i, /what\s+packages/i, /service\s+package/i];
const PACKAGE_BN = [/প্যাকেজ/i, /প্ল্যান/i, /প্যাক/i];

const SKILL_EN = [/skill/i, /technology/i, /tech\s*stack/i, /tech/i, /framework/i, /language/i, /tool/i, /expertise/i, /proficien/i, /what\s+(do\s+)?you\s+(know|use)/i, /stack/i, /technologies?\s+you\s+use/i];
const SKILL_BN = [/দক্ষতা/i, /স্কিল/i, /টেক/i, /প্রযুক্তি/i, /টেকনোলজি/i, /জানেন/i, /পারেন/i];

const PROJECT_EN = [/project/i, /portfolio/i, /work/i, /case\s+study/i, /previous\s+work/i, /past\s+project/i, /what\s+(have|did)\s+you\s+(built|done|made|created)/i, /showcase/i, /sample/i];
const PROJECT_BN = [/প্রকল্প/i, /প্রজেক্ট/i, /পোর্টফোলিও/i, /কাজ/i, /আগের\s*কাজ/i, /করা\s*প্রজেক্ট/i];

const FAQ_EN = [/faq/i, /frequently\s+asked/i, /common\s+question/i, /have\s+a\s+question/i];
const FAQ_BN = [/faq/i, /প্রায়শই\s*জিজ্ঞাসিত/i, /সাধারণ\s*প্রশ্ন/i, /প্রশ্ন\s*আছে/i];

const POLICY_EN = [/policy/i, /term/i, /condition/i, /privacy/i, /refund/i, /cancellation/i, /return/i, /legal/i, /disclaimer/i, /rules?\b/i, /commitment/i];
const POLICY_BN = [/নীতি/i, /শর্ত/i, /গোপনীয়তা/i, /প্রাইভেসি/i, /রিফান্ড/i, /বাতিল/i, /নিয়ম/i, /প্রতিশ্রুতি/i, /নীতিমালা/i];

const CONTACT_EN = [/contact/i, /email/i, /phone/i, /call/i, /address/i, /location/i, /where\s+(are|is)\s+(you|your)/i, /reach/i, /get\s+in\s+touch/i, /support/i, /message\s+us/i, /talk\s+to/i];
const CONTACT_BN = [/যোগাযোগ/i, /ইমেইল/i, /ফোন/i, /কল/i, /ঠিকানা/i, /লোকেশন/i, /কোথায়/i, /কিভাবে\s*যোগাযোগ/i, /সাপোর্ট/i];

const INQUIRY_EN = [/(hire|recruit|employ)\s+(you|him|her|me)/i, /(start|begin)\s+(a\s+)?project/i, /(work|collaborate|partner)\s+(with|together)/i, /(want|would\s+like|looking)\s+to\s+(build|create|develop|make|launch)/i, /(need|want|require)\s+(a\s+)?(website|app|software|platform|solution|tool|system)/i, /(interested\s+in|need)\s+(a\s+)?(quote|proposal|estimate)/i, /(can\s+you\s+)(help|build|create|develop|make)\s+(me|for\s+me|a\s+project)/i, /(i\s+have\s+an?\s+)(idea|project|requirement)/i, /(let's|lets)\s+(work|start|build|collaborate)/i, /i\s+(want|need|would\s+like)\s+(to\s+)?(discuss|talk|speak)\s+(about|to)/i, /book\s+(a\s+)?(call|meeting|consultation|appointment)/i];
const INQUIRY_BN = [/নিয়োগ/i, /প্রকল্প\s*শুরু/i, /একসঙ্গে\s*কাজ/i, /বানাতে\s*চাই/i, /তৈরি\s*করতে\s*চাই/i, /দরকার/i, /প্রয়োজন/i, /আইডিয়া\s*আছে/i];

function classifyMessage(msg: string, lang: string): MessageCategory {
  const text = msg.trim();
  const isBn = lang === "bn";

  if (GREETINGS_EN.test(text) || GREETINGS_TIME_EN.test(text) || GREETINGS_BN.test(text))
    return "greeting";

  if (isBn) {
    if (INQUIRY_BN.some((p: RegExp) => p.test(text))) return "inquiry_collection";
    if (FAQ_BN.some((p: RegExp) => p.test(text))) return "faq";
    if (COMPANY_BN.some((p: RegExp) => p.test(text))) return "company_info";
    if (SERVICE_BN.some((p: RegExp) => p.test(text))) return "services";
    if (PACKAGE_BN.some((p: RegExp) => p.test(text))) return "packages";
    if (PRICING_BN.some((p: RegExp) => p.test(text))) return "pricing";
    if (SKILL_BN.some((p: RegExp) => p.test(text))) return "skills";
    if (PROJECT_BN.some((p: RegExp) => p.test(text))) return "projects";
    if (CONTACT_BN.some((p: RegExp) => p.test(text))) return "contact";
    if (POLICY_BN.some((p: RegExp) => p.test(text))) return "policies";
  } else {
    if (INQUIRY_EN.some((p: RegExp) => p.test(text))) return "inquiry_collection";
    if (FAQ_EN.some((p: RegExp) => p.test(text))) return "faq";
    if (COMPANY_EN.some((p: RegExp) => p.test(text))) return "company_info";
    if (SERVICE_EN.some((p: RegExp) => p.test(text))) return "services";
    if (PACKAGE_EN.some((p: RegExp) => p.test(text))) return "packages";
    if (PRICING_EN.some((p: RegExp) => p.test(text))) return "pricing";
    if (SKILL_EN.some((p: RegExp) => p.test(text))) return "skills";
    if (PROJECT_EN.some((p: RegExp) => p.test(text))) return "projects";
    if (CONTACT_EN.some((p: RegExp) => p.test(text))) return "contact";
    if (POLICY_EN.some((p: RegExp) => p.test(text))) return "policies";
  }

  return "general";
}

async function fetchDbContext(): Promise<DbContext> {
  const [
    company,
    services,
    projects,
    skills,
    faqs,
    whys,
    packages,
    knowledgeItems,
    featureFlags,
    aiResponses,
    config,
    contacts,
    settingsList,
  ] = await Promise.all([
    prisma.company.findFirst().catch(() => null),
    prisma.service.findMany({ where: { isActive: true }, select: { title: true, description: true, icon: true }, orderBy: { order: "asc" } }).catch(() => []),
    prisma.project.findMany({ where: { isActive: true }, select: { title: true, description: true, category: true, technologies: true, projectUrl: true }, orderBy: { order: "asc" } }).catch(() => []),
    prisma.skill.findMany({ where: { isActive: true }, select: { name: true, category: true, proficiency: true }, orderBy: { order: "asc" } }).catch(() => []),
    prisma.fAQ.findMany({ where: { isActive: true }, select: { question: true, answer: true }, orderBy: { order: "asc" } }).catch(() => []),
    prisma.whyChooseMe.findMany({ where: { isActive: true }, select: { title: true, description: true }, orderBy: { order: "asc" } }).catch(() => []),
    prisma.package.findMany({ where: { isActive: true }, select: { name: true, description: true, price: true, currency: true, billingCycle: true, features: true, category: true }, orderBy: { sortOrder: "asc" } }).catch(() => []),
    prisma.knowledgeItem.findMany({ where: { isActive: true }, select: { title: true, content: true, category: true, tags: true } }).catch(() => []),
    prisma.featureFlag.findMany({ select: { key: true, enabled: true } }).catch(() => []),
    prisma.aIResponse.findMany({ where: { isActive: true }, select: { keyword: true, response: true, category: true } }).catch(() => []),
    prisma.aIConfig.findFirst().catch(() => null),
    prisma.contact.findMany({ where: { isActive: true }, select: { type: true, value: true, label: true }, orderBy: { order: "asc" } }).catch(() => []),
    prisma.setting.findMany({ select: { key: true, value: true } }).catch(() => []),
  ]);

  const settings: Record<string, string> = {};
  for (const s of settingsList) {
    if (s.value) settings[s.key] = s.value;
  }

  return { company, services, projects, skills, faqs, whys, packages, knowledgeItems, featureFlags, aiResponses, config, contacts, settings };
}

function findBestAiResponse(db: DbContext, msg: string): string | null {
  const lower = msg.toLowerCase();
  for (const r of db.aiResponses) {
    if (lower.includes(r.keyword.toLowerCase())) return r.response;
  }
  return null;
}

function findBestKnowledgeMatch(db: DbContext, msg: string): { content: string; score: number; title: string } | null {
  const tokens = tokenize(msg);
  if (!tokens.length) return null;

  let best: { content: string; score: number; title: string } | null = null;

  for (const item of db.knowledgeItems) {
    const searchText = `${item.title} ${item.content} ${item.tags || ""}`;
    const score = computeTfScore(tokens, searchText);
    if (score > 0 && (!best || score > best.score)) {
      best = { content: item.content, score, title: item.title };
    }
  }

  if (best && best.score >= tokens.length * 0.5) return best;
  return null;
}

function findBestFaqMatch(db: DbContext, msg: string): { question: string; answer: string | null; score: number } | null {
  const tokens = tokenize(msg);
  if (!tokens.length) return null;

  let best: { question: string; answer: string | null; score: number } | null = null;

  for (const faq of db.faqs) {
    const score = computeTfScore(tokens, faq.question);
    if (score > 0 && (!best || score > best.score)) {
      best = { question: faq.question, answer: faq.answer, score };
    }
  }

  if (best && best.score >= tokens.length * 0.5) return best;
  return null;
}

function findRelevantService(db: DbContext, msg: string): { title: string; description: string | null } | null {
  const tokens = tokenize(msg);
  if (!tokens.length) return null;

  let best: { title: string; description: string | null; score: number } | null = null;

  for (const svc of db.services) {
    const searchText = `${svc.title} ${svc.description || ""}`;
    const score = computeTfScore(tokens, searchText);
    if (score > 0 && (!best || score > best.score)) {
      best = { ...svc, score };
    }
  }

  if (!best || best.score < 1) {
    const lower = msg.toLowerCase();
    for (const svc of db.services) {
      const dist = fuzzyMatch(lower, svc.title);
      if (dist <= 2) {
        best = { ...svc, score: Math.max(1, 3 - dist) };
      }
    }
  }

  return best || null;
}

function findRelevantPackage(db: DbContext, serviceTitle: string): DbContext["packages"][0] | null {
  const lower = serviceTitle.toLowerCase();
  const tokens = tokenize(serviceTitle);

  let best: { pkg: DbContext["packages"][0]; score: number } | null = null;

  for (const pkg of db.packages) {
    const searchText = `${pkg.name} ${pkg.description || ""} ${pkg.category || ""}`;
    const score = computeTfScore(tokens, searchText) + (lower.includes(pkg.category?.toLowerCase() || "") ? 2 : 0);
    if (score > 0 && (!best || score > best.score)) {
      best = { pkg, score };
    }
  }

  return best ? best.pkg : null;
}

function buildGreetingResponse(db: DbContext, isBn: boolean): string {
  const name = (db.company?.name as string) || "Assistant";
  const greetingMsg = db.config?.greetingMessage as string | undefined;
  if (greetingMsg) return greetingMsg;

  const servicesCount = db.services.length;
  const skillsCount = db.skills.length;

  return isBn
    ? `হ্যালো! আমি ${name}-এর এআই সহায়ক।${servicesCount ? ` আমরা ${servicesCount}টি পরিষেবা` : ""}${skillsCount ? ` এবং ${skillsCount}টি প্রযুক্তিগত দক্ষতা` : ""} নিয়ে কাজ করি। কীভাবে আপনাকে সাহায্য করতে পারি?`
    : `Hello! I'm ${name}'s AI assistant.${servicesCount ? ` We offer ${servicesCount} services` : ""}${skillsCount ? ` with ${skillsCount} technical skills` : ""}. How can I help you today?`;
}

function buildCompanyResponse(db: DbContext, isBn: boolean): string {
  const c = db.company;
  if (!c) return isBn ? "কোম্পানি সম্পর্কে তথ্য পাওয়া যায়নি।" : "Company information is not available at the moment.";

  const name = (c.name as string) || "";
  const tagline = (c.tagline as string) || "";
  const description = (c.description as string) || "";
  const about = (c.aboutText as string) || "";
  const vision = (c.vision as string) || "";
  const mission = (c.mission as string) || "";

  if (isBn) {
    let resp = `${name}${tagline ? ` হল একটি ${tagline}` : ""}।`;
    if (description) resp += ` ${description}`;
    if (about) resp += ` ${about}`;
    if (vision || mission) resp += ` আমাদের ${vision ? `দৃষ্টিভঙ্গি: ${vision}` : ""}${mission ? `${vision ? "" : ""} লক্ষ্য: ${mission}` : ""}।`;
    return resp;
  }

  let resp = `${name}${tagline ? ` is a ${tagline}` : ""}.`;
  if (description) resp += ` ${description}`;
  if (about) resp += ` ${about}`;
  if (vision || mission) {
    resp += " Our";
    if (vision) resp += ` vision: ${vision}`;
    if (vision && mission) resp += " |";
    if (mission) resp += ` mission: ${mission}`;
    resp += ".";
  }
  return resp;
}

function buildServicesResponse(db: DbContext, msg: string, isBn: boolean): string {
  if (!db.services.length) return isBn ? "কোনো পরিষেবা তালিকাভুক্ত নেই।" : "No services are currently listed.";

  const specific = findRelevantService(db, msg);
  if (specific) {
    const lines = [`• ${specific.title}${specific.description ? ` — ${specific.description}` : ""}`];
    const relPkg = findRelevantPackage(db, specific.title);
    if (relPkg) {
      const price = `${relPkg.currency} ${relPkg.price}${relPkg.billingCycle !== "one-time" ? `/${relPkg.billingCycle}` : ""}`;
      lines.push(isBn
        ? `  প্যাকেজ: ${relPkg.name} — ${price}`
        : `  Package: ${relPkg.name} — ${price}`);
    }
    return lines.join("\n");
  }

  const names = db.services.map((s: DbContext["services"][0]) => `• ${s.title}${s.description ? ` — ${s.description}` : ""}`);
  const list = names.join("\n");

  return isBn
    ? `আমরা নিম্নলিখিত পরিষেবাগুলি অফার করি:\n${list}\n\nকোনো নির্দিষ্ট পরিষেবা সম্পর্কে আরও জানতে চাইলে জিজ্ঞাসা করুন।`
    : `We offer the following services:\n${list}\n\nAsk about any specific service for more details.`;
}

function buildPackagesResponse(db: DbContext, msg: string, isBn: boolean): string {
  if (!db.packages.length) return isBn ? "কোনো প্যাকেজ পাওয়া যায়নি।" : "No packages are currently available.";

  const specific = findRelevantService(db, msg);
  if (specific) {
    const relPkg = findRelevantPackage(db, specific.title);
    if (relPkg) {
      const price = `${relPkg.currency} ${relPkg.price}${relPkg.billingCycle !== "one-time" ? `/${relPkg.billingCycle}` : ""}`;
      return isBn
        ? `${specific.title}-এর প্যাকেজ:\n${relPkg.name} — ${price}${relPkg.description ? `\n${relPkg.description}` : ""}${relPkg.features ? `\nবৈশিষ্ট্য: ${relPkg.features.replace(/,/g, ", ")}` : ""}`
        : `Package for ${specific.title}:\n${relPkg.name} — ${price}${relPkg.description ? `\n${relPkg.description}` : ""}${relPkg.features ? `\nFeatures: ${relPkg.features.replace(/,/g, ", ")}` : ""}`;
    }
  }

  const lines = db.packages.map((p: DbContext["packages"][0]) => {
    const price = `${p.currency} ${p.price}${p.billingCycle !== "one-time" ? `/${p.billingCycle}` : ""}`;
    const features = p.features ? `\n     Features: ${p.features.replace(/,/g, ", ")}` : "";
    return `• ${p.name} — ${price}${p.description ? `\n     ${p.description}` : ""}${features}`;
  });
  const list = lines.join("\n");

  return isBn
    ? `আমাদের প্যাকেজ সমূহ:\n${list}\n\nকোনো প্যাকেজ সম্পর্কে আরও জানতে চান?`
    : `Here are our available packages:\n${list}\n\nWould you like more details on any package?`;
}

function buildPricingResponse(db: DbContext, msg: string, isBn: boolean): string {
  const tokens = tokenize(msg);
  const mentionService = tokens.length > 0 && db.services.some((s: DbContext["services"][0]) => computeTfScore(tokens, s.title) > 0);

  if (mentionService) {
    const relLines: string[] = [];
    for (const svc of db.services) {
      const svcScore = computeTfScore(tokens, svc.title);
      if (svcScore > 0) {
        const relPkg = findRelevantPackage(db, svc.title);
        if (relPkg) {
          const price = `${relPkg.currency} ${relPkg.price}${relPkg.billingCycle !== "one-time" ? `/${relPkg.billingCycle}` : ""}`;
          relLines.push(isBn
            ? `${svc.title}: ${relPkg.name} — ${price}`
            : `${svc.title}: ${relPkg.name} — ${price}`);
        } else {
          relLines.push(isBn ? `${svc.title}: যোগাযোগ করুন` : `${svc.title}: Contact us`);
        }
      }
    }
    if (relLines.length) {
      return (isBn ? "মূল্য তালিকা:\n" : "Pricing:\n") + relLines.join("\n");
    }
  }

  if (db.packages.length) {
    return buildPackagesResponse(db, msg, isBn);
  }
  return isBn
    ? "দাম সম্পর্কিত তথ্যের জন্য, অনুগ্রহ করে আমাদের সাথে যোগাযোগ করুন।"
    : "For pricing information, please contact us.";
}

function buildSkillsResponse(db: DbContext, isBn: boolean): string {
  if (!db.skills.length) return isBn ? "কোনো দক্ষতা তালিকাভুক্ত নেই।" : "No skills are currently listed.";

  const byCategory: Record<string, string[]> = {};
  for (const s of db.skills) {
    const cat = s.category || "Other";
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(`${s.name} (${s.proficiency}%)`);
  }

  const lines = Object.entries(byCategory).map(
    ([cat, items]) => `${cat}: ${items.join(", ")}`
  );
  const list = lines.join("\n");

  return isBn
    ? `আমাদের প্রযুক্তিগত দক্ষতা:\n${list}`
    : `Our technical expertise:\n${list}`;
}

function buildProjectsResponse(db: DbContext, isBn: boolean): string {
  if (!db.projects.length) return isBn ? "কোনো প্রকল্প তালিকাভুক্ত নেই।" : "No projects are currently listed.";

  const lines = db.projects.map((p: DbContext["projects"][0]) => {
    let entry = `• ${p.title}`;
    if (p.category) entry += ` (${p.category})`;
    if (p.description) entry += `\n     ${p.description}`;
    if (p.technologies) entry += `\n     Tech: ${p.technologies}`;
    return entry;
  });
  const list = lines.join("\n");

  return isBn
    ? `আমাদের উল্লেখযোগ্য প্রকল্প:\n${list}`
    : `Our notable projects:\n${list}`;
}

function buildFaqResponse(db: DbContext, msg: string, isBn: boolean): string {
  const match = findBestFaqMatch(db, msg);
  if (match && match.answer) return match.answer;

  if (db.faqs.length) {
    const titles = db.faqs.map((f: DbContext["faqs"][0], i: number) => `${i + 1}. ${f.question}`);
    return isBn
      ? `এখানে কিছু সাধারণ জিজ্ঞাসা:\n${titles.join("\n")}\n\nকোনো নির্দিষ্ট প্রশ্নের উত্তর জানতে চাইলে জিজ্ঞাসা করুন।`
      : `Here are some frequently asked questions:\n${titles.join("\n")}\n\nFeel free to ask about any specific question.`;
  }

  return isBn
    ? "কোনো FAQ পাওয়া যায়নি। কোনো প্রশ্ন থাকলে নির্দ্বিধায় জিজ্ঞাসা করুন।"
    : "No FAQ entries are available. Feel free to ask any question.";
}

function buildPoliciesResponse(db: DbContext, isBn: boolean): string {
  const policy = db.settings["company_policy"];
  const rules = db.settings["company_rules"];
  const commitment = db.settings["company_commitment"];

  if (!policy && !rules && !commitment) {
    return isBn
      ? "আমাদের নীতি ও শর্তাবলী সম্পর্কে বিস্তারিত জানতে ওয়েবসাইটের ফুটারে দেওয়া লিংকে ক্লিক করুন।"
      : "Our policies and terms are available on our website. Please check the footer or contact us for specific policy questions.";
  }

  const parts: string[] = [];
  if (policy) {
    parts.push(isBn ? `**আমাদের নীতি:**\n${policy}` : `**Our Policy:**\n${policy}`);
  }
  if (rules) {
    parts.push(isBn ? `**নিয়মাবলী:**\n${rules}` : `**Rules:**\n${rules}`);
  }
  if (commitment) {
    parts.push(isBn ? `**প্রতিশ্রুতি:**\n${commitment}` : `**Our Commitment:**\n${commitment}`);
  }

  return parts.join("\n\n");
}

function buildContactResponse(db: DbContext, isBn: boolean): string {
  const c = db.company;
  const contacts = db.contacts;
  const parts: string[] = [];

  if (c?.email) parts.push(isBn ? `ইমেইল: ${c.email}` : `Email: ${c.email}`);
  if (c?.phone) parts.push(isBn ? `ফোন: ${c.phone}` : `Phone: ${c.phone}`);
  if (c?.address) parts.push(isBn ? `ঠিকানা: ${c.address}` : `Address: ${c.address}`);

  for (const ct of contacts) {
    const label = ct.label || ct.type;
    parts.push(`${label}: ${ct.value}`);
  }

  if (!parts.length) return isBn ? "বর্তমানে কোনো যোগাযোগের তথ্য নেই।" : "No contact information is available at the moment.";

  const sep = "\n";
  return (isBn ? "আমাদের সাথে যোগাযোগ করুন:\n" : "Get in touch with us:\n") + parts.join(sep);
}

function buildGeneralResponse(db: DbContext, msg: string, isBn: boolean): string {
  const name = (db.company?.name as string) || "Assistant";
  const servicesCount = db.services.length;
  const projectsCount = db.projects.length;
  const skillsCount = db.skills.length;

  const enIntro = `I'm ${name}'s AI assistant. I can tell you about our ${servicesCount} services, ${projectsCount} projects, ${skillsCount} technical skills, packages, and more.`;
  const bnIntro = `আমি ${name}-এর এআই সহায়ক। আমি আমাদের ${servicesCount}টি পরিষেবা, ${projectsCount}টি প্রকল্প, ${skillsCount}টি দক্ষতা, প্যাকেজ এবং আরও অনেক কিছু সম্পর্কে তথ্য দিতে পারি।`;

  const kb = findBestKnowledgeMatch(db, msg);
  if (kb) return kb.content;

  const ai = findBestAiResponse(db, msg);
  if (ai) return ai;

  const faq = findBestFaqMatch(db, msg);
  if (faq && faq.answer) return faq.answer;

  const svc = findRelevantService(db, msg);
  if (svc) {
    return isBn
      ? `${svc.title}${svc.description ? ` — ${svc.description}` : ""}${db.packages.length ? `\n\nএই পরিষেবা সম্পর্কে আরও জানতে 'প্যাকেজ' বা 'মূল্য' জিজ্ঞাসা করুন।` : ""}`
      : `${svc.title}${svc.description ? ` — ${svc.description}` : ""}${db.packages.length ? `\n\nAsk about 'pricing' or 'packages' for more details on this service.` : ""}`;
  }

  const enHelp = "\n\nYou can ask me about:\n• Services we offer\n• Our projects and portfolio\n• Technical skills and expertise\n• Packages and pricing\n• Company information\n• Frequently asked questions\n• Policies\n• Or anything else!";
  const bnHelp = "\n\nআপনি জিজ্ঞাসা করতে পারেন:\n• আমাদের পরিষেবা\n• প্রকল্প ও পোর্টফোলিও\n• প্রযুক্তিগত দক্ষতা\n• প্যাকেজ ও মূল্য\n• কোম্পানি সম্পর্কে তথ্য\n• সাধারণ জিজ্ঞাসা\n• নীতি\n• অথবা অন্য যেকোনো কিছু!";

  return (isBn ? bnIntro : enIntro) + (isBn ? bnHelp : enHelp);
}

function extractEmail(text: string): string | null {
  const match = text.match(/[\w.-]+@[\w.-]+\.\w+/);
  return match ? match[0] : null;
}

function extractPhone(text: string): string | null {
  const match = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/);
  return match ? match[0] : null;
}

function extractName(text: string): string | null {
  const patterns = [
    /(?:my\s+name\s+is|i(?:'m| am)|call\s+me|this\s+is)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i,
    /(?:আমার\s*নাম|আমি|ডাকবেন)\s+([\u0980-\u09FF]+(?:\s+[\u0980-\u09FF]+)?)/i,
  ];
  for (const p of patterns) {
    const match = text.match(p);
    if (match) return match[1].trim();
  }
  return null;
}

function extractRequirements(text: string, name: string | null): string | null {
  const cleaned = name ? text.replace(new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "").trim() : text;
  const triggers = [
    /(?:need|want|looking\s+for|require|interested\s+in|would\s+like|planning\s+(?:to|for)|idea\s+(?:is|for|about)|project\s+(?:is|about|involves))\s+(.+)/i,
    /(?:আমার\s+(?:প্রয়োজন|দরকার|চাই|আইডিয়া|প্ল্যান|আগ্রহ|প্রজেক্ট))\s+(.+)/i,
    /(?:requirements?|প্রয়োজনীয়তা)\s*[:\-]?\s*(.+)/i,
    /(?:build|create|develop|make|design)\s+(?:a\s+|an\s+)?(.+)/i,
  ];
  for (const t of triggers) {
    const match = cleaned.match(t);
    if (match && match[1].trim().length > 3) return match[1].trim();
  }
  if (cleaned.length > 10) return cleaned;
  return null;
}

function buildInquiryResponse(
  collected: { name: string | null; email: string | null; phone: string | null; requirements: string | null },
  db: DbContext,
  name: string | null,
  email: string | null,
  phone: string | null,
  requirements: string | null,
  isBn: boolean
): { response: string; create: boolean; data: Record<string, unknown> | null } {
  const hasName = !!collected.name;
  const hasEmail = !!collected.email;
  const hasReqs = !!collected.requirements;

  const collectedData: Record<string, unknown> = {};
  if (collected.name) collectedData.name = collected.name;
  if (collected.email) collectedData.email = collected.email;
  if (collected.phone) collectedData.phone = collected.phone;
  if (collected.requirements) collectedData.requirements = collected.requirements;
  if (collected.phone && !hasEmail) collectedData.email = collected.phone;
  else if (collected.name) collectedData.email = null;

  if (hasName && hasReqs) {
    return {
      response: isBn
        ? `ধন্যবাদ${collected.name ? ` ${collected.name}` : ""}! আপনার তথ্য সংগ্রহ করা হয়েছে। আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব${collected.email ? ` ${collected.email}-এ` : collected.phone ? ` ফোনে` : ""}।`
        : `Thank you${collected.name ? ` ${collected.name}` : ""}! I've recorded your inquiry. We'll get back to you soon${collected.email ? ` at ${collected.email}` : collected.phone ? ` via phone` : ""}.`,
      create: true,
      data: collectedData,
    };
  }

  const missing: string[] = [];
  if (!hasName) missing.push(isBn ? "নাম" : "name");
  if (!hasEmail) missing.push(isBn ? "ইমেইল" : "email");
  if (!hasReqs) missing.push(isBn ? "প্রয়োজনীয়তা" : "requirements");

  const prompt = isBn
    ? `আপনার প্রজেক্টের বিষয়ে জানতে পেরে খুশি হলাম! অনুগ্রহ করে আপনার ${missing.join(", ")} জানান।`
    : `I'd be happy to help with your project! Could you please share your ${missing.join(", ")}?`;

  return { response: prompt, create: false, data: null };
}

function handleInquiry(
  msg: string,
  originalMessage: string,
  db: DbContext,
  isBn: boolean
): { response: string; inquiryCreated: boolean } {
  const name = extractName(originalMessage);
  const email = extractEmail(originalMessage);
  const phone = extractPhone(originalMessage);
  const requirements = extractRequirements(originalMessage, name);

  const collected = { name, email, phone, requirements };

  const isFirstMessage = msg.length < 100;
  const hasNewData = !!name || !!email || !!phone || !!(requirements && requirements.length > 5);

  if (isFirstMessage && !hasNewData) {
    const companyName = (db.company?.name as string) || "";
    return {
      response: isBn
        ? `আপনার আগ্রহের জন্য ধন্যবাদ! আমি ${companyName}-এর পক্ষ থেকে আপনাকে সাহায্য করতে পেরে খুশি। আপনার নাম, ইমেইল এবং আপনার প্রজেক্ট সম্পর্কে কিছু তথ্য দিন, আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।`
        : `Thank you for your interest! I'd be happy to help you with your project. Please share your name, email, and a brief description of your requirements so we can get in touch with you.`,
      inquiryCreated: false,
    };
  }

  const result = buildInquiryResponse(collected, db, name, email, phone, requirements, isBn);

  if (result.create && result.data) {
    prisma.inquiry
      .create({
        data: {
          name: (result.data.name as string) || "Unknown",
          email: (result.data.email as string) || null,
          phone: (result.data.phone as string) || null,
          requirements: (result.data.requirements as string) || null,
          source: "ai-chat",
          status: "new",
        },
      })
      .catch(() => {});

    return { response: result.response, inquiryCreated: true };
  }

  return { response: result.response, inquiryCreated: false };
}

export async function POST(req: NextRequest) {
  try {
    const rateLimitError = await withRateLimit(req, "ai-chat");
    if (rateLimitError) return rateLimitError;

    const { message, lang } = await req.json();
    if (!message || typeof message !== "string") return errorResponse("Message is required");

    const originalMessage = message.trim();
    const msg = originalMessage.toLowerCase();
    const isBn = lang === "bn";

    const db = await fetchDbContext();
    const category = classifyMessage(msg, lang);

    if (category === "inquiry_collection") {
      const result = handleInquiry(msg, originalMessage, db, isBn);
      return successResponse({ response: result.response, inquiryCreated: result.inquiryCreated });
    }

    if (category === "greeting") {
      return successResponse({ response: buildGreetingResponse(db, isBn) });
    }

    const prioritized = findBestAiResponse(db, msg);
    if (prioritized) return successResponse({ response: prioritized });

    const kbMatch = findBestKnowledgeMatch(db, msg);
    if (kbMatch) return successResponse({ response: kbMatch.content });

    const faqMatch = findBestFaqMatch(db, msg);
    if (faqMatch && faqMatch.answer) return successResponse({ response: faqMatch.answer });

    const categoryBuilders: Record<Exclude<MessageCategory, "greeting" | "inquiry_collection" | "general">, (msg: string) => string> = {
      company_info: () => buildCompanyResponse(db, isBn),
      services: (m: string) => buildServicesResponse(db, m, isBn),
      pricing: (m: string) => buildPricingResponse(db, m, isBn),
      packages: (m: string) => buildPackagesResponse(db, m, isBn),
      skills: () => buildSkillsResponse(db, isBn),
      projects: () => buildProjectsResponse(db, isBn),
      faq: (m: string) => buildFaqResponse(db, m, isBn),
      policies: () => buildPoliciesResponse(db, isBn),
      contact: () => buildContactResponse(db, isBn),
    };

    if (category in categoryBuilders) {
      return successResponse({ response: categoryBuilders[category as keyof typeof categoryBuilders](msg) });
    }

    return successResponse({ response: buildGeneralResponse(db, msg, isBn) });
  } catch {
    return errorResponse("AI chat error");
  }
}