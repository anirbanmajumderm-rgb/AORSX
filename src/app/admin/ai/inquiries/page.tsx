"use client";

import { useState, useEffect, startTransition } from "react";
import { useSession } from "next-auth/react";
import { Search, Mail, Phone, Calendar, DollarSign, Briefcase, Clock, MessageSquare, ChevronDown, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { EmptyState } from "@/components/admin/shared/EmptyState";

const STATUSES = ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"] as const;
const STATUS_COLORS: Record<string, "info" | "warning" | "success" | "error" | "default"> = {
  new: "info",
  contacted: "warning",
  qualified: "info",
  proposal: "warning",
  negotiation: "warning",
  won: "success",
  lost: "error",
};

export default function InquiriesPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState<number | null>(null);

  async function loadInquiries() {
    try {
      const res = await fetch("/api/admin/inquiries");
      const json = await res.json();
      if (json.success) {
        setInquiries(json.data.inquiries || []);
        const countMap: Record<string, number> = { all: (json.data.inquiries || []).length };
        (json.data.counts || []).forEach((c: any) => { countMap[c.status] = c._count.id; });
        setCounts(countMap);
      }
    } catch { toast.error("Failed to load inquiries"); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (sessionStatus === "authenticated") startTransition(() => loadInquiries());
  }, [sessionStatus]);

  async function handleStatusChange(id: number, status: string) {
    try {
      const res = await fetch("/api/admin/inquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Status updated to ${status}`);
        loadInquiries();
      } else throw new Error(json.error);
    } catch { toast.error("Failed to update status"); }
  }

  async function handleSaveNotes(id: number) {
    setSaving(id);
    try {
      const res = await fetch("/api/admin/inquiries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, notes: notes[id] || "" }),
      });
      const json = await res.json();
      if (json.success) toast.success("Notes saved");
      else throw new Error(json.error);
    } catch { toast.error("Failed to save notes"); }
    finally { setSaving(null); }
  }

  const filtered = inquiries.filter((i) => {
    if (activeFilter !== "all" && i.status !== activeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        i.name?.toLowerCase().includes(q) ||
        i.email?.toLowerCase().includes(q) ||
        i.serviceType?.toLowerCase().includes(q) ||
        i.requirements?.toLowerCase().includes(q)
      );
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
          <span className="text-sm text-white/30">Loading inquiries...</span>
        </div>
      </div>
    );
  }
  if (!session) return null;

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Client Inquiries" description="Manage and track client inquiries from the AI assistant" />

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {["all", ...STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setActiveFilter(s)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                activeFilter === s
                  ? "bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20"
                  : "text-white/30 hover:text-white/60 border border-transparent"
              )}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
              {counts[s] > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-white/5 text-[10px]">{counts[s]}</span>
              )}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
          <Input
            placeholder="Search inquiries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white/[0.02] border-white/[0.04] text-sm"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No inquiries yet"
          description="Client inquiries from the AI assistant will appear here."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((inquiry) => (
            <div
              key={inquiry.id}
              className="rounded-xl border border-white/[0.04] bg-white/[0.02] overflow-hidden transition-all"
            >
              <button
                onClick={() => setExpandedId(expandedId === inquiry.id ? null : inquiry.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/[0.01] transition-colors text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-neon-orange/20 to-neon-cyan/20">
                    <MessageSquare className="w-4 h-4 text-neon-cyan" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/80">{inquiry.name}</p>
                    {inquiry.serviceType && (
                      <p className="text-xs text-white/30 mt-0.5">{inquiry.serviceType}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={inquiry.status} size="sm" />
                  <ChevronDown className={cn(
                    "w-4 h-4 text-white/20 transition-transform",
                    expandedId === inquiry.id && "rotate-180"
                  )} />
                </div>
              </button>

              {expandedId === inquiry.id && (
                <div className="px-4 pb-4 border-t border-white/[0.04] pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {inquiry.email && (
                      <div className="flex items-center gap-2 text-xs text-white/40">
                        <Mail className="w-3.5 h-3.5" /> {inquiry.email}
                      </div>
                    )}
                    {inquiry.phone && (
                      <div className="flex items-center gap-2 text-xs text-white/40">
                        <Phone className="w-3.5 h-3.5" /> {inquiry.phone}
                      </div>
                    )}
                    {inquiry.budget && (
                      <div className="flex items-center gap-2 text-xs text-white/40">
                        <DollarSign className="w-3.5 h-3.5" /> Budget: {inquiry.budget}
                      </div>
                    )}
                    {inquiry.timeline && (
                      <div className="flex items-center gap-2 text-xs text-white/40">
                        <Clock className="w-3.5 h-3.5" /> Timeline: {inquiry.timeline}
                      </div>
                    )}
                    {inquiry.serviceType && (
                      <div className="flex items-center gap-2 text-xs text-white/40">
                        <Briefcase className="w-3.5 h-3.5" /> Service: {inquiry.serviceType}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-white/40">
                      <Calendar className="w-3.5 h-3.5" /> {new Date(inquiry.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {inquiry.requirements && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-white/50 mb-1">Requirements:</p>
                      <p className="text-sm text-white/60 bg-white/[0.02] rounded-lg p-3 border border-white/[0.04]">
                        {inquiry.requirements}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-4 items-start">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-white/50 mb-1">Admin Notes:</p>
                      <textarea
                        value={notes[inquiry.id] ?? inquiry.notes ?? ""}
                        onChange={(e) => setNotes((prev) => ({ ...prev, [inquiry.id]: e.target.value }))}
                        placeholder="Add notes about this inquiry..."
                        className="w-full px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04] text-sm text-white/60 placeholder:text-white/20 focus:outline-none focus:border-neon-cyan/30 resize-none h-20"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <select
                        value={inquiry.status}
                        onChange={(e) => handleStatusChange(inquiry.id, e.target.value)}
                        className="px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.04] text-xs text-white/60 focus:outline-none focus:border-neon-cyan/30"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs"
                        onClick={() => handleSaveNotes(inquiry.id)}
                        disabled={saving === inquiry.id}
                      >
                        {saving === inquiry.id ? "Saving..." : "Save Notes"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
