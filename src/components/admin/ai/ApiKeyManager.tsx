"use client";

import { Key, Trash2, Plus, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";

export function ApiKeyManager({ className }: { className?: string }) {
  const { showToast } = useToast();
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadKeys();
  }, []);

  async function loadKeys() {
    try {
      const res = await fetch("/api/admin/api-keys");
      const json = await res.json();
      if (json.success) setKeys(json.data);
    } catch {
      showToast("error", "Failed to load API keys");
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerate() {
    if (!newName.trim()) {
      showToast("error", "Key name is required");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", "API key generated");
        setShowForm(false);
        setNewName("");
        loadKeys();
      } else {
        showToast("error", json.error || "Failed to generate key");
      }
    } catch {
      showToast("error", "Failed to generate key");
    } finally {
      setGenerating(false);
    }
  }

  async function handleDelete(id: number) {
    try {
      const res = await fetch("/api/admin/api-keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", "API key deleted");
        loadKeys();
      }
    } catch {
      showToast("error", "Failed to delete API key");
    }
  }

  if (loading) return <div className="text-xs text-white/30 py-4 text-center">Loading API keys...</div>;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-5">
        <h4 className="font-heading text-sm font-bold mb-3">Generate New Key</h4>
        {showForm ? (
          <div className="flex flex-col gap-3">
            <Input
              placeholder="e.g. Production Key"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="bg-white/[0.02] border-white/[0.04]"
            />
            <div className="flex gap-2">
              <Button size="sm" className="h-8 text-xs gap-1.5" onClick={handleGenerate} disabled={generating}>
                {generating ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Key size={12} />}
                {generating ? "Generating..." : "Generate"}
              </Button>
              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setShowForm(false); setNewName(""); }}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => setShowForm(true)}>
            <Plus size={12} /> New Key
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {keys.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/[0.06] p-6 text-center">
            <Key size={20} className="mx-auto text-white/20 mb-2" />
            <p className="text-sm text-white/30">No API keys yet.</p>
          </div>
        ) : (
          keys.map((k: any) => (
            <div key={k.id} className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.03] transition-all">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg",
                  k.status === "active" ? "bg-emerald-500/10" : "bg-red-500/10"
                )}>
                  <Key size={14} className={k.status === "active" ? "text-emerald-400" : "text-red-400"} />
                </div>
                <div>
                  <p className="text-sm text-white/70 font-medium">{k.name}</p>
                  <code className="text-[10px] text-white/20 font-mono">{k.key?.slice(0, 8)}...{k.key?.slice(-4)}</code>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-white/20 hidden sm:block">{k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : "Never"}</span>
                <StatusBadge status={k.status} size="sm" />
                <button
                  onClick={() => handleDelete(k.id)}
                  className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-all"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
