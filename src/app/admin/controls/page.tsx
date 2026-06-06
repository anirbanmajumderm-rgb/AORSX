"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  SlidersHorizontal, Wifi, WifiOff, Globe, Lock, Unlock,
  Timer, Cloud, CloudOff, Server, Cpu, Eye, EyeOff,
  Monitor, UserCheck, Activity, Save, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { SectionHeader } from "@/components/admin/shared/SectionHeader";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

const controlSections = [
  {
    key: "site_status",
    title: "Site Status",
    icon: Activity,
    controls: [
      { id: "maintenance_mode", label: "Maintenance Mode", desc: "Show maintenance page to visitors", type: "toggle", default: false },
      { id: "site_mode", label: "Site Mode", desc: "Current site operational status", type: "select", options: ["Live", "Beta", "Under Construction"], default: "Live" },
    ],
  },
  {
    key: "performance",
    title: "Performance Controls",
    icon: Cpu,
    controls: [
      { id: "cache_duration", label: "Cache Duration (seconds)", desc: "Page cache TTL", type: "range", min: 0, max: 86400, step: 300, default: 3600 },
      { id: "cdn_enabled", label: "CDN Enabled", desc: "Serve assets via CDN", type: "toggle", default: true },
      { id: "image_optimization", label: "Image Optimization", desc: "Auto-optimize uploaded images", type: "toggle", default: true },
    ],
  },
  {
    key: "access",
    title: "Access Controls",
    icon: Lock,
    controls: [
      { id: "registration_enabled", label: "Allow Registration", desc: "Enable new user sign-ups", type: "toggle", default: false },
      { id: "public_api", label: "Public API Access", desc: "Allow unauthenticated API requests", type: "toggle", default: false },
      { id: "demo_mode", label: "Demo Mode", desc: "Restrict editing capabilities", type: "toggle", default: false },
    ],
  },
  {
    key: "display",
    title: "Display Controls",
    icon: Eye,
    controls: [
      { id: "show_hero", label: "Show Hero Section", desc: "Display hero section on homepage", type: "toggle", default: true },
      { id: "show_about", label: "Show About Section", desc: "Display about section", type: "toggle", default: true },
      { id: "show_services", label: "Show Services Section", desc: "Display services section", type: "toggle", default: true },
      { id: "show_projects", label: "Show Projects Section", desc: "Display projects portfolio", type: "toggle", default: true },
      { id: "show_reviews", label: "Show Reviews Section", desc: "Display testimonials", type: "toggle", default: true },
      { id: "show_faq", label: "Show FAQ Section", desc: "Display FAQ accordion", type: "toggle", default: true },
      { id: "show_contact", label: "Show Contact Section", desc: "Display contact form", type: "toggle", default: true },
    ],
  },
];

export default function AdminControls() {
  const { data: session, status } = useSession();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const getInitialState = () => {
    const state: Record<string, any> = {};
    controlSections.forEach(sec => {
      sec.controls.forEach(c => { state[c.id] = c.default; });
    });
    return state;
  };

  const [controlStates, setControlStates] = useState<Record<string, any>>(getInitialState);

  useEffect(() => {
    if (status !== "authenticated") return;
    async function load() {
      try {
        const res = await fetch("/api/admin/controls");
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const stored: Record<string, any> = {};
          json.data.forEach((ctrl: any) => {
            stored[ctrl.key] = ctrl.enabled;
          });
          setControlStates(prev => ({ ...prev, ...stored }));
        }
      } catch {
        // silently fall back to defaults
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [status]);

  if (status === "loading" || loading) return <LoadingSkeleton />;
  if (!session) return null;

  const update = (id: string, value: any) => {
    setControlStates(prev => ({ ...prev, [id]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const controls = controlSections.flatMap(sec =>
        sec.controls.map(c => ({ key: c.id, enabled: controlStates[c.id] }))
      );
      const res = await fetch("/api/admin/controls", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ controls }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", "Website controls saved successfully");
      } else {
        showToast("error", json.error || "Failed to save controls");
      }
    } catch {
      showToast("error", "Network error while saving controls");
    } finally {
      setSaving(false);
    }
  };

  const enabledCount = controlSections.reduce((a, sec) =>
    a + sec.controls.filter(c => c.type === "toggle" && controlStates[c.id]).length, 0);

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Website Controls" description={`${enabledCount} toggle controls active`}>
        <Badge variant="outline" className="gap-1.5 text-[10px]">
          <Monitor size={10} /> Live Controls
        </Badge>
      </PageHeader>

      <div className="grid grid-cols-1 gap-6">
        {controlSections.map((sec, si) => {
          const SecIcon = sec.icon;
          return (
            <motion.div
              key={sec.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: si * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-6">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/[0.04]">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.04]">
                    <SecIcon size={16} className="text-neon-cyan" />
                  </div>
                  <div>
                    <h3 className="font-heading text-base font-bold">{sec.title}</h3>
                  </div>
                </div>
                <div className="space-y-5">
                  {sec.controls.map((control) => (
                    <div key={control.id} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-white/80 font-medium">{control.label}</p>
                        <p className="text-[11px] text-white/25">{control.desc}</p>
                      </div>
                      <div className="shrink-0 ml-4">
                        {control.type === "toggle" && (
                          <button
                            type="button"
                            onClick={() => update(control.id, !controlStates[control.id])}
                            className={cn(
                              "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200",
                              controlStates[control.id] ? "bg-neon-cyan" : "bg-white/[0.08]"
                            )}
                          >
                            <span className={cn(
                              "inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 shadow-sm",
                              controlStates[control.id] ? "translate-x-[19px]" : "translate-x-[3px]"
                            )} />
                          </button>
                        )}
                        {control.type === "select" && (
                          <select
                            value={controlStates[control.id]}
                            onChange={(e) => update(control.id, e.target.value)}
                            className="h-9 rounded-xl bg-white/[0.04] border border-white/[0.04] px-3 text-xs text-white/70 outline-none focus:border-neon-cyan/20"
                          >
                            {(control as any).options?.map((opt: string) => (
                              <option key={opt} value={opt} className="bg-[#0a0a0a]">{opt}</option>
                            ))}
                          </select>
                        )}
                        {control.type === "range" && (
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min={(control as any).min}
                              max={(control as any).max}
                              step={(control as any).step}
                              value={controlStates[control.id]}
                              onChange={(e) => update(control.id, Number(e.target.value))}
                              className="w-24 h-1.5 rounded-full appearance-none bg-white/[0.08] cursor-pointer accent-neon-cyan"
                            />
                            <span className="text-xs text-white/40 w-12 text-right">
                              {controlStates[control.id] >= 3600
                                ? `${Math.round(controlStates[control.id] / 3600)}h`
                                : `${controlStates[control.id]}s`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="flex justify-center pt-2">
        <Button onClick={handleSave} disabled={saving} className="gap-2 h-10 px-6">
          {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
          {saving ? "Saving..." : "Save Changes"}
        </Button>
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
