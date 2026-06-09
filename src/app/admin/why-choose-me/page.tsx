"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Edit3, Trash2, Save, X, Eye, EyeOff, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ConfirmModal } from "@/components/admin/shared/ConfirmModal";

interface Item {
  id: number;
  title: string;
  description: string | null;
  icon: string | null;
  order: number;
  isActive: boolean;
}

const emptyForm = { title: "", description: "", icon: "Star", order: 0, isActive: true };

export default function AdminWhyChooseMePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Item | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/why-choose-me?admin=true");
      const json = await res.json();
      if (json.success) setItems(json.data);
      else toast.error(json.error || "Failed to load");
    } catch { toast.error("Failed to load"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function startCreate() { setEditingId(-1); setForm(emptyForm); }

  function startEdit(item: Item) {
    setEditingId(item.id);
    setForm({ title: item.title, description: item.description || "", icon: item.icon || "", order: item.order, isActive: item.isActive });
  }

  function cancelEdit() { setEditingId(null); setForm(emptyForm); }

  async function handleSave() {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    setSaving(true);
    try {
      const isNew = editingId === -1;
      const url = isNew ? "/api/why-choose-me" : `/api/why-choose-me/${editingId}`;
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
      const res = await fetch(`/api/why-choose-me/${deleteTarget.id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) { toast.success("Deleted"); setDeleteTarget(null); load(); }
      else toast.error(json.error || "Failed to delete");
    } catch { toast.error("Failed to delete"); }
  }

  async function toggleActive(item: Item) {
    try {
      const res = await fetch(`/api/why-choose-me/${item.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !item.isActive }) });
      const json = await res.json();
      if (json.success) { toast.success(item.isActive ? "Hidden" : "Shown"); load(); }
      else toast.error(json.error || "Failed");
    } catch { toast.error("Failed to update"); }
  }

  if (loading) return <div className="p-6 animate-pulse space-y-6"><div className="h-8 w-48 bg-white/5 rounded-lg" /><div className="h-96 bg-white/5 rounded-2xl" /></div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-heading">Why Choose Us</h1>
          <p className="text-sm text-white/40 mt-1">Manage reasons clients choose you</p>
        </div>
        <button onClick={startCreate} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-neon-orange to-neon-cyan text-black font-semibold hover:opacity-90 transition-all text-sm">
          <Plus className="w-4 h-4" /> New Item
        </button>
      </div>

      {editingId !== null && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 rounded-2xl bg-white/[0.02] border border-white/[0.04] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold font-heading">{editingId === -1 ? "New Item" : "Edit Item"}</h3>
            <button onClick={cancelEdit} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/70 transition-all"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-white/50 mb-1">Title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full h-9 px-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-white/50 mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30 resize-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1">Icon Name</label>
              <input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className="w-full h-9 px-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1">Order</label>
              <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })} className="w-full h-9 px-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30" />
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

      <div className="space-y-3">
        {items.length === 0 && (
          <div className="rounded-2xl bg-white/[0.02] border border-dashed border-white/[0.06] p-12 text-center">
            <p className="text-sm text-white/30">No items yet. Click &ldquo;New Item&rdquo; to create one.</p>
          </div>
        )}
        {items.map((item) => (
          <motion.div key={item.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={cn("rounded-2xl border overflow-hidden transition-all", item.isActive ? "bg-white/[0.02] border-white/[0.04]" : "bg-white/[0.01] border-white/[0.02] opacity-60")}
          >
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold font-heading text-white/90 truncate">{item.title}</h3>
                  {item.description && <p className="text-sm text-white/40 mt-1 line-clamp-2">{item.description}</p>}
                  <div className="flex items-center gap-2 mt-1">
                    {item.icon && <span className="text-xs text-white/30">Icon: {item.icon}</span>}
                    <span className="text-xs text-white/20">Order: {item.order}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => toggleActive(item)} className={cn("p-2 rounded-lg transition-all", item.isActive ? "text-green-400/70 hover:text-green-400 bg-green-400/5" : "text-white/20 hover:text-white/60 hover:bg-white/[0.03]")} title={item.isActive ? "Hide" : "Show"}>
                    {item.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button onClick={() => startEdit(item)} className="p-2 rounded-lg text-white/20 hover:text-white/60 hover:bg-white/[0.03] transition-all" title="Edit"><Edit3 className="w-4 h-4" /></button>
                  <button onClick={() => setDeleteTarget(item)} className="p-2 rounded-lg text-red-400/30 hover:text-red-400 hover:bg-red-500/5 transition-all" title="Delete"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <ConfirmModal open={!!deleteTarget} onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} title="Delete Item" description={`Delete "${deleteTarget?.title}"?`} confirmText="Delete" variant="danger" />
    </div>
  );
}
