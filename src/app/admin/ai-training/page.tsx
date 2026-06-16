"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Loader2, Bot, MessageSquare, BookOpen, Package as PackageIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";

export default function AITrainingPage() {
  const [enabled, setEnabled] = useState(false);
  const [greeting, setGreeting] = useState("");
  const [fallback, setFallback] = useState("");
  const [personality, setPersonality] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ knowledgeCount: 0, packageCount: 0, inquiryCount: 0 });

  async function loadData() {
    try {
      const [configRes, knowledgeRes, packagesRes, inquiriesRes] = await Promise.all([
        fetch("/api/admin/ai-config"),
        fetch("/api/admin/knowledge"),
        fetch("/api/admin/packages"),
        fetch("/api/admin/inquiries"),
      ]);
      const config = await configRes.json();
      if (config.success) {
        setEnabled(config.data.auto_reply_enabled === "true");
        setGreeting(config.data.auto_reply_ai_greeting || "");
        setFallback(config.data.auto_reply_ai_fallback || "");
        setPersonality(config.data.auto_reply_ai_personality || "");
      }
      const k = await knowledgeRes.json();
      const p = await packagesRes.json();
      const i = await inquiriesRes.json();
      setStats({
        knowledgeCount: k.success ? (k.data as any[]).length : 0,
        packageCount: p.success ? (p.data as any[]).length : 0,
        inquiryCount: i.success ? (i.data as any[]).length : 0,
      });
    } catch {} finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/ai-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auto_reply_enabled: enabled ? "true" : "false",
          auto_reply_ai_greeting: greeting,
          auto_reply_ai_fallback: fallback,
          auto_reply_ai_personality: personality,
        }),
      });
      const json = await res.json();
      if (json.success) {
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

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-white/5 rounded-lg animate-pulse" />
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-white/5 rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl">
      <PageHeader title="AI Settings" description="Configure AI model behavior and training data" />

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Knowledge Entries", value: stats.knowledgeCount, icon: BookOpen, color: "text-orange-400" },
          { label: "Service Packages", value: stats.packageCount, icon: PackageIcon, color: "text-emerald-400" },
          { label: "Past Inquiries", value: stats.inquiryCount, icon: MessageSquare, color: "text-purple-400" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4 text-center"
          >
            <stat.icon className={cn("w-5 h-5 mx-auto mb-2", stat.color)} />
            <p className="text-lg font-bold text-white">{stat.value}</p>
            <p className="text-[10px] text-white/40">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="space-y-4">
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
                <h3 className="text-sm font-semibold text-white">Auto-Reply Bot</h3>
                <p className="text-xs text-white/40">Enable or disable the AI auto-reply system</p>
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

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
        >
          <h3 className="text-sm font-semibold text-white mb-1">Greeting Message</h3>
          <p className="text-xs text-white/40 mb-3">Sent when a visitor starts a conversation</p>
          <Textarea
            value={greeting}
            onChange={(e) => setGreeting(e.target.value)}
            placeholder="Hi there! Thanks for reaching out. How can I help you today?"
            className="bg-white/5 border-white/10 text-white placeholder-white/30 min-h-[80px]"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
        >
          <h3 className="text-sm font-semibold text-white mb-1">Fallback Message</h3>
          <p className="text-xs text-white/40 mb-3">Used when the AI cannot find a matching answer</p>
          <Textarea
            value={fallback}
            onChange={(e) => setFallback(e.target.value)}
            placeholder="Thank you for your message! Our team will get back to you shortly."
            className="bg-white/5 border-white/10 text-white placeholder-white/30 min-h-[80px]"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
        >
          <h3 className="text-sm font-semibold text-white mb-1">Bot Personality</h3>
          <p className="text-xs text-white/40 mb-3">Describe how the chatbot should behave</p>
          <Textarea
            value={personality}
            onChange={(e) => setPersonality(e.target.value)}
            placeholder="You are a helpful assistant for an AI SaaS agency..."
            className="bg-white/5 border-white/10 text-white placeholder-white/30 min-h-[100px] font-mono text-xs"
          />
        </motion.div>

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="h-10 bg-gradient-to-r from-neon-orange to-neon-cyan text-black text-sm font-semibold"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />}
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}
