"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";

export default function PoliciesPage() {
  const [policy, setPolicy] = useState("");
  const [rules, setRules] = useState("");
  const [commitment, setCommitment] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadPolicies() {
    try {
      const res = await fetch("/api/settings");
      const json = await res.json();
      if (json.success) {
        setPolicy(json.data.company_policy || "");
        setRules(json.data.company_rules || "");
        setCommitment(json.data.company_commitment || "");
      }
    } catch {} finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadPolicies(); }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_policy: policy.trim(),
          company_rules: rules.trim(),
          company_commitment: commitment.trim(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Policies saved");
      } else {
        toast.error("Failed to save policies");
      }
    } catch {
      toast.error("Failed to save policies");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-white/5 rounded-lg animate-pulse" />
        {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl">
      <PageHeader title="Policies" description="Company policies that guide the AI chatbot responses" />

      <div className="space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
        >
          <h3 className="text-sm font-semibold text-white mb-1">Company Policy</h3>
          <p className="text-xs text-white/40 mb-3">General company policy that the AI should follow</p>
          <Textarea
            value={policy}
            onChange={(e) => setPolicy(e.target.value)}
            placeholder="Our company policy is to provide the best service..."
            className="bg-white/5 border-white/10 text-white placeholder-white/30 min-h-[120px] font-mono text-xs"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
        >
          <h3 className="text-sm font-semibold text-white mb-1">Company Rules</h3>
          <p className="text-xs text-white/40 mb-3">Specific rules and guidelines for the AI assistant</p>
          <Textarea
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            placeholder="Rules the AI should follow when responding to visitors..."
            className="bg-white/5 border-white/10 text-white placeholder-white/30 min-h-[120px] font-mono text-xs"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
        >
          <h3 className="text-sm font-semibold text-white mb-1">Company Commitment</h3>
          <p className="text-xs text-white/40 mb-3">The company's commitment statement shown to visitors</p>
          <Textarea
            value={commitment}
            onChange={(e) => setCommitment(e.target.value)}
            placeholder="We are committed to delivering high-quality solutions..."
            className="bg-white/5 border-white/10 text-white placeholder-white/30 min-h-[120px] font-mono text-xs"
          />
        </motion.div>

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="h-10 bg-gradient-to-r from-neon-orange to-neon-cyan text-black text-sm font-semibold"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Save className="w-4 h-4 mr-1.5" />}
            {saving ? "Saving..." : "Save Policies"}
          </Button>
        </div>
      </div>
    </div>
  );
}
