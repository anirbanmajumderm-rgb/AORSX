"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Plus, Edit2, Trash2, Package, X, Save, DollarSign, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Textarea } from "@/components/ui/input";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { EmptyState } from "@/components/admin/shared/EmptyState";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";

const CURRENCIES = ["USD", "EUR", "GBP", "BDT", "INR"];
const BILLING_CYCLES = ["one-time", "monthly", "yearly", "weekly"];
const CATEGORIES = ["service", "product", "maintenance", "consulting"];

export default function PackagesPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    name: "", description: "", price: "", currency: "USD",
    billingCycle: "one-time", features: "", category: "service", isActive: true, sortOrder: "0",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (sessionStatus === "authenticated") loadPackages();
  }, [sessionStatus]);

  async function loadPackages() {
    try {
      const res = await fetch("/api/admin/packages");
      const json = await res.json();
      if (json.success) setPackages(json.data);
    } catch { toast.error("Failed to load packages"); }
    finally { setLoading(false); }
  }

  function resetForm() {
    setForm({ name: "", description: "", price: "", currency: "USD", billingCycle: "one-time", features: "", category: "service", isActive: true, sortOrder: "0" });
    setEditingId(null);
    setShowForm(false);
  }

  function editItem(pkg: any) {
    setForm({
      name: pkg.name, description: pkg.description || "", price: String(pkg.price),
      currency: pkg.currency, billingCycle: pkg.billingCycle, features: pkg.features || "",
      category: pkg.category, isActive: pkg.isActive, sortOrder: String(pkg.sortOrder || 0),
    });
    setEditingId(pkg.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.name.trim() || !form.price) {
      toast.error("Name and price are required");
      return;
    }
    setSaving(true);
    try {
      const body = {
        ...form,
        price: parseFloat(form.price),
        sortOrder: parseInt(form.sortOrder) || 0,
        features: form.features || null,
      };
      const url = editingId ? `/api/admin/packages/${editingId}` : "/api/admin/packages";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(editingId ? "Package updated" : "Package created");
        resetForm();
        loadPackages();
      } else throw new Error(json.error);
    } catch { toast.error("Failed to save package"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this package?")) return;
    try {
      const res = await fetch(`/api/admin/packages/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success("Package deleted");
        loadPackages();
      }
    } catch { toast.error("Failed to delete package"); }
  }

  function getFeaturesList(features: string | null): string[] {
    if (!features) return [];
    try { return JSON.parse(features); } catch { return features.split("\n").filter(Boolean); }
  }

  if (sessionStatus === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-neon-cyan" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm text-white/30">Loading packages...</span>
        </div>
      </div>
    );
  }
  if (!session) return null;

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Packages & Pricing" description="Manage service packages, pricing tiers, and billing information" />

      <div className="flex justify-end">
        <Button size="sm" className="h-9 gap-1.5 text-xs" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="w-3.5 h-3.5" /> Add Package
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-white/70">{editingId ? "Edit Package" : "New Package"}</h3>
            <button onClick={resetForm} className="text-white/20 hover:text-white/60"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-white/40 mb-1 block">Name *</label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Package name" className="bg-white/[0.02] border-white/[0.04]" />
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Price *</label>
              <div className="flex gap-2">
                <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="0.00" className="bg-white/[0.02] border-white/[0.04]" />
                <select value={form.currency} onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))} className="w-20 px-2 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs text-white/60">
                  {CURRENCIES.map((c) => (<option key={c} value={c}>{c}</option>))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Billing Cycle</label>
              <select value={form.billingCycle} onChange={(e) => setForm((f) => ({ ...f, billingCycle: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-sm text-white/60">
                {BILLING_CYCLES.map((c) => (<option key={c} value={c}>{c.replace("-", " ")}</option>))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/40 mb-1 block">Category</label>
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-sm text-white/60">
                {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Sort Order</label>
              <Input type="number" value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))} className="bg-white/[0.02] border-white/[0.04]" />
            </div>
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1 block">Description</label>
            <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Package description..." className="bg-white/[0.02] border-white/[0.04] min-h-[60px]" />
          </div>
          <div>
            <label className="text-xs text-white/40 mb-1 block">Features (one per line or JSON array)</label>
            <Textarea value={form.features} onChange={(e) => setForm((f) => ({ ...f, features: e.target.value }))} placeholder="Feature 1&#10;Feature 2&#10;Feature 3" className="bg-white/[0.02] border-white/[0.04] min-h-[80px]" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="rounded border-white/20" />
            <label htmlFor="isActive" className="text-xs text-white/40">Active</label>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={resetForm}>Cancel</Button>
            <Button size="sm" className="h-8 text-xs gap-1.5" onClick={handleSave} disabled={saving}>
              <Save className="w-3.5 h-3.5" />{saving ? "Saving..." : (editingId ? "Update" : "Create")}
            </Button>
          </div>
        </div>
      )}

      {packages.length === 0 ? (
        <EmptyState icon={Package} title="No packages yet" description="Create packages and pricing tiers for your services." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map((pkg) => (
            <div key={pkg.id} className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-5 group">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-[9px]">{pkg.category}</Badge>
                    <StatusBadge status={pkg.isActive ? "active" : "inactive"} size="sm" />
                  </div>
                  <h3 className="text-sm font-medium text-white/70">{pkg.name}</h3>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => editItem(pkg)} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-white/[0.06] text-white/20 hover:text-neon-cyan">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(pkg.id)} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-2xl font-bold text-white/80">
                  {pkg.currency === "USD" ? "$" : pkg.currency === "EUR" ? "€" : pkg.currency === "GBP" ? "£" : pkg.currency + " "}
                  {pkg.price}
                </span>
                <span className="text-xs text-white/30">/{pkg.billingCycle.replace("-", " ")}</span>
              </div>
              {pkg.description && <p className="text-xs text-white/30 mb-3">{pkg.description}</p>}
              {pkg.features && (
                <ul className="space-y-1">
                  {getFeaturesList(pkg.features).map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-[11px] text-white/40">
                      <span className="w-1 h-1 rounded-full bg-neon-cyan/50" />{f}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
