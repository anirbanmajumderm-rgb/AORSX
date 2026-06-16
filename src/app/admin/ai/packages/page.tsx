"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Package, Plus, Trash2, Eye, EyeOff, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { ConfirmModal } from "@/components/admin/shared/ConfirmModal";

interface Pkg {
  id: number;
  name: string;
  description: string | null;
  price: string | null;
  features: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", description: "", price: "", features: "" });
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  async function loadPackages() {
    try {
      const res = await fetch("/api/admin/packages");
      const json = await res.json();
      if (json.success) setPackages(json.data);
    } catch {} finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadPackages(); }, []);

  function resetForm() {
    setForm({ name: "", description: "", price: "", features: "" });
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(pkg: Pkg) {
    setForm({ name: pkg.name, description: pkg.description || "", price: pkg.price || "", features: pkg.features || "" });
    setEditingId(pkg.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      const url = editingId ? `/api/admin/packages/${editingId}` : "/api/admin/packages";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(editingId ? "Package updated" : "Package created");
        resetForm();
        loadPackages();
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
      const res = await fetch(`/api/admin/packages/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success("Package deleted");
        setDeleteId(null);
        loadPackages();
      } else {
        toast.error("Failed to delete");
      }
    } catch {
      toast.error("Failed to delete");
    }
  }

  async function toggleActive(pkg: Pkg) {
    try {
      await fetch(`/api/admin/packages/${pkg.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !pkg.isActive }),
      });
      loadPackages();
    } catch {}
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-white/5 rounded-lg animate-pulse" />
        {[...Array(3)].map((_, i) => <div key={i} className="h-28 bg-white/5 rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <PageHeader title="Packages" description="Service packages the AI can recommend">
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-neon-orange to-neon-cyan text-black"
        >
          <Plus className="w-3 h-3" /> Add Package
        </button>
      </PageHeader>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-neon-cyan/20 bg-neon-cyan/[0.02] p-5 mb-4 space-y-3"
        >
          <h3 className="text-sm font-semibold text-white">{editingId ? "Edit" : "New"} Package</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Package name"
              className="bg-white/5 border-white/10 text-white placeholder-white/30"
            />
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <Input
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="Price (e.g. $999)"
                className="bg-white/5 border-white/10 text-white placeholder-white/30 pl-8"
              />
            </div>
          </div>
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description"
            className="bg-white/5 border-white/10 text-white placeholder-white/30 min-h-[60px]"
          />
          <Textarea
            value={form.features}
            onChange={(e) => setForm({ ...form, features: e.target.value })}
            placeholder="Features (one per line)"
            className="bg-white/5 border-white/10 text-white placeholder-white/30 min-h-[80px]"
          />
          <div className="flex justify-end gap-2">
            <button onClick={resetForm} className="px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/70">Cancel</button>
            <Button onClick={handleSave} disabled={saving} className="h-8 bg-gradient-to-r from-neon-orange to-neon-cyan text-black text-xs font-semibold">
              {saving ? "Saving..." : editingId ? "Update" : "Create"}
            </Button>
          </div>
        </motion.div>
      )}

      {packages.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/[0.06] bg-white/[0.02] p-12 text-center">
          <Package className="w-8 h-8 mx-auto text-white/20 mb-3" />
          <p className="text-sm text-white/40">No packages created yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map((pkg) => (
            <motion.div
              key={pkg.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "rounded-2xl border p-5 transition-all",
                pkg.isActive ? "border-white/[0.04] bg-white/[0.02]" : "border-white/[0.02] bg-white/[0.01] opacity-60"
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5">
                    <Package className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{pkg.name}</h3>
                    {pkg.price && <p className="text-xs text-emerald-400 font-medium">{pkg.price}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => toggleActive(pkg)} className="flex h-7 w-7 items-center justify-center rounded-lg text-white/20 hover:text-neon-cyan hover:bg-neon-cyan/10 transition-all">
                    {pkg.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => startEdit(pkg)} className="flex h-7 w-7 items-center justify-center rounded-lg text-white/20 hover:text-neon-cyan hover:bg-neon-cyan/10 transition-all text-xs font-medium">
                    Edit
                  </button>
                  <button onClick={() => setDeleteId(pkg.id)} className="flex h-7 w-7 items-center justify-center rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {pkg.description && <p className="text-xs text-white/50 mb-3">{pkg.description}</p>}
              {pkg.features && (
                <div className="space-y-1">
                  {pkg.features.split("\n").filter(Boolean).map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-white/40">
                      <span className="w-1 h-1 rounded-full bg-emerald-400/60" />
                      {f}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId !== null && handleDelete(deleteId)}
        title="Delete Package"
        description="Are you sure you want to delete this package?"
        confirmText="Delete"
      />
    </div>
  );
}
