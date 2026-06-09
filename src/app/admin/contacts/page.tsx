"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Edit3, Trash2, Save, X, Eye, EyeOff, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ConfirmModal } from "@/components/admin/shared/ConfirmModal";

interface Contact {
  id: number;
  type: string;
  value: string;
  label: string | null;
  icon: string | null;
  order: number;
  isActive: boolean;
}

const emptyForm = { type: "email", value: "", label: "", icon: "", order: 0, isActive: true };

const contactTypes = ["email", "phone", "address", "social", "website"];

export default function AdminContactsPage() {
  const [items, setItems] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Contact | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/contacts?admin=true");
      const json = await res.json();
      if (json.success) setItems(json.data);
      else toast.error(json.error || "Failed to load");
    } catch { toast.error("Failed to load"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function startCreate() { setEditingId(-1); setForm(emptyForm); }

  function startEdit(item: Contact) {
    setEditingId(item.id);
    setForm({ type: item.type, value: item.value, label: item.label || "", icon: item.icon || "", order: item.order, isActive: item.isActive });
  }

  function cancelEdit() { setEditingId(null); setForm(emptyForm); }

  async function handleSave() {
    if (!form.value.trim()) { toast.error("Value is required"); return; }
    setSaving(true);
    try {
      const isNew = editingId === -1;
      const url = isNew ? "/api/contacts" : `/api/contacts/${editingId}`;
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
      const res = await fetch(`/api/contacts/${deleteTarget.id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) { toast.success("Deleted"); setDeleteTarget(null); load(); }
      else toast.error(json.error || "Failed to delete");
    } catch { toast.error("Failed to delete"); }
  }

  async function toggleActive(item: Contact) {
    try {
      const res = await fetch(`/api/contacts/${item.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !item.isActive }) });
      const json = await res.json();
      if (json.success) { toast.success(item.isActive ? "Hidden" : "Shown"); load(); }
      else toast.error(json.error || "Failed");
    } catch { toast.error("Failed to update"); }
  }

  const typeColors: Record<string, string> = {
    email: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    phone: "text-green-400 bg-green-500/10 border-green-500/20",
    address: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    social: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    website: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  };

  if (loading) return <div className="p-6 animate-pulse space-y-6"><div className="h-8 w-48 bg-white/5 rounded-lg" /><div className="h-96 bg-white/5 rounded-2xl" /></div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-heading">Contacts</h1>
          <p className="text-sm text-white/40 mt-1">Manage contact information</p>
        </div>
        <button onClick={startCreate} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-neon-orange to-neon-cyan text-black font-semibold hover:opacity-90 transition-all text-sm">
          <Plus className="w-4 h-4" /> New Contact
        </button>
      </div>

      {editingId !== null && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 rounded-2xl bg-white/[0.02] border border-white/[0.04] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold font-heading">{editingId === -1 ? "New Contact" : "Edit Contact"}</h3>
            <button onClick={cancelEdit} className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/70 transition-all"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full h-9 px-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30">
                {contactTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1">Value</label>
              <input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className="w-full h-9 px-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1">Label</label>
              <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="w-full h-9 px-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30" placeholder="e.g. Work Email" />
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
            <p className="text-sm text-white/30">No contacts yet. Click &ldquo;New Contact&rdquo; to create one.</p>
          </div>
        )}
        {items.map((item) => (
          <motion.div key={item.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={cn("rounded-2xl border overflow-hidden transition-all", item.isActive ? "bg-white/[0.02] border-white/[0.04]" : "bg-white/[0.01] border-white/[0.02] opacity-60")}
          >
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium border", typeColors[item.type] || "text-white/40 bg-white/5 border-white/[0.06]")}>{item.type}</span>
                    <span className="text-sm font-semibold text-white/90">{item.value}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {item.label && <span className="text-xs text-white/40">{item.label}</span>}
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

      <ConfirmModal open={!!deleteTarget} onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} title="Delete Contact" description={`Delete contact "${deleteTarget?.value}"?`} confirmText="Delete" variant="danger" />
    </div>
  );
}
