"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Zap, Database, Globe, Mail, Trash2, Brain,
  FileText, Clock, Play, Pause, Activity,
  RefreshCw, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { SectionHeader } from "@/components/admin/shared/SectionHeader";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

interface WorkflowConfig {
  id: string;
  name: string;
  description?: string;
  icon?: any;
  schedule?: string;
  interval?: string;
  enabled: boolean;
  status?: string;
  lastRunAt?: string;
  [key: string]: any;
}

export default function AdminAutomation() {
  const { data: session, status: sessionStatus } = useSession();
  const { showToast } = useToast();

  const [workflows, setWorkflows] = useState<WorkflowConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  function getIconForWorkflow(name: string) {
    const lower = name.toLowerCase();
    if (lower.includes("backup")) return Database;
    if (lower.includes("sync")) return Globe;
    if (lower.includes("email") || lower.includes("notification")) return Mail;
    if (lower.includes("cleanup") || lower.includes("clean")) return Trash2;
    if (lower.includes("ai") || lower.includes("train")) return Brain;
    if (lower.includes("report")) return FileText;
    return Zap;
  }

  async function loadWorkflows() {
    try {
      const res = await fetch("/api/admin/automation");
      const json = await res.json();
      if (json.success) {
        setWorkflows(json.data.map((w: any) => ({
          ...w,
          id: String(w.id),
          desc: w.description || w.desc || "",
          enabled: w.status === "active",
          icon: getIconForWorkflow(w.name),
          category: w.category || "general",
          updatedAt: w.updatedAt || w.createdAt || new Date().toISOString(),
        })));
      }
    } catch {
      showToast("error", "Failed to load workflows");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWorkflows();
  }, []);

  async function toggleEnabled(id: string) {
    setSaving(id);
    const wf = workflows.find(w => w.id === id);
    if (!wf) return;
    const newStatus = wf.enabled ? "inactive" : "active";
    try {
      const res = await fetch("/api/admin/automation", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setWorkflows(prev => prev.map(w => w.id === id ? { ...w, enabled: !w.enabled, status: newStatus } : w));
        showToast("success", `${wf.name} ${wf.enabled ? "paused" : "resumed"}`);
      } else {
        showToast("error", "Failed to update workflow");
      }
    } catch {
      showToast("error", "Failed to update workflow");
    } finally {
      setSaving(null);
    }
  }

  const updateField = async (id: string, field: string, value: any) => {
    setWorkflows(prev => prev.map(w => w.id === id ? { ...w, [field]: value } : w));
    setSaving(id);
    try {
      const res = await fetch("/api/admin/automation", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, [field]: value }),
      });
      const json = await res.json();
      if (!json.success) {
        showToast("error", `Failed to update ${field}`);
        loadWorkflows();
      }
    } catch {
      showToast("error", `Failed to update ${field}`);
      loadWorkflows();
    } finally {
      setSaving(null);
    }
  };

  const handleRunNow = async (id: string) => {
    const wf = workflows.find(w => w.id === id);
    if (!wf) return;
    setSaving(id);
    try {
      const res = await fetch("/api/admin/automation", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status: "active",
          lastRunAt: new Date().toISOString(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", `${wf.name} triggered successfully`);
        loadWorkflows();
      } else {
        showToast("error", "Failed to trigger workflow");
      }
    } catch {
      showToast("error", "Failed to trigger workflow");
    } finally {
      setSaving(null);
    }
  };

  if (sessionStatus === "loading" || loading) return <LoadingSkeleton />;
  if (!session) return null;

  const enabledCount = workflows.filter(w => w.enabled).length;
  const systemHealth = enabledCount >= 4 ? "success" : enabledCount >= 2 ? "warning" : "error";

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Automation" description={`${enabledCount} of ${workflows.length} workflows active`}>
        <div className="flex items-center gap-2">
          <StatusBadge status={systemHealth} size="sm" />
          <Badge variant="outline" className="gap-1.5 text-[10px]">
            <Activity size={10} />
            System Health
          </Badge>
        </div>
      </PageHeader>

      <SectionHeader title="Workflow Status" description="Manage automated processes" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {workflows.map((wf, i) => {
          const Icon = wf.icon;
          return (
            <motion.div
              key={wf.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "rounded-2xl border p-5 transition-all duration-300",
                wf.enabled
                  ? "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.10]"
                  : "border-white/[0.02] bg-white/[0.01] opacity-60"
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br border border-white/[0.04]",
                    wf.enabled ? "from-neon-cyan/20 to-blue-500/20" : "from-white/[0.02] to-white/[0.02]"
                  )}>
                    <Icon size={18} className={wf.enabled ? "text-neon-cyan" : "text-white/30"} />
                  </div>
                  <div>
                    <p className="text-sm text-white/80 font-medium">{wf.name}</p>
                    <p className="text-[11px] text-white/25">{wf.desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleEnabled(wf.id)}
                  disabled={saving === wf.id}
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-lg transition-all",
                    wf.enabled
                      ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                      : "bg-white/[0.04] text-white/30 hover:bg-white/[0.08]",
                    saving === wf.id && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {saving === wf.id ? <RefreshCw size={12} className="animate-spin" /> : wf.enabled ? <Pause size={12} /> : <Play size={12} />}
                </button>
              </div>

              <div className="space-y-3">
                {wf.lastBackup && (
                  <div className="flex items-center gap-2 text-[11px] text-white/25">
                    <Clock size={10} />
                    <span>Last: {wf.lastBackup}</span>
                  </div>
                )}
                {wf.lastTrained && (
                  <div className="flex items-center gap-2 text-[11px] text-white/25">
                    <Brain size={10} />
                    <span>Last trained: {wf.lastTrained}</span>
                  </div>
                )}
                {wf.status === "synced" && (
                  <div className="flex items-center gap-2 text-[11px] text-emerald-400">
                    <CheckCircle2 size={10} />
                    <span>Synced</span>
                  </div>
                )}

                {wf.schedule && wf.options && (
                  <div className="flex items-center gap-2">
                    <select
                      value={wf.schedule}
                      onChange={(e) => updateField(wf.id, "schedule", e.target.value)}
                      className="h-7 rounded-lg bg-white/[0.04] border border-white/[0.04] px-2 text-[11px] text-white/60 outline-none focus:border-neon-cyan/20 flex-1"
                    >
                      {wf.options.map((opt: string) => (
                        <option key={opt} value={opt.toLowerCase()} className="bg-[#0a0a0a]">{opt}</option>
                      ))}
                    </select>
                  </div>
                )}

                {wf.templates && (
                  <div className="flex items-center gap-2">
                    <select
                      value={wf.template}
                      onChange={(e) => updateField(wf.id, "template", e.target.value)}
                      className="h-7 rounded-lg bg-white/[0.04] border border-white/[0.04] px-2 text-[11px] text-white/60 outline-none focus:border-neon-cyan/20 flex-1"
                    >
                      {wf.templates.map((t: string) => (
                        <option key={t} value={t.toLowerCase()} className="bg-[#0a0a0a]">{t}</option>
                      ))}
                    </select>
                  </div>
                )}

                {wf.schedules && wf.formats && (
                  <div className="flex items-center gap-2">
                    <select
                      value={wf.schedule}
                      onChange={(e) => updateField(wf.id, "schedule", e.target.value)}
                      className="h-7 rounded-lg bg-white/[0.04] border border-white/[0.04] px-2 text-[11px] text-white/60 outline-none focus:border-neon-cyan/20 flex-1"
                    >
                      {wf.schedules.map((s: string) => (
                        <option key={s} value={s.toLowerCase()} className="bg-[#0a0a0a]">{s}</option>
                      ))}
                    </select>
                    <select
                      value={wf.format}
                      onChange={(e) => updateField(wf.id, "format", e.target.value)}
                      className="h-7 rounded-lg bg-white/[0.04] border border-white/[0.04] px-2 text-[11px] text-white/60 outline-none focus:border-neon-cyan/20"
                    >
                      {wf.formats.map((f: string) => (
                        <option key={f} value={f} className="bg-[#0a0a0a]">{f}</option>
                      ))}
                    </select>
                  </div>
                )}

                {wf.interval && (
                  <div className="flex items-center gap-2">
                    <select
                      value={wf.interval}
                      onChange={(e) => updateField(wf.id, "interval", e.target.value)}
                      className="h-7 rounded-lg bg-white/[0.04] border border-white/[0.04] px-2 text-[11px] text-white/60 outline-none focus:border-neon-cyan/20 flex-1"
                    >
                      {wf.options?.map((opt: string) => (
                        <option key={opt} value={opt} className="bg-[#0a0a0a]">{opt}</option>
                      ))}
                    </select>
                  </div>
                )}

                {wf.retention && (
                  <div className="flex items-center gap-2">
                    <select
                      value={wf.retention}
                      onChange={(e) => updateField(wf.id, "retention", e.target.value)}
                      className="h-7 rounded-lg bg-white/[0.04] border border-white/[0.04] px-2 text-[11px] text-white/60 outline-none focus:border-neon-cyan/20 flex-1"
                    >
                      {wf.options?.map((opt: string) => (
                        <option key={opt} value={opt} className="bg-[#0a0a0a]">{opt}</option>
                      ))}
                    </select>
                  </div>
                )}

                {wf.autoResponder !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-white/25">Auto-responder</span>
                    <button
                      type="button"
                      onClick={() => updateField(wf.id, "autoResponder", !wf.autoResponder)}
                      className={cn(
                        "relative inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200",
                        wf.autoResponder ? "bg-neon-cyan" : "bg-white/[0.08]"
                      )}
                    >
                      <span className={cn(
                        "inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform duration-200 shadow-sm",
                        wf.autoResponder ? "translate-x-[14px]" : "translate-x-[2px]"
                      )} />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.04]">
                <StatusBadge status={wf.enabled ? "active" : "inactive"} size="sm" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[10px] gap-1"
                  onClick={() => handleRunNow(wf.id)}
                  disabled={!wf.enabled}
                >
                  <RefreshCw size={10} /> Run Now
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-32 rounded-2xl bg-white/[0.02] animate-pulse shimmer-overlay" />
      ))}
    </div>
  );
}
