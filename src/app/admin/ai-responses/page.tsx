"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Edit3, Trash2, Save, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ConfirmModal } from "@/components/admin/shared/ConfirmModal";

interface AIResponse {
  id: number;
  keyword: string;
  response: string;
  category: string;
  isActive: boolean;
}

const emptyForm = { keyword: "", response: "", category: "general", isActive: true };

const categories = ["general", "service", "pricing", "support", "company", "technical"];

export default function AdminAIResponsesPage() {
  const [items, setItems] = useState<AIResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<AIResponse | null>(null);
  const [filterCat, setFilterCat] = useState("");

  async function load() {
    try {
      const res = await fetch("/api/ai-responses");
      const json = await res.json();
      if (json.success) setItems(json.data);
      else toast.error(json.error || "Failed to load");
    } catch { toast.error("Failed to load"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function startCreate() { setEditingId(-1); setForm(emptyForm); }

  function startEdit(item: AIResponse) {
    setEditingId(item.id);
    setForm({ keyword: item.keyword, response: item.response, category: item.category, isActive: item.isActive });
  }

  function cancelEdit() { setEditingId(null); setForm(emptyForm); }

  async function handleSave() {
    if (!form.keyword.trim() || !form.response.trim()) { toast.error("Keyword and response are required"); return; }
    setSaving(true);
    try {
      const isNew = editingId === -1;
      const url = isNew ? "/api/ai-responses" : `/api/ai-responses/${editingId}`;
      const method = isNew ? "POST" : "PUT";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const json = await res.json();
      if (json.success) { toast.success(isNew ? "Created" : "Updated"); cancelEdit(); load(); }
      else toast.error(json.error || "Failed to save");
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/ai-responses/${deleteTarget.id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) { toast.success("Deleted"); setDeleteTarget(null); load(); }
      else toast.error(json.error || "Failed to delete");
    } catch { toast.error("Failed to delete"); }
  }

  const filtered = filterCat ? items.filter((i) => i.category === filterCat) : items;
  const cats = [...new Set(items.map((i) => i.category))].sort();

  if (loading) return <div className="p-6 animate-pulse space-y-6"><div className="h-8 w-48 bg-white/5 rounded-lg" /><div className="h-96 bg-white/5 rounded-2xl" /></div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-heading">AI Responses</h1>
          <p className="text-sm text-white/40 mt-1">Manage keyword-based AI responses</p>
        </div>
        <button onClick={startCreate} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-neon-orange to-neon-cyan text-black font-semibold hover:opacity-90 transition-all text-sm">
          <Plus className="w-4 h-4" /> New Response
        </button>
      </div>

      {editingId !== null && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 rounded-2xl bg-white/[0.02] border border-white/[0.04] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold font-heading">{editingId === -1 ? "New Response" : "Edit Response"}</h3>
            <button onClick={cancelEdit} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/70 transition-all"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1">Keyword</label>
              <input value={form.keyword} onChange={(e) => setForm({ ...form, keyword: e.target.value })} className="w-full h-9 px-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full h-9 px-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30">
                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-white/50 mb-1">Response</label>
              <textarea value={form.response} onChange={(e) => setForm({ ...form, response: e.target.value })} rows={4} className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30 resize-none" />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded border-white/20 bg-white/5" />
            <span className="text-sm text-white/60">Active</span>
          </label>
          <div className="flex gap-2 pt-2">
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-neon-cyan/10 text-neon-cyan text-sm font-medium hover:bg-neon-cyan/20 transition-all disabled:opacity-50">
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {saving ? "Saving..." : "Save"}
            </button>
            <button onClick={cancelEdit} className="px-4 py-2 rounded-xl border border-white/[0.06] text-white/40 hover:text-white/70 text-sm transition-all">Cancel</button>
          </div>
        </motion.div>
      )}

      <div className="flex gap-2 mb-6 border-b border-white/[0.04] pb-2 overflow-x-auto">
        <button onClick={() => setFilterCat("")} className={cn("px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap", !filterCat ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60")}>All ({items.length})</button>
        {cats.map((c) => (
          <button key={c} onClick={() => setFilterCat(c)} className={cn("px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap", filterCat === c ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60")}>{c} ({items.filter((i) => i.category === c).length})</button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="rounded-2xl bg-white/[0.02] border border-dashed border-white/[0.06] p-12 text-center">
            <p className="text-sm text-white/30">No responses yet.</p>
          </div>
        )}
        {filtered.map((item) => (
          <motion.div key={item.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={cn("rounded-2xl border overflow-hidden transition-all", item.isActive ? "bg-white/[0.02] border-white/[0.04]" : "bg-white/[0.01] border-white/[0.02] opacity-60")}
          >
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-sm font-semibold text-white/90">{item.keyword}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-white/40 border border-white/[0.06]">{item.category}</span>
                  </div>
                  <p className="text-sm text-white/50 line-clamp-2">{item.response}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => startEdit(item)} className="p-2 rounded-lg text-white/20 hover:text-white/60 hover:bg-white/[0.03] transition-all" title="Edit"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => setDeleteTarget(item)} className="p-2 rounded-lg text-red-400/30 hover:text-red-400 hover:bg-red-500/5 transition-all" title="Delete"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <ConfirmModal open={!!deleteTarget} onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} title="Delete Response" description={`Delete response for "${deleteTarget?.keyword}"?`} confirmText="Delete" variant="danger" />
    </div>
  );
}
