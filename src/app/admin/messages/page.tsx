"use client";

import { useState, useEffect, startTransition } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { MessageCircle, Search as SearchIcon, Trash2, CheckCircle, Mail, MailOpen } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/shared/PageHeader";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { EmptyState } from "@/components/admin/shared/EmptyState";

interface Conversation {
  id: string;
  name: string | null;
  email: string | null;
  status: string;
  unread: boolean;
  lastMessage: string | null;
  lastMessageAt: string;
  createdAt: string;
}

export default function AdminMessagesPage() {
  const { status: sessionStatus } = useSession();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  async function loadConversations() {
    try {
      const params = new URLSearchParams();
      if (activeFilter !== "all") params.set("status", activeFilter);
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/messages?${params}`);
      const json = await res.json();
      if (json.success) {
        setConversations(json.data.conversations || []);
        setCounts(json.data.counts || {});
      }
    } catch { toast.error("Failed to load conversations"); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (sessionStatus === "authenticated") loadConversations();
  }, [sessionStatus, activeFilter]);

  useEffect(() => {
    const timer = setInterval(loadConversations, 5000);
    return () => clearInterval(timer);
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this conversation?")) return;
    try {
      const res = await fetch(`/api/admin/messages/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success("Conversation deleted");
        loadConversations();
      }
    } catch { toast.error("Failed to delete"); }
  }

  async function handleStatusChange(id: string, status: string) {
    try {
      const res = await fetch(`/api/admin/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(status === "resolved" ? "Marked as resolved" : "Reopened");
        loadConversations();
      }
    } catch { toast.error("Failed to update"); }
  }

  async function handleToggleRead(id: string, current: boolean) {
    try {
      const res = await fetch(`/api/admin/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unread: !current }),
      });
      const json = await res.json();
      if (json.success) {
        loadConversations();
      }
    } catch { toast.error("Failed to update"); }
  }

  if (sessionStatus === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neon-cyan border-t-transparent" />
      </div>
    );
  }

  const filters = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "resolved", label: "Resolved" },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Messages"
        description="View and manage all visitor conversations"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40">
            {counts.unread || 0} unread
          </span>
        </div>
      </PageHeader>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                activeFilter === f.key
                  ? "bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20"
                  : "text-white/40 hover:text-white hover:bg-white/5 border border-transparent"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="pl-9 bg-white/5 border-white/10 text-white placeholder-white/30"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-neon-cyan border-t-transparent" />
        </div>
      ) : conversations.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="No conversations found"
          description={search ? "Try a different search term" : "No visitor conversations yet"}
        />
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={cn(
                "group relative flex items-start gap-4 rounded-2xl border p-4 transition-all cursor-pointer hover:bg-white/[0.02]",
                conv.unread
                  ? "border-neon-cyan/20 bg-neon-cyan/[0.02]"
                  : "border-white/[0.06]"
              )}
              onClick={() => router.push(`/admin/messages/${conv.id}`)}
            >
              <div className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                conv.unread
                  ? "bg-gradient-to-br from-neon-orange/20 to-neon-cyan/20"
                  : "bg-white/5"
              )}>
                <MessageCircle className={cn(
                  "h-5 w-5",
                  conv.unread ? "text-neon-cyan" : "text-white/30"
                )} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn(
                    "text-sm font-medium truncate",
                    conv.unread ? "text-white" : "text-white/70"
                  )}>
                    {conv.name || "Anonymous"}
                  </span>
                  {conv.unread && (
                    <span className="h-2 w-2 rounded-full bg-neon-cyan shrink-0" />
                  )}
                  <StatusBadge status={conv.status === "resolved" ? "inactive" : "active"} />
                </div>
                {conv.email && (
                  <p className="text-xs text-white/30 mb-1">{conv.email}</p>
                )}
                <p className="text-sm text-white/40 truncate">
                  {conv.lastMessage || "No messages yet"}
                </p>
                <p className="text-[11px] text-white/20 mt-1">
                  {new Date(conv.lastMessageAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); handleToggleRead(conv.id, conv.unread); }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-white/20 hover:text-neon-cyan hover:bg-white/5 transition-all"
                  title={conv.unread ? "Mark as read" : "Mark as unread"}
                >
                  {conv.unread ? <MailOpen className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleStatusChange(conv.id, conv.status === "resolved" ? "active" : "resolved"); }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-white/20 hover:text-green-400 hover:bg-white/5 transition-all"
                  title={conv.status === "resolved" ? "Reopen" : "Resolve"}
                >
                  <CheckCircle className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(conv.id); }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-white/20 hover:text-red-400 hover:bg-white/5 transition-all"
                  title="Delete conversation"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
