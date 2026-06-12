"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Save, Plus, X, RefreshCw, ToggleLeft, ToggleRight, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { cn } from "@/lib/utils";

interface CustomReply {
  keyword: string;
  response: string;
}

export default function AISettingsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [aiEnabled, setAiEnabled] = useState(true);
  const [personality, setPersonality] = useState("professional");
  const [greetingMessage, setGreetingMessage] = useState("");
  const [fallbackMessage, setFallbackMessage] = useState("");
  const [customReplies, setCustomReplies] = useState<CustomReply[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [newResponse, setNewResponse] = useState("");

  useEffect(() => {
    if (sessionStatus === "authenticated") loadSettings();
  }, [sessionStatus]);

  async function loadSettings() {
    try {
      const [configRes, settingsRes] = await Promise.all([
        fetch("/api/admin/ai-config"),
        fetch("/api/settings"),
      ]);
      const configJson = await configRes.json();
      const settingsJson = await settingsRes.json();

      if (configJson.success || configJson.data) {
        const cfg = configJson.data || configJson;
        setAiEnabled(cfg.aiEnabled !== false);
        setPersonality(cfg.personality || "professional");
        setGreetingMessage(cfg.greetingMessage || "");
        setFallbackMessage(cfg.fallbackMessage || "");
        try {
          const replies = JSON.parse(cfg.customReplies || "[]");
          setCustomReplies(Array.isArray(replies) ? replies : []);
        } catch {
          setCustomReplies([]);
        }
      }
    } catch {
      toast.error("Failed to load AI settings");
    } finally {
      setLoading(false);
    }
  }

  function addCustomReply() {
    if (!newKeyword.trim() || !newResponse.trim()) {
      toast.error("Both keyword and response are required");
      return;
    }
    setCustomReplies([...customReplies, { keyword: newKeyword.trim(), response: newResponse.trim() }]);
    setNewKeyword("");
    setNewResponse("");
  }

  function removeCustomReply(index: number) {
    setCustomReplies(customReplies.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/ai-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aiEnabled,
          personality,
          greetingMessage,
          fallbackMessage,
          customReplies: JSON.stringify(customReplies),
        }),
      });
      const json = await res.json();
      if (json.success || json.id) {
        toast.success("AI settings saved");
      } else {
        toast.error("Failed to save");
      }
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const personalities = [
    { value: "professional", label: "Professional", desc: "Formal and business-oriented" },
    { value: "friendly", label: "Friendly", desc: "Warm and approachable" },
    { value: "casual", label: "Casual", desc: "Relaxed and conversational" },
    { value: "technical", label: "Technical", desc: "Detailed and precise" },
  ];

  if (sessionStatus === "loading" || loading) {
    return (
      <div className="p-6 animate-pulse space-y-6">
        <div className="h-8 w-48 bg-white/5 rounded-lg" />
        <div className="h-96 bg-white/5 rounded-2xl" />
      </div>
    );
  }
  if (!session) return null;

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="AI Settings"
        description="Configure the chatbot behavior, personality, and auto-reply messages"
      />

      <div className="max-w-3xl space-y-6">
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white/80">AI Chatbot</h3>
              <p className="text-xs text-white/30 mt-0.5">Enable or disable the AI assistant on the website</p>
            </div>
            <button
              onClick={() => setAiEnabled(!aiEnabled)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all",
                aiEnabled
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-white/[0.04] text-white/30 border border-white/[0.06]"
              )}
            >
              {aiEnabled ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
              {aiEnabled ? "Enabled" : "Disabled"}
            </button>
          </div>
          <div className={cn("space-y-4", !aiEnabled && "opacity-40 pointer-events-none")}>
            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Personality</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {personalities.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setPersonality(p.value)}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all",
                      personality === p.value
                        ? "bg-neon-cyan/5 border-neon-cyan/30"
                        : "bg-white/[0.02] border-white/[0.06] hover:border-white/20"
                    )}
                  >
                    <p className={cn("text-xs font-medium mb-0.5", personality === p.value ? "text-neon-cyan" : "text-white/70")}>{p.label}</p>
                    <p className="text-[10px] text-white/30">{p.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Greeting Message</label>
              <Textarea
                value={greetingMessage}
                onChange={(e) => setGreetingMessage(e.target.value)}
                placeholder="Message shown when chat opens..."
                rows={3}
                className="bg-white/[0.02] border-white/[0.04] text-sm resize-none"
              />
            </div>

            <div>
              <label className="text-xs text-white/40 mb-1.5 block">Fallback Message</label>
              <Textarea
                value={fallbackMessage}
                onChange={(e) => setFallbackMessage(e.target.value)}
                placeholder="Message shown when no answer is found..."
                rows={3}
                className="bg-white/[0.02] border-white/[0.04] text-sm resize-none"
              />
              <p className="text-[10px] text-white/20 mt-1">
                Default: "Thank you for your message. Our team will contact you shortly."
              </p>
            </div>
          </div>
        </div>

        <div className={cn("glass-card rounded-2xl p-6", !aiEnabled && "opacity-40 pointer-events-none")}>
          <h3 className="text-sm font-semibold text-white/80 mb-1">Custom Replies</h3>
          <p className="text-xs text-white/30 mb-4">Add keyword-based auto-replies. When a visitor&apos;s message contains the keyword, this response will be sent.</p>

          <div className="space-y-3 mb-4">
            {customReplies.length === 0 ? (
              <p className="text-xs text-white/20">No custom replies yet.</p>
            ) : (
              customReplies.map((reply, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <div className="flex-1 min-w-0">
                    <Badge variant="cyan" className="text-[9px]">{reply.keyword}</Badge>
                    <p className="text-xs text-white/50 mt-1 line-clamp-2">{reply.response}</p>
                  </div>
                  <button
                    onClick={() => removeCustomReply(i)}
                    className="h-6 w-6 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 shrink-0"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="space-y-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <p className="text-xs text-white/40 font-medium">Add New Reply</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="Keyword (e.g. pricing)"
                className="bg-white/[0.02] border-white/[0.04] text-sm h-9"
              />
              <Input
                value={newResponse}
                onChange={(e) => setNewResponse(e.target.value)}
                placeholder="Auto-reply text"
                className="bg-white/[0.02] border-white/[0.04] text-sm h-9"
              />
            </div>
            <Button size="sm" className="h-8 text-xs gap-1.5" onClick={addCustomReply}>
              <Plus size={12} /> Add Reply
            </Button>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <MessageSquare size={16} className="text-neon-cyan" />
            <h3 className="text-sm font-semibold text-white/80">How it Works</h3>
          </div>
          <div className="space-y-2 text-xs text-white/30 leading-relaxed">
            <p><strong className="text-white/50">1. Custom Replies</strong> — Keyword-matched responses take priority. If a visitor types a keyword you&apos;ve defined, the matching response is sent.</p>
            <p><strong className="text-white/50">2. Database Lookup</strong> — If no custom reply matches, the chatbot searches Knowledge Base, FAQs, Services, Projects, and Skills.</p>
            <p><strong className="text-white/50">3. Fallback</strong> — If nothing matches, the fallback message is sent, and your team can reply manually from the Messages dashboard.</p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            size="sm"
            className="h-9 text-xs gap-1.5"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save size={13} />}
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}
