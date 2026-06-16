import { prisma } from "@/lib/prisma";

interface AiSettings {
  enabled: boolean;
  greeting: string;
  fallback: string;
  personality: string;
  knowledge: string;
}

const defaultSettings: AiSettings = {
  enabled: false,
  greeting: "Hi there! Thanks for reaching out. How can I help you today?",
  fallback: "Thank you for your message! Our team will get back to you shortly.",
  personality: "You are a helpful assistant for AORNX, an AI SaaS agency.",
  knowledge: "[]",
};

async function loadAiSettings(): Promise<AiSettings> {
  try {
    const keys = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            "auto_reply_enabled",
            "auto_reply_ai_greeting",
            "auto_reply_ai_fallback",
            "auto_reply_ai_personality",
            "auto_reply_ai_knowledge",
            "auto_reply_message",
          ],
        },
      },
    });
    const map = Object.fromEntries(keys.map((s) => [s.key, s.value]));
    return {
      enabled: map.auto_reply_enabled === "true",
      greeting: map.auto_reply_ai_greeting || defaultSettings.greeting,
      fallback: map.auto_reply_ai_fallback || map.auto_reply_message || defaultSettings.fallback,
      personality: map.auto_reply_ai_personality || defaultSettings.personality,
      knowledge: map.auto_reply_ai_knowledge || defaultSettings.knowledge,
    };
  } catch {
    return defaultSettings;
  }
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function computeKeywords(text: string): string[] {
  const stopWords = new Set([
    "the", "and", "for", "are", "but", "not", "you", "all", "can", "had",
    "her", "was", "one", "our", "out", "has", "have", "been", "some",
    "them", "than", "what", "when", "your", "which", "will", "with",
    "about", "from", "they", "this", "that", "please", "help",
  ]);
  return tokenize(text).filter((w) => !stopWords.has(w));
}

interface KnowledgeEntry {
  keywords: string;
  response: string;
}

function findBestMatch(
  message: string,
  knowledgeJson: string
): string | null {
  try {
    const knowledge: KnowledgeEntry[] = JSON.parse(knowledgeJson);
    if (!Array.isArray(knowledge) || knowledge.length === 0) return null;

    const msgKeywords = computeKeywords(message);
    if (msgKeywords.length === 0) return null;

    let bestScore = 0;
    let bestEntry: KnowledgeEntry | null = null;

    for (const entry of knowledge) {
      const entryKeywords = computeKeywords(entry.keywords);
      let score = 0;
      for (const mk of msgKeywords) {
        for (const ek of entryKeywords) {
          if (mk === ek) {
            score += 3;
          } else if (mk.includes(ek) || ek.includes(mk)) {
            score += 1;
          }
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestEntry = entry;
      }
    }

    return bestEntry?.response || null;
  } catch {
    return null;
  }
}

function generateContextualResponse(
  message: string,
  settings: AiSettings
): string {
  const match = findBestMatch(message, settings.knowledge);
  if (match) return match;
  return settings.fallback;
}

export async function generateAutoReply(
  visitorMessage: string,
  conversationId: string
): Promise<string | null> {
  try {
    const settings = await loadAiSettings();
    if (!settings.enabled) return null;

    const lastAdminMsg = await prisma.message.findFirst({
      where: { conversationId, sender: "admin" },
      orderBy: { createdAt: "desc" },
    });

    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const adminOffline = !lastAdminMsg || lastAdminMsg.createdAt < fiveMinAgo;
    if (!adminOffline) return null;

    const msgCount = await prisma.message.count({
      where: { conversationId },
    });

    if (msgCount <= 1) {
      return settings.greeting;
    }

    return generateContextualResponse(visitorMessage, settings);
  } catch {
    return null;
  }
}
