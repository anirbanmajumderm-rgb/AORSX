"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Plus, Trash2, GripVertical, Eye, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SiteContent {
  settings: Record<string, string>;
  services: any[];
  whyChooseMe: any[];
  company: any | null;
}

const defaultSettings: Record<string, string> = {
  site_name: "",
  hero_headline: "",
  hero_subtitle: "",
  hero_tech_stack: "",
  hero_projects: "",
  hero_projects_change: "",
  hero_uptime: "",
  hero_uptime_label: "",
  hero_support: "",
  hero_support_label: "",
  about_us_headline: "",
  about_us_body: "",
  company_values: "",
  company_policy: "",
  stats_projects: "",
  stats_clients: "",
  stats_years: "",
  stats_satisfaction: "",
};

export default function ContentPage() {
  const [, setContent] = useState<SiteContent | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>(defaultSettings);
  const [services, setServices] = useState<any[]>([]);
  const [whyChooseMe, setWhyChooseMe] = useState<any[]>([]);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("hero");
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/content");
        const json = await res.json();
        if (json.success) {
          const data = json.data || json;
          setContent(data);
          setSettings({ ...defaultSettings, ...(data.settings || {}) });
          setServices(data.services || []);
          setWhyChooseMe(data.whyChooseMe || []);
          setCompany(data.company || null);
        }
      } catch {
        toast.error("Failed to load content");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const updateSetting = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  async function handleSave() {
    setSaving(true);
    try {
      const updates = Object.entries(settings).map(([key, value]) => ({ key, value }));
      const res = await fetch("/api/admin/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates,
          services: services.map((s, i) => ({ ...s, order: s.order ?? i })),
          whyChooseMe: whyChooseMe.map((w, i) => ({ ...w, order: w.order ?? i })),
          company,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Content saved successfully");
        const fresh = await fetch(`/api/admin/content?_=${Date.now()}`);
        const freshJson = await fresh.json();
        if (freshJson.success) {
          const d = freshJson.data || freshJson;
          setSettings({ ...defaultSettings, ...(d.settings || {}) });
          setServices(d.services || []);
          setWhyChooseMe(d.whyChooseMe || []);
          setCompany(d.company || null);
        }
      } else {
        toast.error(json.error || "Failed to save content");
      }
    } catch {
      toast.error("Failed to save content");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 animate-pulse space-y-6">
        <div className="h-8 w-48 bg-white/5 rounded-lg" />
        <div className="h-96 bg-white/5 rounded-2xl" />
      </div>
    );
  }

  const tabs = [
    { id: "hero", label: "Hero" },
    { id: "about", label: "About" },
    { id: "services", label: "Services" },
    { id: "impact", label: "Impact" },
    { id: "whyus", label: "Why Us" },
    { id: "headings", label: "Headings" },
  ];

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold font-heading">Site Content</h1>
          <p className="text-sm text-white/40 mt-1">Manage all editable content across the site</p>
        </div>
        <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/[0.06] text-white/60 hover:text-white/80 hover:bg-white/[0.03] transition-all text-sm"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? "Hide Preview" : "Preview"}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-neon-orange to-neon-cyan text-black font-semibold hover:opacity-90 transition-all text-sm disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-white/[0.04] pb-2 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap",
              activeTab === tab.id
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white/60 hover:bg-white/[0.02]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6" style={showPreview ? { gridTemplateColumns: "1fr minmax(0, 400px)" } : {}}>
        <div className="space-y-6">
          {/* Hero Section */}
          {activeTab === "hero" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-6 space-y-5">
              <h3 className="text-lg font-semibold font-heading">Hero Section</h3>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">Site Name</label>
                <input
                  value={settings.site_name || ""}
                  onChange={(e) => updateSetting("site_name", e.target.value)}
                  className="w-full h-10 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30 transition-colors"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Title Part 1</label>
                  <input
                    value={(settings.hero_headline || "WE BUILD|YOU GROW|").split("|")[0] || ""}
                    onChange={(e) => {
                      const parts = (settings.hero_headline || "WE BUILD|YOU GROW|").split("|");
                      parts[0] = e.target.value;
                      updateSetting("hero_headline", parts.join("|"));
                    }}
                    className="w-full h-10 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Title Part 2</label>
                  <input
                    value={(settings.hero_headline || "WE BUILD|YOU GROW|").split("|")[1] || ""}
                    onChange={(e) => {
                      const parts = (settings.hero_headline || "WE BUILD|YOU GROW|").split("|");
                      parts[1] = e.target.value;
                      updateSetting("hero_headline", parts.join("|"));
                    }}
                    className="w-full h-10 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Title Part 3</label>
                  <input
                    value={(settings.hero_headline || "WE BUILD|YOU GROW|").split("|")[2] || ""}
                    onChange={(e) => {
                      const parts = (settings.hero_headline || "WE BUILD|YOU GROW|").split("|");
                      parts[2] = e.target.value;
                      updateSetting("hero_headline", parts.join("|"));
                    }}
                    className="w-full h-10 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">Hero Subtitle</label>
                <textarea
                  value={settings.hero_subtitle || ""}
                  onChange={(e) => updateSetting("hero_subtitle", e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30 transition-colors resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">Tech Stack (comma separated)</label>
                <input
                  value={settings.hero_tech_stack || ""}
                  onChange={(e) => updateSetting("hero_tech_stack", e.target.value)}
                  className="w-full h-10 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30 transition-colors"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Projects Count</label>
                  <input
                    value={settings.hero_projects || ""}
                    onChange={(e) => updateSetting("hero_projects", e.target.value)}
                    className="w-full h-10 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Projects Change Label</label>
                  <input
                    value={settings.hero_projects_change || ""}
                    onChange={(e) => updateSetting("hero_projects_change", e.target.value)}
                    className="w-full h-10 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Uptime</label>
                  <input
                    value={settings.hero_uptime || ""}
                    onChange={(e) => updateSetting("hero_uptime", e.target.value)}
                    className="w-full h-10 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30 transition-colors"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Uptime Label</label>
                  <input
                    value={settings.hero_uptime_label || ""}
                    onChange={(e) => updateSetting("hero_uptime_label", e.target.value)}
                    className="w-full h-10 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Support</label>
                  <input
                    value={settings.hero_support || ""}
                    onChange={(e) => updateSetting("hero_support", e.target.value)}
                    className="w-full h-10 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Support Label</label>
                  <input
                    value={settings.hero_support_label || ""}
                    onChange={(e) => updateSetting("hero_support_label", e.target.value)}
                    className="w-full h-10 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30 transition-colors"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* About Section */}
          {activeTab === "about" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-6 space-y-5">
              <h3 className="text-lg font-semibold font-heading">About Us</h3>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">About Headline</label>
                <input
                  value={settings.about_us_headline || "About Us"}
                  onChange={(e) => updateSetting("about_us_headline", e.target.value)}
                  className="w-full h-10 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">About Body Text</label>
                <textarea
                  value={settings.about_us_body || ""}
                  onChange={(e) => updateSetting("about_us_body", e.target.value)}
                  rows={8}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30 transition-colors resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">Company Values (comma separated)</label>
                <input
                  value={settings.company_values || ""}
                  onChange={(e) => updateSetting("company_values", e.target.value)}
                  className="w-full h-10 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">Company Policy</label>
                <textarea
                  value={settings.company_policy || ""}
                  onChange={(e) => updateSetting("company_policy", e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30 transition-colors resize-none"
                />
              </div>
            </motion.div>
          )}

          {/* Services Section */}
          {activeTab === "services" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold font-heading">Our Services</h3>
                <button
                  onClick={() => setServices(prev => [...prev, { title: "", description: "", icon: "Bot", order: prev.length }])}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/[0.06] text-sm text-white/60 hover:text-white/80 transition-all"
                >
                  <Plus className="w-4 h-4" /> Add Service
                </button>
              </div>
              {services.map((service, i) => (
                <div key={i} className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <GripVertical className="w-4 h-4 text-white/20 cursor-grab" />
                      <span className="text-sm font-medium text-white/50">Service {i + 1}</span>
                    </div>
                    <button
                      onClick={() => setServices(prev => prev.filter((_, idx) => idx !== i))}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-red-400/50 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-white/50 mb-1.5">Title</label>
                      <input
                        value={service.title}
                        onChange={(e) => {
                          const updated = [...services];
                          updated[i] = { ...updated[i], title: e.target.value };
                          setServices(updated);
                        }}
                        className="w-full h-10 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30 transition-colors"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-white/50 mb-1.5">Description</label>
                      <textarea
                        value={service.description || ""}
                        onChange={(e) => {
                          const updated = [...services];
                          updated[i] = { ...updated[i], description: e.target.value };
                          setServices(updated);
                        }}
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30 transition-colors resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-white/50 mb-1.5">Icon Name</label>
                      <input
                        value={service.icon || ""}
                        onChange={(e) => {
                          const updated = [...services];
                          updated[i] = { ...updated[i], icon: e.target.value };
                          setServices(updated);
                        }}
                        className="w-full h-10 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {services.length === 0 && (
                <div className="rounded-2xl bg-white/[0.02] border border-dashed border-white/[0.06] p-12 text-center">
                  <p className="text-sm text-white/30">No services yet. Click &ldquo;Add Service&rdquo; to create one.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Impact/Metrics Section */}
          {activeTab === "impact" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold font-heading">Impact Metrics</h3>
                <button
                  onClick={() => {
                    const current = (() => { try { return JSON.parse(settings.impact_metrics || "[]"); } catch { return []; } })();
                    const updated = [...current, { label: "", value: "", icon: "TrendingUp" }];
                    updateSetting("impact_metrics", JSON.stringify(updated));
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/[0.06] text-sm text-white/60 hover:text-white/80 transition-all"
                >
                  <Plus className="w-4 h-4" /> Add Metric
                </button>
              </div>
              {(() => {
                try { return JSON.parse(settings.impact_metrics || "[]"); } catch { return []; }
              })().map((metric: any, i: number) => (
                <div key={i} className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white/50">Metric {i + 1}</span>
                    <button
                      onClick={() => {
                        const current = JSON.parse(settings.impact_metrics || "[]");
                        const updated = current.filter((_: any, idx: number) => idx !== i);
                        updateSetting("impact_metrics", JSON.stringify(updated));
                      }}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-red-400/50 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-white/50 mb-1.5">Label</label>
                      <input
                        value={metric.label}
                        onChange={(e) => {
                          const current = JSON.parse(settings.impact_metrics || "[]");
                          current[i] = { ...current[i], label: e.target.value };
                          updateSetting("impact_metrics", JSON.stringify(current));
                        }}
                        placeholder="e.g. Projects Delivered"
                        className="w-full h-10 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-white/50 mb-1.5">Value</label>
                      <input
                        value={metric.value}
                        onChange={(e) => {
                          const current = JSON.parse(settings.impact_metrics || "[]");
                          current[i] = { ...current[i], value: e.target.value };
                          updateSetting("impact_metrics", JSON.stringify(current));
                        }}
                        placeholder="e.g. 200+"
                        className="w-full h-10 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-white/50 mb-1.5">Icon Name</label>
                      <input
                        value={metric.icon || ""}
                        onChange={(e) => {
                          const current = JSON.parse(settings.impact_metrics || "[]");
                          current[i] = { ...current[i], icon: e.target.value };
                          updateSetting("impact_metrics", JSON.stringify(current));
                        }}
                        placeholder="e.g. Code2"
                        className="w-full h-10 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {(() => {
                try { return JSON.parse(settings.impact_metrics || "[]"); } catch { return []; }
              })().length === 0 && (
                <div className="rounded-2xl bg-white/[0.02] border border-dashed border-white/[0.06] p-12 text-center">
                  <p className="text-sm text-white/30">No metrics yet. Click &ldquo;Add Metric&rdquo; to create one.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Why Us Section */}
          {activeTab === "whyus" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold font-heading">Why Choose Us</h3>
                <button
                  onClick={() => setWhyChooseMe(prev => [...prev, { title: "", description: "", icon: "Star", order: prev.length }])}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/[0.06] text-sm text-white/60 hover:text-white/80 transition-all"
                >
                  <Plus className="w-4 h-4" /> Add Item
                </button>
              </div>
              {whyChooseMe.map((item, i) => (
                <div key={i} className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <GripVertical className="w-4 h-4 text-white/20 cursor-grab" />
                      <span className="text-sm font-medium text-white/50">Item {i + 1}</span>
                    </div>
                    <button
                      onClick={() => setWhyChooseMe(prev => prev.filter((_, idx) => idx !== i))}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-red-400/50 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-white/50 mb-1.5">Title</label>
                      <input
                        value={item.title}
                        onChange={(e) => {
                          const updated = [...whyChooseMe];
                          updated[i] = { ...updated[i], title: e.target.value };
                          setWhyChooseMe(updated);
                        }}
                        className="w-full h-10 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30 transition-colors"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-white/50 mb-1.5">Description</label>
                      <textarea
                        value={item.description || ""}
                        onChange={(e) => {
                          const updated = [...whyChooseMe];
                          updated[i] = { ...updated[i], description: e.target.value };
                          setWhyChooseMe(updated);
                        }}
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30 transition-colors resize-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {whyChooseMe.length === 0 && (
                <div className="rounded-2xl bg-white/[0.02] border border-dashed border-white/[0.06] p-12 text-center">
                  <p className="text-sm text-white/30">No items yet. Click &ldquo;Add Item&rdquo; to create one.</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Headings Section */}
          {activeTab === "headings" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-6 space-y-5">
              <h3 className="text-lg font-semibold font-heading">Section Headings & Labels</h3>
              <p className="text-sm text-white/40 mb-4">Edit all section headings, subtitles, and labels across the site</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {[
                  { key: "sec_hero_label", label: "Hero Badge Label", desc: "Badge text on hero section" },
                  { key: "sec_stats_label", label: "Stats Section Label", desc: "Small label above stats section" },
                  { key: "sec_stats_title", label: "Stats Section Title", desc: "Main title for stats section" },
                  { key: "sec_stats_description", label: "Stats Section Description", desc: "Description below stats title" },
                  { key: "sec_services_label", label: "Services Section Label", desc: "Small label above services" },
                  { key: "sec_services_title", label: "Services Section Title", desc: "Main title for services section" },
                  { key: "sec_services_subtitle", label: "Services Section Subtitle", desc: "Description below services title" },
                  { key: "sec_projects_label", label: "Projects Section Label", desc: "Small label above projects" },
                  { key: "sec_projects_title", label: "Projects Section Title", desc: "Main title for projects section" },
                  { key: "sec_projects_subtitle", label: "Projects Section Subtitle", desc: "Description below projects title" },
                  { key: "sec_reviews_label", label: "Reviews Section Label", desc: "Small label above reviews" },
                  { key: "sec_reviews_title", label: "Reviews Section Title", desc: "Main title for reviews section" },
                  { key: "sec_reviews_subtitle", label: "Reviews Section Subtitle", desc: "Description below reviews title" },
                  { key: "sec_skills_label", label: "Skills Section Label", desc: "Small label above skills section" },
                  { key: "sec_skills_title", label: "Skills Section Title", desc: "Main title for skills section" },
                  { key: "sec_skills_description", label: "Skills Section Description", desc: "Description below skills title" },
                  { key: "sec_faq_label", label: "FAQ Section Label", desc: "Small label above FAQ section" },
                  { key: "sec_faq_title", label: "FAQ Section Title", desc: "Main title for FAQ section" },
                  { key: "sec_faq_subtitle", label: "FAQ Section Subtitle", desc: "Description below FAQ title" },
                  { key: "sec_contact_label", label: "Contact Section Label", desc: "Small label above contact section" },
                  { key: "sec_contact_title", label: "Contact Section Title", desc: "Main title for contact section" },
                  { key: "sec_contact_subtitle", label: "Contact Section Subtitle", desc: "Description below contact title" },
                  { key: "sec_why_label", label: "Why Choose Us Label", desc: "Label above Why Choose Us section" },
                  { key: "sec_why_title", label: "Why Choose Us Title", desc: "Main title for Why Choose Us section" },
                  { key: "sec_why_description", label: "Why Choose Us Description", desc: "Description for Why Choose Us" },
                  { key: "sec_guarantee_label", label: "Guarantee Label", desc: "Footer badge text on Why Choose cards" },
                  { key: "card_mission_title", label: "About - Mission Card Title", desc: "Title of the Mission card" },
                  { key: "card_vision_title", label: "About - Vision Card Title", desc: "Title of the Vision card" },
                  { key: "card_values_title", label: "About - Values Card Title", desc: "Title of the Values card" },
                  { key: "card_why_title", label: "About - Why Choose Title", desc: "Title of the Why Choose card" },
                  { key: "card_policy_title", label: "About - Policy Card Title", desc: "Title of the Policy card" },
                  { key: "card_rules_title", label: "About - Rules Card Title", desc: "Title of the Rules card" },
                  { key: "card_commitment_title", label: "About - Commitment Title", desc: "Title of the Commitment card" },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="block text-xs font-medium text-white/50 mb-1.5">{field.label}</label>
                    <input
                      value={settings[field.key] || ""}
                      onChange={(e) => updateSetting(field.key, e.target.value)}
                      className="w-full h-10 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30 transition-colors"
                    />
                    <p className="text-[10px] text-white/20 mt-0.5">{field.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-6 sticky top-24 h-fit">
            <h3 className="text-sm font-semibold text-white/70 mb-4">Live Preview</h3>
            <div className="space-y-4">
              <div className="rounded-xl bg-gradient-to-br from-neon-orange/10 to-neon-cyan/10 border border-white/[0.04] p-5">
                <p className="text-xs text-white/30 mb-1">Site Name</p>
                <p className="text-lg font-bold font-heading text-white">{settings.site_name || "My Site"}</p>
              </div>
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.04] p-5">
                <p className="text-xs text-white/30 mb-1">Hero Headline</p>
                <p className="text-lg font-bold font-heading text-white">{settings.hero_headline || "Build the future with AI"}</p>
              </div>
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.04] p-5">
                <p className="text-xs text-white/30 mb-1">Hero Subtitle</p>
                <p className="text-sm text-white/60">{settings.hero_subtitle || "Next-generation AI solutions"}</p>
              </div>
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.04] p-4">
                <p className="text-xs text-white/30 mb-2">Stats Preview</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/[0.02] rounded-lg p-2 text-center">
                    <p className="text-sm font-bold text-neon-cyan">{settings.stats_projects || "150"}+</p>
                    <p className="text-[10px] text-white/40">Projects</p>
                  </div>
                  <div className="bg-white/[0.02] rounded-lg p-2 text-center">
                    <p className="text-sm font-bold text-neon-orange">{settings.stats_clients || "50"}+</p>
                    <p className="text-[10px] text-white/40">Clients</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
