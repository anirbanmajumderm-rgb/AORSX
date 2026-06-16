"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { ConfirmModal } from "@/components/admin/shared/ConfirmModal";

interface KnowledgeItem {
  id: number;
  question: string;
  answer: string | null;
  category: string;
  keywords: string | null;
  isActive: boolean;
  createdAt: string;
}

const CATEGORIES = ["general", "pricing", "services", "support", "technical", "other"];

export default function KnowledgeBasePage() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ question: "", answer: "", category: "general", keywords: "" });
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("all");

  async function loadItems() {
    try {
      const res = await fetch("/api/admin/knowledge");
      const json = await res.json();
      if (json.success) setItems(json.data);
    } catch {} finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadItems(); }, []);

  function resetForm() {
    setForm({ question: "", answer: "", category: "general", keywords: "" });
    setEditingId(null);
    setShowNew(false);
  }

  function startEdit(item: KnowledgeItem) {
    setForm({ question: item.question, answer: item.answer || "", category: item.category, keywords: item.keywords || "" });
    setEditingId(item.id);
    setShowNew(true);
  }

  async function handleSave() {
    if (!form.question.trim()) { toast.error("Question is required"); return; }
    setSaving(true);
    try {
      const url = editingId ? `/api/admin/knowledge/${editingId}` : "/api/admin/knowledge";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(editingId ? "Knowledge item updated" : "Knowledge item created");
        resetForm();
        loadItems();
      } else {
        toast.error(json.error || "Failed to save");
      }
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      const res = await fetch(`/api/admin/knowledge/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success("Knowledge item deleted");
        setDeleteId(null);
        loadItems();
      } else {
        toast.error("Failed to delete");
      }
    } catch {
      toast.error("Failed to delete");
    }
  }

  async function toggleActive(item: KnowledgeItem) {
    try {
      await fetch(`/api/admin/knowledge/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      loadItems();
    } catch {}
  }

  const filtered = filter === "all" ? items : items.filter((i) => i.category === filter);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-white/5 rounded-lg animate-pulse" />
        {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <PageHeader title="Knowledge Base" description="Q&A pairs for the AI chatbot">
        <div className="flex gap-2">
          {["all", ...CATEGORIES].map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize",
                filter === c
                  ? "bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20"
                  : "text-white/40 hover:text-white/70 bg-white/[0.03] border border-transparent"
              )}
            >
              {c}
            </button>
          ))}
          <button
            onClick={() => { resetForm(); setShowNew(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-neon-orange to-neon-cyan text-black"
          >
            <Plus className="w-3 h-3" /> Add
          </button>
        </div>
      </PageHeader>

      {showNew && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-neon-cyan/20 bg-neon-cyan/[0.02] p-5 mb-4 space-y-3"
        >
          <h3 className="text-sm font-semibold text-white">{editingId ? "Edit" : "New"} Knowledge Item</h3>
          <Input
            value={form.question}
            onChange={(e) => setForm({ ...form, question: e.target.value })}
            placeholder="Question"
            className="bg-white/5 border-white/10 text-white placeholder-white/30"
          />
          <Textarea
            value={form.answer}
            onChange={(e) => setForm({ ...form, answer: e.target.value })}
            placeholder="Answer"
            className="bg-white/5 border-white/10 text-white placeholder-white/30 min-h-[80px]"
          />
          <div className="flex gap-3">
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="flex-1 h-9 rounded-lg bg-white/5 border border-white/10 text-white text-sm px-3 outline-none focus:border-neon-cyan/40"
            >
              {CATEGORIES.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
            <Input
              value={form.keywords}
              onChange={(e) => setForm({ ...form, keywords: e.target.value })}
              placeholder="Keywords (comma-separated)"
              className="flex-[2] bg-white/5 border-white/10 text-white placeholder-white/30"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={resetForm} className="px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/70">Cancel</button>
            <Button onClick={handleSave} disabled={saving} className="h-8 bg-gradient-to-r from-neon-orange to-neon-cyan text-black text-xs font-semibold">
              {saving ? "Saving..." : editingId ? "Update" : "Create"}
            </Button>
          </div>
        </motion.div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/[0.06] bg-white/[0.02] p-12 text-center">
          <BookOpen className="w-8 h-8 mx-auto text-white/20 mb-3" />
          <p className="text-sm text-white/40">No knowledge items found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "rounded-xl border p-4 transition-all",
                item.isActive ? "border-white/[0.04] bg-white/[0.02]" : "border-white/[0.02] bg-white/[0.01] opacity-60"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-medium text-white">{item.question}</h3>
                    <span className="text-[10px] text-white/20 bg-white/[0.03] px-2 py-0.5 rounded-full capitalize">{item.category}</span>
                  </div>
                  {item.answer && <p className="text-xs text-white/50 mt-1 line-clamp-2">{item.answer}</p>}
                  {item.keywords && <p className="text-[10px] text-white/20 mt-1">Keywords: {item.keywords}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => toggleActive(item)} className="flex h-7 w-7 items-center justify-center rounded-lg text-white/20 hover:text-neon-cyan hover:bg-neon-cyan/10 transition-all">
                    {item.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => startEdit(item)} className="flex h-7 w-7 items-center justify-center rounded-lg text-white/20 hover:text-neon-cyan hover:bg-neon-cyan/10 transition-all text-xs font-medium">
                    Edit
                  </button>
                  <button onClick={() => setDeleteId(item.id)} className="flex h-7 w-7 items-center justify-center rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId !== null && handleDelete(deleteId)}
        title="Delete Knowledge Item"
        description="Are you sure you want to delete this knowledge item?"
        confirmText="Delete"
      />
    </div>
  );
}
