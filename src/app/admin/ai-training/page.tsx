"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Send, Bot, X, RefreshCw, Settings, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const tones = [
  { value: "professional", label: "Professional", desc: "Formal and business-oriented" },
  { value: "friendly", label: "Friendly", desc: "Warm and approachable" },
  { value: "technical", label: "Technical", desc: "Detailed and precise" },
  { value: "casual", label: "Casual", desc: "Relaxed and conversational" },
];

export default function AITrainingPage() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [systemPrompt, setSystemPrompt] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [tone, setTone] = useState("professional");
  const [maxResponseLength, setMaxResponseLength] = useState(500);
  const [restrictedTopics, setRestrictedTopics] = useState<string[]>([]);
  const [restrictedInput, setRestrictedInput] = useState("");
  const [greetingMessage, setGreetingMessage] = useState("");
  const [testMessage, setTestMessage] = useState("");
  const [testResponse, setTestResponse] = useState("");
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  async function loadConfig() {
    try {
      const res = await fetch("/api/admin/ai-config");
      const json = await res.json();
      const data = (json.success ? json.data || json : null);
      if (data) {
        setConfig(data);
        setSystemPrompt(data.systemPrompt || "");
        try { setKeywords(JSON.parse(data.keywords || "[]")); } catch { setKeywords([]); }
        setTone(data.tone || "professional");
        setMaxResponseLength(data.maxResponseLength || 500);
        try { setRestrictedTopics(JSON.parse(data.restrictedTopics || "[]")); } catch { setRestrictedTopics([]); }
        setGreetingMessage(data.greetingMessage || "");
      }
    } catch {
      toast.error("Failed to load AI config");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/ai-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt,
          keywords,
          tone,
          maxResponseLength,
          restrictedTopics,
          greetingMessage,
        }),
      });
      const json = await res.json();
      if (json.success || json.id) {
        toast.success("AI configuration saved");
        loadConfig();
      } else {
        toast.error("Failed to save");
      }
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    if (!testMessage.trim()) { toast.error("Enter a test message"); return; }
    setTestLoading(true);
    setTestResponse("");
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: testMessage, config: { systemPrompt, keywords, tone, maxResponseLength, restrictedTopics } }),
      });
      const json = await res.json();
      setTestResponse(json.response || json.message || json.data?.response || "No response");
    } catch {
      setTestResponse("Error: Failed to get response from AI");
    } finally {
      setTestLoading(false);
    }
  }

  function addKeyword() {
    const trimmed = keywordInput.trim();
    if (trimmed && !keywords.includes(trimmed)) {
      setKeywords([...keywords, trimmed]);
      setKeywordInput("");
    }
  }

  function removeKeyword(kw: string) {
    setKeywords(keywords.filter(k => k !== kw));
  }

  function addRestricted() {
    const trimmed = restrictedInput.trim();
    if (trimmed && !restrictedTopics.includes(trimmed)) {
      setRestrictedTopics([...restrictedTopics, trimmed]);
      setRestrictedInput("");
    }
  }

  function removeRestricted(topic: string) {
    setRestrictedTopics(restrictedTopics.filter(t => t !== topic));
  }

  if (loading) {
    return (
      <div className="p-6 animate-pulse space-y-6">
        <div className="h-8 w-48 bg-white/5 rounded-lg" />
        <div className="h-96 bg-white/5 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-heading">AI Training</h1>
          <p className="text-sm text-white/40 mt-1">Configure the AI chatbot behavior and knowledge</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-neon-orange to-neon-cyan text-black font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-all"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving..." : "Save Configuration"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Configuration */}
        <div className="space-y-6">
          {/* System Prompt */}
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-6">
            <h3 className="text-sm font-semibold text-white/70 mb-4">System Prompt</h3>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={6}
              placeholder="Enter the base instructions for the AI..."
              className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30 transition-colors resize-none"
            />
          </div>

          {/* Knowledge Keywords */}
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-6">
            <h3 className="text-sm font-semibold text-white/70 mb-4">Knowledge Keywords</h3>
            <p className="text-xs text-white/30 mb-3">These keywords provide context for the AI when answering user questions.</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {keywords.map((kw) => (
                <span key={kw} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 text-xs text-neon-cyan">
                  {kw}
                  <button onClick={() => removeKeyword(kw)} className="hover:text-white transition-colors"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addKeyword(); } }}
                placeholder="Type a keyword and press Enter..."
                className="flex-1 h-10 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30"
              />
              <button onClick={addKeyword} className="px-4 py-2 rounded-xl bg-white/5 border border-white/[0.06] text-sm text-white/50 hover:text-white/70">Add</button>
            </div>
          </div>

          {/* Tone Selector */}
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-6">
            <h3 className="text-sm font-semibold text-white/70 mb-4">AI Tone</h3>
            <div className="grid grid-cols-2 gap-3">
              {tones.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTone(t.value)}
                  className={cn(
                    "p-4 rounded-xl border text-left transition-all",
                    tone === t.value
                      ? "bg-neon-cyan/5 border-neon-cyan/30"
                      : "bg-white/[0.02] border-white/[0.06] hover:border-white/20"
                  )}
                >
                  <p className={cn("text-sm font-medium mb-0.5", tone === t.value ? "text-neon-cyan" : "text-white/70")}>{t.label}</p>
                  <p className="text-xs text-white/30">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Max Response Length */}
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-6">
            <h3 className="text-sm font-semibold text-white/70 mb-4">Max Response Length</h3>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="100"
                max="2000"
                step="100"
                value={maxResponseLength}
                onChange={(e) => setMaxResponseLength(parseInt(e.target.value))}
                className="flex-1 h-2 rounded-full appearance-none bg-white/[0.06] cursor-pointer accent-neon-cyan"
              />
              <span className="text-sm font-medium text-neon-cyan w-12 text-right">{maxResponseLength}</span>
            </div>
            <div className="flex justify-between text-[10px] text-white/20 mt-1">
              <span>100</span>
              <span>2000</span>
            </div>
          </div>

          {/* Restricted Topics */}
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-6">
            <h3 className="text-sm font-semibold text-white/70 mb-4">Restricted Topics</h3>
            <p className="text-xs text-white/30 mb-3">Topics the AI should refuse to discuss.</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {restrictedTopics.map((topic) => (
                <span key={topic} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                  {topic}
                  <button onClick={() => removeRestricted(topic)} className="hover:text-white transition-colors"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={restrictedInput}
                onChange={(e) => setRestrictedInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addRestricted(); } }}
                placeholder="Add restricted topic..."
                className="flex-1 h-10 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30"
              />
              <button onClick={addRestricted} className="px-4 py-2 rounded-xl bg-white/5 border border-white/[0.06] text-sm text-white/50 hover:text-white/70">Add</button>
            </div>
          </div>

          {/* Greeting Message */}
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-6">
            <h3 className="text-sm font-semibold text-white/70 mb-4">Custom Greeting Message</h3>
            <textarea
              value={greetingMessage}
              onChange={(e) => setGreetingMessage(e.target.value)}
              rows={3}
              placeholder="Message shown when chat opens..."
              className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30 transition-colors resize-none"
            />
          </div>

          {/* Test Chatbot */}
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.04] overflow-hidden">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-white/[0.04]">
              <Bot className="w-4 h-4 text-neon-cyan" />
              <h3 className="text-sm font-semibold text-white/70">Test Chatbot</h3>
            </div>
            <div className="p-6">
              <div className="flex gap-2 mb-4">
                <input
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleTest(); }}
                  placeholder="Type a test message..."
                  className="flex-1 h-10 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30"
                />
                <button
                  onClick={handleTest}
                  disabled={testLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-neon-orange to-neon-cyan text-black font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  {testLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send
                </button>
              </div>
              {testResponse && (
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="w-3.5 h-3.5 text-neon-cyan" />
                    <span className="text-xs font-medium text-neon-cyan">AI Response</span>
                  </div>
                  <p className="text-sm text-white/60 leading-relaxed whitespace-pre-wrap">{testResponse}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
