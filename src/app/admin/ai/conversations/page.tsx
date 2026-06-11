"use client";

import { useState, useEffect, startTransition } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { MessageSquare, Search as SearchIcon, User } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { EmptyState } from "@/components/admin/shared/EmptyState";

export default function ConversationsPage() {
  const { status: sessionStatus } = useSession();
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  async function loadConversations() {
    try {
      const params = activeFilter !== "all" ? `?status=${activeFilter}` : "";
      const res = await fetch(`/api/admin/conversations${params}`);
      const json = await res.json();
      if (json.success) {
        setConversations(json.data.conversations || []);
        const countMap: Record<string, number> = { all: (json.data.conversations || []).length };
        (json.data.counts || []).forEach((c: any) => { countMap[c.status] = c._count.id; });
        setCounts(countMap);
      }
    } catch { toast.error("Failed to load conversations"); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (sessionStatus === "authenticated") startTransition(() => loadConversations());
  }, [sessionStatus, activeFilter]);

  const filtered = conversations.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.clientName?.toLowerCase().includes(q) || c.clientEmail?.toLowerCase().includes(q) || c.id?.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <PageHeader title="Conversations" description="View and manage client chat conversations">
        <div className="flex items-center gap-2">
          <div className="relative">
            <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm w-48"
            />
          </div>
        </div>
      </PageHeader>

      <div className="flex gap-2 mb-6 flex-wrap">
        {["all", "active", "closed"].map((status) => (
          <button
            key={status}
            onClick={() => setActiveFilter(status)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300",
              activeFilter === status
                ? "bg-gradient-to-r from-neon-orange/20 to-neon-cyan/20 text-white border border-white/10"
                : "text-white/40 hover:text-white/60 border border-transparent"
            )}
          >
            {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
            <span className="ml-1.5 text-white/20">({counts[status] || 0})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No conversations found"
          description={search ? "Try a different search term" : "No client conversations yet"}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((conv) => (
            <button
              key={conv.id}
              onClick={() => router.push(`/admin/ai/conversations/${conv.id}`)}
              className="w-full text-left p-4 rounded-xl border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-300 group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-neon-orange/20 to-neon-cyan/20">
                    <User size={16} className="text-neon-cyan" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-white/80 truncate">
                        {conv.clientName || "Anonymous"}
                      </span>
                      <StatusBadge status={conv.status === "active" ? "active" : "inactive"} />
                    </div>
                    {conv.lastMessage && (
                      <p className="text-xs text-white/30 truncate">
                        <span className="capitalize">{conv.lastMessage.role}:</span> {conv.lastMessage.content}
                      </p>
                    )}
                    <p className="text-[10px] text-white/15 mt-1">
                      {new Date(conv.updatedAt).toLocaleDateString()} {new Date(conv.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
                {conv.clientEmail && (
                  <span className="text-[10px] text-white/20 shrink-0 hidden sm:block">{conv.clientEmail}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
