"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  Plus, ChevronUp, FileJson,
  RefreshCw, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { useToast } from "@/components/ui/Toast";

export default function AIPromptsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [prompts, setPrompts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [response, setResponse] = useState("");
  const [category, setCategory] = useState("general");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPrompts();
  }, []);

  async function loadPrompts() {
    try {
      const res = await fetch("/api/ai-responses");
      const json = await res.json();
      if (json.success) setPrompts(json.data);
    } catch {
      showToast("error", "Failed to load prompts");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!keyword.trim() || !response.trim()) {
      showToast("error", "Keyword and response are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/ai-responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: keyword.trim(), response: response.trim(), category }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", "Prompt created successfully");
        setShowForm(false);
        setKeyword("");
        setResponse("");
        setCategory("general");
        loadPrompts();
      } else {
        showToast("error", json.error || "Failed to create prompt");
      }
    } catch {
      showToast("error", "Failed to create prompt");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      const res = await fetch(`/api/ai-responses/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        showToast("success", "Prompt deleted");
        loadPrompts();
      }
    } catch {
      showToast("error", "Failed to delete prompt");
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
          <span className="text-sm text-white/30">Loading prompts...</span>
        </div>
      </div>
    );
  }
  if (!session) return null;

  const tokens = response.trim() ? Math.round(response.trim().split(/\s+/).length * 1.3) : 0;

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Prompt Templates" description="Create and manage AI prompt templates" />

      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-heading text-base font-bold">New Prompt Template</h3>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? <ChevronUp size={12} /> : <Plus size={12} />}
            {showForm ? "Collapse" : "Create"}
          </Button>
        </div>

        {showForm && (
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-[10px] font-medium uppercase tracking-wider text-white/30 mb-1.5">Keyword / Trigger</label>
              <Input
                placeholder="e.g. greeting, pricing, support"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                className="bg-white/[0.02] border-white/[0.04]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-medium uppercase tracking-wider text-white/30 mb-1.5">Response Content</label>
              <Textarea
                placeholder="Write the AI response content..."
                value={response}
                onChange={e => setResponse(e.target.value)}
                rows={5}
                className="bg-white/[0.02] border-white/[0.04] resize-y min-h-[100px]"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-[10px] font-medium uppercase tracking-wider text-white/30 mb-1.5">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full h-9 rounded-xl bg-white/[0.02] border border-white/[0.04] px-3 text-xs text-white/80 outline-none"
                >
                  <option value="general" className="bg-[#0a0a0f]">General</option>
                  <option value="greeting" className="bg-[#0a0a0f]">Greeting</option>
                  <option value="support" className="bg-[#0a0a0f]">Support</option>
                  <option value="sales" className="bg-[#0a0a0f]">Sales</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-medium uppercase tracking-wider text-white/30 mb-1.5">Estimated Tokens</label>
                <div className="flex items-center h-9 rounded-xl bg-white/[0.02] border border-white/[0.04] px-3">
                  <FileJson size={13} className="text-neon-cyan mr-2 shrink-0" />
                  <span className="text-sm text-white/60 font-mono">{tokens}</span>
                  <span className="text-[10px] text-white/20 ml-1">tokens</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button size="sm" className="h-9 text-xs gap-1.5" onClick={handleCreate} disabled={saving}>
                {saving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Plus size={13} />}
                {saving ? "Creating..." : "Create Template"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 text-xs"
                onClick={() => { setShowForm(false); setKeyword(""); setResponse(""); setCategory("general"); }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-heading text-base font-bold">Existing Templates</h3>
          <span className="text-xs text-white/30">{prompts.length} total</span>
        </div>

        <div className="space-y-2">
          {prompts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/[0.06] p-8 text-center">
              <FileJson size={24} className="mx-auto text-white/20 mb-2" />
              <p className="text-sm text-white/30">No templates yet. Create your first one above.</p>
            </div>
          ) : (
            prompts.map((p: any) => (
              <div key={p.id} className="flex items-start justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.03] transition-all group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="cyan" className="text-[9px]">{p.category}</Badge>
                    <span className="text-white/70 font-medium text-sm">{p.keyword}</span>
                    {p.isActive === false && <Badge variant="secondary" className="text-[9px]">Inactive</Badge>}
                  </div>
                  <p className="text-xs text-white/30 line-clamp-2">{p.response}</p>
                </div>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="h-7 w-7 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
