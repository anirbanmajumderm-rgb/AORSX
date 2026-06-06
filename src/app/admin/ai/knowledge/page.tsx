"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Plus, Search, Edit2, Trash2, BookOpen, X, Save } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Textarea } from "@/components/ui/input";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { EmptyState } from "@/components/admin/shared/EmptyState";

const CATEGORIES = ["general", "company_info", "policy", "pricing", "process", "support"];

export default function KnowledgeBasePage() {
  const { data: session, status: sessionStatus } = useSession();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: "", content: "", category: "general", tags: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (sessionStatus === "authenticated") loadItems();
  }, [sessionStatus]);

  async function loadItems() {
    try {
      const res = await fetch("/api/admin/knowledge");
      const json = await res.json();
      if (json.success) setItems(json.data);
    } catch { toast.error("Failed to load knowledge base"); }
    finally { setLoading(false); }
  }

  function resetForm() {
    setForm({ title: "", content: "", category: "general", tags: "" });
    setEditingId(null);
    setShowForm(false);
  }

  function editItem(item: any) {
    setForm({ title: item.title, content: item.content, category: item.category, tags: item.tags || "" });
    setEditingId(item.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Title and content are required");
      return;
    }
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
        toast.success(editingId ? "Item updated" : "Item created");
        resetForm();
        loadItems();
      } else throw new Error(json.error);
    } catch { toast.error("Failed to save item"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this knowledge item?")) return;
    try {
      const res = await fetch(`/api/admin/knowledge/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success("Item deleted");
        loadItems();
      }
    } catch { toast.error("Failed to delete item"); }
  }

  const filtered = items.filter((i) => {
    if (activeCategory !== "all" && i.category !== activeCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      return i.title?.toLowerCase().includes(q) || i.content?.toLowerCase().includes(q);
    }
    return true;
  });

  if (sessionStatus === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-neon-cyan" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm text-white/30">Loading knowledge base...</span>
        </div>
      </div>
    );
  }
  if (!session) return null;

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Knowledge Base" description="Manage AI knowledge entries for company information, policies, and processes" />

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {["all", ...CATEGORIES].map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                activeCategory === c
                  ? "bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20"
                  : "text-white/30 hover:text-white/60 border border-transparent"
              )}
            >
              {c.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="relative w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white/[0.02] border-white/[0.04] text-sm"
            />
          </div>
          <Button size="sm" className="h-9 gap-1.5 text-xs" onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus className="w-3.5 h-3.5" /> Add Entry
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-white/70">{editingId ? "Edit Entry" : "New Entry"}</h3>
            <button onClick={resetForm} className="text-white/20 hover:text-white/60">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/40 mb-1 block">Title *</label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Entry title"
                className="bg-white/[0.02] border-white/[0.04]"
              />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-sm text-white/60 focus:outline-none focus:border-neon-cyan/30"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1 block">Tags (comma separated)</label>
            <Input
              value={form.tags}
              onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
              placeholder="e.g. pricing, web development, react"
              className="bg-white/[0.02] border-white/[0.04]"
            />
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1 block">Content *</label>
            <Textarea
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="Write the knowledge content here..."
              className="bg-white/[0.02] border-white/[0.04] min-h-[120px]"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={resetForm}>Cancel</Button>
            <Button size="sm" className="h-8 text-xs gap-1.5" onClick={handleSave} disabled={saving}>
              <Save className="w-3.5 h-3.5" />
              {saving ? "Saving..." : (editingId ? "Update" : "Create")}
            </Button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon={BookOpen} title="No entries yet" description="Add knowledge entries to help the AI assistant provide better answers." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((item) => (
            <div key={item.id} className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4 group">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[9px]">{item.category}</Badge>
                    {item.tags && item.tags.split(",").slice(0, 2).map((tag: string, i: number) => (
                      <span key={i} className="text-[9px] text-white/20">#{tag.trim()}</span>
                    ))}
                  </div>
                  <h3 className="text-sm font-medium text-white/70">{item.title}</h3>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => editItem(item)} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-white/[0.06] text-white/20 hover:text-neon-cyan">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-white/30 line-clamp-3">{item.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
