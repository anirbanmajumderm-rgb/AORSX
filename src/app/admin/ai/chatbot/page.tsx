"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Bot, Save, Plus, Trash2, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { PageHeader } from "@/components/admin/shared/PageHeader";

interface KnowledgeEntry {
  keywords: string;
  response: string;
}

export default function AdminChatbotPage() {
  const { status: sessionStatus } = useSession();

  const [enabled, setEnabled] = useState(false);
  const [greeting, setGreeting] = useState("");
  const [fallback, setFallback] = useState("");
  const [personality, setPersonality] = useState("");
  const [knowledge, setKnowledge] = useState<KnowledgeEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showKnowledge, setShowKnowledge] = useState(false);

  async function loadSettings() {
    try {
      const res = await fetch("/api/settings");
      const json = await res.json();
      if (json.success) {
        const d = json.data;
        setEnabled(d.auto_reply_enabled === "true");
        setGreeting(d.auto_reply_ai_greeting || "");
        setFallback(d.auto_reply_ai_fallback || "");
        setPersonality(d.auto_reply_ai_personality || "");
        try {
          const parsed = JSON.parse(d.auto_reply_ai_knowledge || "[]");
          if (Array.isArray(parsed)) setKnowledge(parsed);
        } catch {
          setKnowledge([]);
        }
      }
    } catch {} finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (sessionStatus === "authenticated") loadSettings();
  }, [sessionStatus]);

  function addKnowledgeEntry() {
    setKnowledge((prev) => [...prev, { keywords: "", response: "" }]);
  }

  function updateKnowledgeEntry(i: number, field: keyof KnowledgeEntry, value: string) {
    setKnowledge((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  }

  function removeKnowledgeEntry(i: number) {
    setKnowledge((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const validKnowledge = knowledge.filter((k) => k.keywords.trim() && k.response.trim());
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auto_reply_enabled: enabled ? "true" : "false",
          auto_reply_ai_greeting: greeting,
          auto_reply_ai_fallback: fallback,
          auto_reply_ai_personality: personality,
          auto_reply_ai_knowledge: JSON.stringify(validKnowledge),
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Chatbot settings saved");
        setKnowledge(validKnowledge);
      } else {
        toast.error("Failed to save settings");
      }
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  if (sessionStatus === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neon-cyan border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl">
      <PageHeader
        title="AI Chatbot"
        description="Configure the auto-reply chatbot behavior"
      >
        <div className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-all",
          enabled
            ? "bg-green-500/10 text-green-400 border-green-500/20"
            : "bg-white/5 text-white/30 border-white/10"
        )}>
          <span className={cn("h-1.5 w-1.5 rounded-full", enabled ? "bg-green-400" : "bg-white/20")} />
          {enabled ? "Active" : "Disabled"}
        </div>
      </PageHeader>

      <div className="space-y-6">
        {/* Enable Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-orange/20">
                <Bot className="h-5 w-5 text-neon-cyan" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Auto-Reply Chatbot</h3>
                <p className="text-xs text-white/40">
                  Automatically reply to visitors when you&apos;re offline
                </p>
              </div>
            </div>
            <button
              onClick={() => setEnabled(!enabled)}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                enabled ? "bg-neon-cyan" : "bg-white/10"
              )}
            >
              <span className={cn(
                "inline-block h-4 w-4 rounded-full bg-white transition-transform",
                enabled ? "translate-x-6" : "translate-x-1"
              )} />
            </button>
          </div>
        </motion.div>

        {/* Greeting Message */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
        >
          <h3 className="text-sm font-semibold text-white mb-1">Greeting Message</h3>
          <p className="text-xs text-white/40 mb-3">
            Sent automatically when a visitor sends their first message
          </p>
          <Textarea
            value={greeting}
            onChange={(e) => setGreeting(e.target.value)}
            placeholder="Hi there! Thanks for reaching out. How can I help you today?"
            className="bg-white/5 border-white/10 text-white placeholder-white/30 min-h-[80px]"
          />
        </motion.div>

        {/* Fallback Message */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
        >
          <h3 className="text-sm font-semibold text-white mb-1">Fallback Message</h3>
          <p className="text-xs text-white/40 mb-3">
            Used when the chatbot doesn&apos;t have a matching answer
          </p>
          <Textarea
            value={fallback}
            onChange={(e) => setFallback(e.target.value)}
            placeholder="Thank you for your message! Our team will get back to you shortly."
            className="bg-white/5 border-white/10 text-white placeholder-white/30 min-h-[80px]"
          />
        </motion.div>

        {/* Personality */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
        >
          <h3 className="text-sm font-semibold text-white mb-1">Bot Personality</h3>
          <p className="text-xs text-white/40 mb-3">
            Describe how the chatbot should behave and what it knows about your business
          </p>
          <Textarea
            value={personality}
            onChange={(e) => setPersonality(e.target.value)}
            placeholder="You are a helpful assistant for AORNX, an AI SaaS agency specializing in custom software development, AI solutions, and digital transformation."
            className="bg-white/5 border-white/10 text-white placeholder-white/30 min-h-[100px] font-mono text-xs"
          />
        </motion.div>

        {/* Knowledge Base */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
        >
          <button
            onClick={() => setShowKnowledge(!showKnowledge)}
            className="flex items-center justify-between w-full"
          >
            <div className="text-left">
              <h3 className="text-sm font-semibold text-white">Knowledge Base</h3>
              <p className="text-xs text-white/40">
                Add keyword-response pairs so the chatbot can answer common questions
              </p>
            </div>
            {showKnowledge ? <ChevronUp className="h-4 w-4 text-white/30" /> : <ChevronDown className="h-4 w-4 text-white/30" />}
          </button>

          {showKnowledge && (
            <div className="mt-4 space-y-3">
              {knowledge.map((entry, i) => (
                <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="flex-1 space-y-2">
                    <Input
                      value={entry.keywords}
                      onChange={(e) => updateKnowledgeEntry(i, "keywords", e.target.value)}
                      placeholder="Keywords (e.g. pricing, cost, how much)"
                      className="bg-white/5 border-white/10 text-white placeholder-white/30 text-xs"
                    />
                    <Textarea
                      value={entry.response}
                      onChange={(e) => updateKnowledgeEntry(i, "response", e.target.value)}
                      placeholder="Bot response to this query"
                      className="bg-white/5 border-white/10 text-white placeholder-white/30 text-xs min-h-[60px]"
                    />
                  </div>
                  <button
                    onClick={() => removeKnowledgeEntry(i)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all mt-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              <button
                onClick={addKnowledgeEntry}
                className="flex items-center gap-2 text-xs text-neon-cyan hover:text-white transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Add knowledge entry
              </button>
            </div>
          )}
        </motion.div>

        {/* Save */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="h-10 bg-gradient-to-r from-neon-orange to-neon-cyan text-black text-sm font-semibold hover:shadow-[0_0_20px_rgba(255,107,0,0.3)]"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            ) : (
              <Save className="h-4 w-4 mr-1.5" />
            )}
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}
