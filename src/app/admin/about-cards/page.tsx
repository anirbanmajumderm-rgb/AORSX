"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, RefreshCw, Heart, FileText, Scale, BookOpen, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useCsrf } from "@/lib/csrf-context";

const CARD_FIELDS = [
  {
    id: "values",
    label: "Our Values",
    icon: Heart,
    color: "text-cyan",
    fields: [
      { key: "card_values_title", label: "Card Heading", type: "text", placeholder: "Our Values" },
      { key: "company_values", label: "Values (comma separated)", type: "text", placeholder: "Innovation, Excellence, Integrity, Client-First" },
    ],
  },
  {
    id: "why-choose",
    label: "Why Choose Us",
    icon: CheckCircle2,
    color: "text-orange",
    fields: [
      { key: "card_why_title", label: "Card Heading", type: "text", placeholder: "Why Choose Us" },
      { key: "why_choose", label: "Why Choose Items (comma separated)", type: "textarea", placeholder: "Cutting-Edge AI Technology, 99.9% Uptime Guarantee, Award-Winning Design, Rapid Development" },
    ],
  },
  {
    id: "policy",
    label: "Our Policy",
    icon: FileText,
    color: "text-cyan",
    fields: [
      { key: "card_policy_title", label: "Card Heading", type: "text", placeholder: "Our Policy" },
      { key: "company_policy", label: "Policy Content", type: "textarea", placeholder: "Enter your company policy here..." },
    ],
  },
  {
    id: "rules",
    label: "Our Rules",
    icon: Scale,
    color: "text-orange",
    fields: [
      { key: "card_rules_title", label: "Card Heading", type: "text", placeholder: "Rules & Regulations" },
      { key: "company_rules", label: "Rules Content", type: "textarea", placeholder: "Enter your company rules here..." },
    ],
  },
  {
    id: "commitment",
    label: "Our Commitment",
    icon: BookOpen,
    color: "text-cyan",
    fields: [
      { key: "card_commitment_title", label: "Card Heading", type: "text", placeholder: "Our Commitment" },
      { key: "company_commitment", label: "Commitment Content", type: "textarea", placeholder: "Enter your company commitment here..." },
    ],
  },
];

export default function AboutCardsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { fetchWithCsrf } = useCsrf();

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchWithCsrf("/api/admin/content");
        const json = await res.json();
        if (json.success) {
          const data = json.data || json;
          const s: Record<string, string> = {};
          for (const [k, v] of Object.entries(data.settings || {})) {
            s[k] = (v as string) ?? "";
          }
          setSettings(s);
        }
      } catch {
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function update(key: string, value: string) {
    setSettings(prev => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    const keys = CARD_FIELDS.flatMap(c => c.fields.map(f => f.key));
    const payload: Record<string, string> = {};
    for (const key of keys) {
      payload[key] = settings[key] ?? "";
    }

    try {
      const res = await fetchWithCsrf("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("About cards saved successfully");
      } else {
        toast.error(json.error || "Failed to save");
      }
    } catch {
      toast.error("Failed to save about cards");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 animate-pulse space-y-6">
        <div className="h-8 w-48 bg-white/5 rounded-lg" />
        <div className="h-64 bg-white/5 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold font-heading">About Cards</h1>
          <p className="text-sm text-white/40 mt-1">Manage the content cards displayed in the About section</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-neon-orange to-neon-cyan text-black font-semibold hover:opacity-90 transition-all text-sm disabled:opacity-50"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {CARD_FIELDS.map((card, idx) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-6 space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div>
                <h3 className="text-base font-semibold font-heading">{card.label}</h3>
                <p className="text-xs text-white/40">Configure the &ldquo;{card.label}&rdquo; card in the About section</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {card.fields.map(field => (
                <div key={field.key} className={field.type === "textarea" ? "md:col-span-2" : ""}>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">{field.label}</label>
                  {field.type === "textarea" ? (
                    <textarea
                      value={settings[field.key] ?? ""}
                      onChange={(e) => update(field.key, e.target.value)}
                      rows={5}
                      placeholder={field.placeholder}
                      className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30 transition-colors resize-none"
                    />
                  ) : (
                    <input
                      value={settings[field.key] ?? ""}
                      onChange={(e) => update(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full h-10 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30 transition-colors"
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="rounded-xl bg-white/[0.01] border border-white/[0.04] p-4">
              <p className="text-[10px] uppercase tracking-wider text-white/20 font-semibold mb-2">Preview</p>
              <div className="rounded-lg bg-white/[0.02] border border-white/[0.04] p-3">
                <p className="text-sm font-semibold text-white/70 mb-2">
                  {settings[card.fields[0].key] || card.label}
                </p>
                {card.id === "values" && (
                  <div className="flex flex-wrap gap-2">
                    {(settings.company_values || "").split(",").filter(Boolean).map((v, i) => (
                      <span key={i} className="px-2.5 py-1 text-xs rounded-full bg-white/[0.04] border border-cyan/20 text-cyan/70">{v.trim()}</span>
                    ))}
                  </div>
                )}
                {card.id === "why-choose" && (
                  <ul className="space-y-1">
                    {(settings.why_choose || "").split(",").filter(Boolean).map((item, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-secondary-text">
                        <CheckCircle2 className="w-3 h-3 text-orange shrink-0" />
                        {item.trim()}
                      </li>
                    ))}
                  </ul>
                )}
                {(card.id === "policy" || card.id === "rules" || card.id === "commitment") && (
                  <p className="text-xs text-white/40 line-clamp-3">
                    {settings[card.fields[1].key] || "No content yet..."}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
