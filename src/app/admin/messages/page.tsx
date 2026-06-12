"use client";

import { useState, useEffect, startTransition } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { MessageSquare, Search as SearchIcon, User, Trash2, CheckCircle, Mail, MailOpen } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { EmptyState } from "@/components/admin/shared/EmptyState";

export default function MessagesPage() {
  const { status: sessionStatus } = useSession();
  const router = useRouter();
  const [conversations, setConversations] = useState<any[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  async function loadConversations() {
    try {
      const params = new URLSearchParams();
      if (activeFilter !== "all") params.set("status", activeFilter);
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/conversations?${params}`);
      const json = await res.json();
      if (json.success) {
        setConversations(json.data.conversations || []);
        setCounts(json.data.counts || {});
      }
    } catch { toast.error("Failed to load conversations"); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      setLoading(true);
      startTransition(() => loadConversations());
    }
  }, [sessionStatus, activeFilter]);

  useEffect(() => {
    if (!search) return;
    const timer = setTimeout(() => {
      setLoading(true);
      loadConversations();
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (!confirm("Delete this conversation?")) return;
    try {
      const res = await fetch(`/api/admin/conversations/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success("Conversation deleted");
        loadConversations();
      }
    } catch { toast.error("Failed to delete"); }
  }

  async function handleToggleUnread(e: React.MouseEvent, id: string, current: boolean) {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/admin/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unread: !current }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(current ? "Marked as read" : "Marked as unread");
        loadConversations();
      }
    } catch { toast.error("Failed to update"); }
  }

  async function handleToggleResolved(e: React.MouseEvent, id: string, currentStatus: string) {
    e.stopPropagation();
    const newStatus = currentStatus === "resolved" ? "active" : "resolved";
    try {
      const res = await fetch(`/api/admin/conversations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(newStatus === "resolved" ? "Marked as resolved" : "Reopened");
        loadConversations();
      }
    } catch { toast.error("Failed to update"); }
  }

  const filters = [
    { key: "all", label: "All" },
    { key: "unread", label: "Unread" },
    { key: "active", label: "Active" },
    { key: "resolved", label: "Resolved" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <PageHeader title="Messages" description="View and manage all visitor conversations">
        <div className="relative">
          <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm w-56"
          />
        </div>
      </PageHeader>

      <div className="flex gap-2 mb-6 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setActiveFilter(f.key)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300",
              activeFilter === f.key
                ? "bg-gradient-to-r from-neon-orange/20 to-neon-cyan/20 text-white border border-white/10"
                : "text-white/40 hover:text-white/60 border border-transparent"
            )}
          >
            {f.label}
            <span className="ml-1.5 text-white/20">({counts[f.key] || 0})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
        </div>
      ) : conversations.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No conversations found"
          description={search ? "Try a different search term" : "No visitor conversations yet"}
        />
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className="group w-full p-4 rounded-xl border border-white/[0.04] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.08] transition-all duration-300 cursor-pointer"
              onClick={() => router.push(`/admin/messages/${conv.id}`)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-neon-orange/20 to-neon-cyan/20">
                    <User size={16} className="text-neon-cyan" />
                    {conv.unread && (
                      <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-neon-cyan rounded-full border-2 border-[#050505]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={cn("text-sm truncate", conv.unread ? "font-semibold text-white" : "font-medium text-white/80")}>
                        {conv.clientName || "Anonymous"}
                      </span>
                      <StatusBadge status={conv.status === "resolved" ? "inactive" : conv.status === "active" ? "active" : "inactive"} />
                    </div>
                    {conv.lastMessage && (
                      <p className={cn("text-xs truncate", conv.unread ? "text-white/50" : "text-white/30")}>
                        <span className="capitalize">{conv.lastMessage.role}:</span> {conv.lastMessage.content}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-[10px] text-white/15">
                        {new Date(conv.updatedAt).toLocaleDateString()} {new Date(conv.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      {conv.messageCount > 0 && (
                        <span className="text-[10px] text-white/20">{conv.messageCount} messages</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleToggleUnread(e, conv.id, conv.unread)}
                    className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/[0.06] text-white/20 hover:text-neon-cyan transition-all"
                    title={conv.unread ? "Mark as read" : "Mark as unread"}
                  >
                    {conv.unread ? <MailOpen size={14} /> : <Mail size={14} />}
                  </button>
                  <button
                    onClick={(e) => handleToggleResolved(e, conv.id, conv.status)}
                    className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-white/[0.06] text-white/20 hover:text-emerald-400 transition-all"
                    title={conv.status === "resolved" ? "Reopen" : "Mark resolved"}
                  >
                    <CheckCircle size={14} />
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, conv.id)}
                    className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-all"
                    title="Delete conversation"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
