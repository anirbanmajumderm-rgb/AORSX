"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Save, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { PageHeader } from "@/components/admin/shared/PageHeader";

const POLICY_KEYS = [
  { key: "company_policy", label: "Company Policy", description: "General company policies, terms of service, and guidelines." },
  { key: "company_rules", label: "Company Rules", description: "Operational rules, code of conduct, and workplace policies." },
  { key: "company_commitment", label: "Company Commitment", description: "Client commitments, quality guarantees, and service promises." },
];

export default function PoliciesPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [policies, setPolicies] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (sessionStatus === "authenticated") loadPolicies();
  }, [sessionStatus]);

  async function loadPolicies() {
    try {
      const res = await fetch("/api/settings");
      const json = await res.json();
      if (json.success) {
        const data: Record<string, string> = {};
        for (const pk of POLICY_KEYS) {
          data[pk.key] = json.data[pk.key] || "";
        }
        setPolicies(data);
      }
    } catch { toast.error("Failed to load policies"); }
    finally { setLoading(false); }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const body: Record<string, string> = {};
      for (const pk of POLICY_KEYS) {
        body[pk.key] = policies[pk.key] || "";
      }
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Policies saved successfully");
        loadPolicies();
      } else {
        toast.error(json.error || "Failed to save policies");
      }
    } catch { toast.error("Failed to save policies"); }
    finally { setSaving(false); }
  }

  if (sessionStatus === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 text-neon-cyan animate-spin" />
          <span className="text-sm text-white/30">Loading policies...</span>
        </div>
      </div>
    );
  }
  if (!session) return null;

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Policies Manager"
        description="Manage company policies, rules, and commitments that the AI assistant uses to answer visitor questions."
      />

      <div className="space-y-4">
        {POLICY_KEYS.map((pk) => (
          <div key={pk.key} className="glass-card rounded-2xl p-6">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-white/80">{pk.label}</h3>
              <p className="text-xs text-white/30 mt-0.5">{pk.description}</p>
            </div>
            <Textarea
              value={policies[pk.key] || ""}
              onChange={(e) => setPolicies((prev) => ({ ...prev, [pk.key]: e.target.value }))}
              placeholder={`Enter ${pk.label.toLowerCase()} content...`}
              rows={6}
              className="bg-white/[0.02] border-white/[0.04] resize-y min-h-[120px] text-sm"
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button
          size="sm"
          className="h-9 text-xs gap-1.5"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save size={13} />}
          {saving ? "Saving..." : "Save All Policies"}
        </Button>
      </div>

      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white/80 mb-2">How this works</h3>
        <p className="text-xs text-white/30 leading-relaxed">
          The policies you enter here are automatically used by the AI assistant when visitors ask about
          policies, terms, rules, or commitments. Changes take effect immediately — no retraining needed.
          The AI will respond with the exact policy text you provide.
        </p>
      </div>
    </div>
  );
}