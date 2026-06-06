"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BrainCircuit, MessageSquare, Database, Settings,
  Package, BookOpen, Users, Key, ArrowRight,
  FileJson, CheckCircle, RefreshCw, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/admin/layout/Header";
import { StatCardGrid } from "@/components/admin/shared/StatCardGrid";
import { SectionHeader } from "@/components/admin/shared/SectionHeader";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

type StatCounts = {
  inquiries: number;
  knowledge: number;
  packages: number;
  apiKeys: number;
};

export default function AIControlCenter() {
  const { data: session, status: sessionStatus } = useSession();
  const { showToast } = useToast();
  const [counts, setCounts] = useState<StatCounts>({ inquiries: 0, knowledge: 0, packages: 0, apiKeys: 0 });
  const [loading, setLoading] = useState(true);

  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [showKeyForm, setShowKeyForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [generatingKey, setGeneratingKey] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    try {
      const [inqRes, kbRes, pkgRes, keysRes] = await Promise.all([
        fetch("/api/admin/inquiries"),
        fetch("/api/admin/knowledge"),
        fetch("/api/admin/packages"),
        fetch("/api/admin/api-keys"),
      ]);
      const [inqJson, kbJson, pkgJson, keysJson] = await Promise.all([
        inqRes.json(), kbRes.json(), pkgRes.json(), keysRes.json(),
      ]);
      setCounts({
        inquiries: inqJson.data?.length ?? 0,
        knowledge: kbJson.data?.length ?? 0,
        packages: pkgJson.data?.length ?? 0,
        apiKeys: keysJson.data?.length ?? 0,
      });
      if (keysJson.success) setApiKeys(keysJson.data);
    } catch {
      showToast("error", "Failed to load AI data");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateKey() {
    if (!newKeyName.trim()) {
      showToast("error", "Key name is required");
      return;
    }
    setGeneratingKey(true);
    try {
      const res = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", "API key generated");
        setShowKeyForm(false);
        setNewKeyName("");
        loadAllData();
      } else {
        showToast("error", json.error || "Failed to generate key");
      }
    } catch {
      showToast("error", "Failed to generate key");
    } finally {
      setGeneratingKey(false);
    }
  }

  async function handleDeleteKey(id: number) {
    try {
      const res = await fetch("/api/admin/api-keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", "API key deleted");
        loadAllData();
      }
    } catch {
      showToast("error", "Failed to delete API key");
    }
  }

  if (sessionStatus === "loading" || loading) {
    return (
      <div className="space-y-6 p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-neon-cyan" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm text-white/30">Loading AI Control Center...</span>
        </div>
      </div>
    );
  }
  if (!session) return null;

  const systemReady = counts.knowledge > 0 || counts.packages > 0;

  return (
    <div className="space-y-6 p-6">
      <Header title="AI Control Center" description="Manage your AI assistant, knowledge base, packages, inquiries, and API keys" />

      <StatCardGrid
        stats={[
          { title: "Knowledge Items", value: counts.knowledge, icon: BookOpen, variant: "cyan", description: "AI knowledge base entries" },
          { title: "Packages", value: counts.packages, icon: Package, variant: "orange", description: "Service packages & pricing" },
          { title: "Client Inquiries", value: counts.inquiries, icon: Users, variant: "purple", description: "Collected from AI chat" },
          { title: "API Keys", value: counts.apiKeys, icon: Key, variant: "emerald", description: "Registered API keys" },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/admin/ai/knowledge" className="glass-card rounded-2xl p-6 hover:bg-white/[0.03] transition-all group">
          <SectionHeader
            title="Knowledge Base"
            action={
              <div className="flex items-center gap-1 text-xs text-cyan group-hover:gap-2 transition-all">
                <span>Manage</span> <ArrowRight size={12} />
              </div>
            }
          />
          <p className="text-sm text-white/40 mt-2">
            Add, edit, and organize knowledge entries that the AI uses to answer visitor questions.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="cyan" className="text-[10px]">
              {counts.knowledge} {counts.knowledge === 1 ? "entry" : "entries"}
            </Badge>
            <Badge variant="default" className="text-[10px]">AI-powered</Badge>
          </div>
        </Link>

        <Link href="/admin/ai/packages" className="glass-card rounded-2xl p-6 hover:bg-white/[0.03] transition-all group">
          <SectionHeader
            title="Packages & Pricing"
            action={
              <div className="flex items-center gap-1 text-xs text-orange group-hover:gap-2 transition-all">
                <span>Manage</span> <ArrowRight size={12} />
              </div>
            }
          />
          <p className="text-sm text-white/40 mt-2">
            Define service packages with pricing tiers, features, and billing cycles for AI responses.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="orange" className="text-[10px]">
              {counts.packages} {counts.packages === 1 ? "package" : "packages"}
            </Badge>
            <Badge variant="default" className="text-[10px]">Pricing</Badge>
          </div>
        </Link>

        <Link href="/admin/ai/inquiries" className="glass-card rounded-2xl p-6 hover:bg-white/[0.03] transition-all group">
          <SectionHeader
            title="Client Inquiries"
            action={
              <div className="flex items-center gap-1 text-xs text-purple group-hover:gap-2 transition-all">
                <span>View All</span> <ArrowRight size={12} />
              </div>
            }
          />
          <p className="text-sm text-white/40 mt-2">
            Review and manage client inquiries collected automatically through AI chat conversations.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="cyan" className="text-[10px]">{counts.inquiries} total</Badge>
            <Badge variant="default" className="text-[10px]">Auto-collected</Badge>
          </div>
        </Link>

        <div className="glass-card rounded-2xl p-6">
          <SectionHeader
            title="API Keys"
            action={
              <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={() => setShowKeyForm(!showKeyForm)}>
                <Plus size={10} /> {showKeyForm ? "Cancel" : "New Key"}
              </Button>
            }
          />
          <p className="text-sm text-white/40 mt-2 mb-3">
            Manage API keys for external integrations with the AI system.
          </p>

          {showKeyForm && (
            <div className="flex items-center gap-2 mb-3">
              <Input
                placeholder="Key name"
                value={newKeyName}
                onChange={e => setNewKeyName(e.target.value)}
                className="bg-white/[0.02] border-white/[0.04] h-8 text-xs"
              />
              <Button size="sm" className="h-8 text-xs gap-1 shrink-0" onClick={handleGenerateKey} disabled={generatingKey}>
                {generatingKey ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Key size={11} />}
                Generate
              </Button>
            </div>
          )}

          <div className="space-y-1.5">
            {apiKeys.length === 0 ? (
              <p className="text-xs text-white/20">No API keys yet.</p>
            ) : (
              apiKeys.slice(0, 5).map((k: any) => (
                <div key={k.id} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                  <div className="flex items-center gap-2 min-w-0">
                    <Key size={10} className={k.status === "active" ? "text-emerald-400 shrink-0" : "text-red-400 shrink-0"} />
                    <span className="text-xs text-white/60 truncate">{k.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={k.status} size="sm" />
                    <button
                      onClick={() => handleDeleteKey(k.id)}
                      className="h-5 w-5 flex items-center justify-center rounded hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-all"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>
              ))
            )}
            {apiKeys.length > 5 && (
              <p className="text-[10px] text-white/20 text-center pt-1">+{apiKeys.length - 5} more keys</p>
            )}
          </div>
        </div>

        <Link href="/admin/ai/policies" className="glass-card rounded-2xl p-6 hover:bg-white/[0.03] transition-all group">
          <SectionHeader
            title="Policies Manager"
            action={
              <div className="flex items-center gap-1 text-xs text-white/50 group-hover:gap-2 transition-all">
                <span>Manage</span> <ArrowRight size={12} />
              </div>
            }
          />
          <p className="text-sm text-white/40 mt-2">
            Define company policies, rules, and commitments that the AI uses to answer policy-related questions.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="default" className="text-[10px]">Company Policy</Badge>
            <Badge variant="default" className="text-[10px]">Rules</Badge>
            <Badge variant="default" className="text-[10px]">Commitments</Badge>
          </div>
        </Link>

        <Link href="/admin/ai-training" className="glass-card rounded-2xl p-6 hover:bg-white/[0.03] transition-all group">
          <SectionHeader
            title="AI Settings"
            action={
              <div className="flex items-center gap-1 text-xs text-cyan group-hover:gap-2 transition-all">
                <span>Configure</span> <ArrowRight size={12} />
              </div>
            }
          />
          <p className="text-sm text-white/40 mt-2">
            Configure the AI system prompt, tone, response length, restricted topics, and test the chatbot.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="cyan" className="text-[10px]">System Prompt</Badge>
            <Badge variant="default" className="text-[10px]">Training</Badge>
          </div>
        </Link>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <SectionHeader title="AI System Status" />
        <div className="flex items-center gap-3 mt-4">
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs",
            systemReady ? "bg-emerald-500/10 text-emerald-400" : "bg-yellow-500/10 text-yellow-400"
          )}>
            <CheckCircle size={12} />
            {systemReady ? "System Ready" : "Not Configured"}
          </div>
          <Badge variant="default" className="text-[10px]">
            <MessageSquare size={10} className="mr-1" />
            Chat active on all pages
          </Badge>
          <Badge variant="default" className="text-[10px]">
            <Database size={10} className="mr-1" />
            PostgreSQL
          </Badge>
        </div>
        <p className="text-xs text-white/30 mt-3 leading-relaxed">
          {systemReady
            ? "The AI assistant is configured and ready. It uses your Knowledge Base and Packages data to answer visitor questions and collects client inquiries automatically."
            : "Add entries to the Knowledge Base and define Packages to enable the AI to provide accurate responses to visitors. The chat is live but responses will use general knowledge until configured."}
        </p>
      </div>

      <div className="h-8" />
    </div>
  );
}
