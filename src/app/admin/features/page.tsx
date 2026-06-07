"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ToggleLeft, RefreshCw, User, History } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function FeaturesPage() {
  const [flags, setFlags] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => { loadFlags(); }, []);

  async function loadFlags() {
    try {
      const res = await fetch("/api/admin/features");
      const json = await res.json();
      if (json.success) {
        const data = json.data || json;
        setFlags(data.flags || []);
        setAuditLogs(data.auditLogs || []);
      }
    } catch {
      toast.error("Failed to load features");
    } finally {
      setLoading(false);
    }
  }

  async function toggleFlag(flag: any) {
    try {
      const res = await fetch("/api/admin/features", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: flag.key, enabled: !flag.enabled }),
      });
      const json = await res.json();
      if (json.success || json.id) {
        toast.success(`${flag.label}: ${!flag.enabled ? "Enabled" : "Disabled"}`);
        loadFlags();
      }
    } catch {
      toast.error("Failed to toggle feature");
    }
  }

  async function seedFlags() {
    setSeeding(true);
    try {
      const res = await fetch("/api/admin/features/seed", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        toast.success("Feature flags seeded");
        loadFlags();
      }
    } catch {
      toast.error("Failed to seed flags");
    } finally {
      setSeeding(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 animate-pulse space-y-6">
        <div className="h-8 w-48 bg-white/5 rounded-lg" />
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-20 bg-white/5 rounded-2xl" />)}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-heading">Feature Flags</h1>
          <p className="text-sm text-white/40 mt-1">Toggle site features on and off</p>
        </div>
        <button
          onClick={seedFlags}
          disabled={seeding || flags.length > 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/[0.06] text-sm text-white/60 hover:text-white/80 transition-all disabled:opacity-30"
        >
          {seeding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Seed Defaults
        </button>
      </div>

      {flags.length === 0 ? (
        <div className="rounded-2xl bg-white/[0.02] border border-dashed border-white/[0.06] p-12 text-center">
          <ToggleLeft className="w-8 h-8 text-white/20 mx-auto mb-3" />
          <p className="text-sm text-white/30 mb-4">No feature flags yet. Seed the defaults to get started.</p>
          <button onClick={seedFlags} disabled={seeding} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-neon-orange to-neon-cyan text-black font-semibold text-sm hover:opacity-90 transition-all">
            {seeding ? "Seeding..." : "Seed Default Features"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {flags.map((flag, i) => (
            <motion.div
              key={flag.id || flag.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-5 flex items-center justify-between group hover:bg-white/[0.03] transition-all"
            >
              <div className="flex-1 min-w-0 mr-4">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-white/80">{flag.label}</h3>
                  <span className="text-[10px] font-mono text-white/20 bg-white/[0.03] px-1.5 py-0.5 rounded">{flag.key}</span>
                </div>
                {flag.description && <p className="text-xs text-white/40">{flag.description}</p>}
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[10px] text-white/20">
                    Updated: {flag.updatedAt ? new Date(flag.updatedAt).toLocaleDateString() : "N/A"}
                  </span>
                  {flag.updatedBy && (
                    <span className="text-[10px] text-white/20 flex items-center gap-1">
                      <User className="w-2.5 h-2.5" /> by #{flag.updatedBy}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => toggleFlag(flag)}
                className={cn(
                  "relative w-14 h-7 rounded-full transition-colors shrink-0",
                  flag.enabled ? "bg-neon-cyan" : "bg-white/[0.08]"
                )}
              >
                <span className={cn(
                  "absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white transition-transform shadow-md",
                  flag.enabled && "translate-x-7"
                )} />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Audit Log */}
      {auditLogs.length > 0 && (
        <div className="mt-8 rounded-2xl bg-white/[0.02] border border-white/[0.04] p-6">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-4 h-4 text-white/40" />
            <h3 className="text-sm font-semibold text-white/70">Audit Log</h3>
          </div>
          <div className="space-y-2">
            {auditLogs.map((log: any) => (
              <div key={log.id} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/[0.02] text-xs">
                <span className="text-white/20 shrink-0">{new Date(log.createdAt).toLocaleString()}</span>
                <span className="text-white/50">{log.details || log.action}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
