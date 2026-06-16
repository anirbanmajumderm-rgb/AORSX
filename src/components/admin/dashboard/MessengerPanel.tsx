"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, Search, Send, User, ShieldCheck, Trash2, CheckCircle, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Message {
  id: number;
  sender: string;
  content: string;
  createdAt: string;
}

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

interface ConversationDetail {
  id: string;
  name: string | null;
  email: string | null;
  status: string;
  unread: boolean;
  messages: Message[];
}

export function MessengerPanel({ fullPage = false, initialConversationId }: { fullPage?: boolean; initialConversationId?: string }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (initialConversationId) setSelectedId(initialConversationId);
  }, [initialConversationId]);

  async function loadConversations() {
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("status", filter);
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/messages?${params}`);
      const json = await res.json();
      if (json.success) {
        setConversations(json.data.conversations || []);
      }
    } catch {}
    finally { setLoadingList(false); }
  }

  async function loadConversation(id: string) {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/messages/${id}`);
      const json = await res.json();
      if (json.success) {
        setConversation(json.data);
      }
    } catch { toast.error("Failed to load conversation"); }
    finally { setLoadingDetail(false); }
  }

  useEffect(() => {
    loadConversations();
  }, [filter, search]);

  useEffect(() => {
    if (selectedId) loadConversation(selectedId);
  }, [selectedId]);

  useEffect(() => {
    const id = setInterval(loadConversations, 5000);
    return () => clearInterval(id);
  }, [filter, search]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages]);

  function selectConversation(id: string) {
    setSelectedId(id);
    if (conversation?.unread) {
      fetch(`/api/admin/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unread: false }),
      }).catch(() => {});
    }
  }

  async function handleSendReply() {
    if (!reply.trim() || sending || !selectedId) return;
    setSending(true);
    try {
      const res = await fetch(`/api/admin/messages/${selectedId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: reply.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setReply("");
        setConversation((prev) => prev ? {
          ...prev,
          status: "active",
          messages: [...prev.messages, json.data],
        } : prev);
        loadConversations();
      } else {
        toast.error(json.error || "Failed to send");
      }
    } catch { toast.error("Failed to send"); }
    finally { setSending(false); }
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
        toast.success(status === "resolved" ? "Resolved" : "Reopened");
        setConversation((prev) => prev ? { ...prev, status } : prev);
        loadConversations();
      }
    } catch { toast.error("Failed to update"); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this entire conversation?")) return;
    try {
      const res = await fetch(`/api/admin/messages/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success("Deleted");
        if (selectedId === id) { setSelectedId(null); setConversation(null); }
        loadConversations();
      }
    } catch { toast.error("Failed to delete"); }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  }

  const unreadCount = conversations.filter((c) => c.unread).length;

  return (
    <div className="rounded-2xl bg-white/[0.02] border border-white/[0.04] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-neon-orange/20 to-neon-cyan/20">
            <MessageCircle size={16} className="text-neon-cyan" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white/80">Messenger</h3>
            <p className="text-[11px] text-white/30">{unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {["all", "active", "resolved"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all capitalize",
                filter === f
                  ? "bg-neon-cyan/10 text-neon-cyan"
                  : "text-white/30 hover:text-white/60"
              )}
            >{f}</button>
          ))}
        </div>
      </div>

      <div className="flex" style={{ height: fullPage ? "calc(100vh - 180px)" : "480px" }}>
        {/* Conversation List */}
        <div className="w-72 shrink-0 border-r border-white/[0.04] flex flex-col">
          <div className="p-3 border-b border-white/[0.04]">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full h-9 pl-9 pr-3 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30 placeholder-white/20"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loadingList ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={20} className="animate-spin text-white/20" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <MessageCircle size={24} className="text-white/10 mb-2" />
                <p className="text-xs text-white/20">No conversations</p>
              </div>
            ) : (
              <div className="py-1">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv.id)}
                    className={cn(
                      "w-full text-left px-4 py-3 transition-all hover:bg-white/[0.02] border-l-2",
                      selectedId === conv.id
                        ? "border-l-neon-cyan bg-white/[0.02]"
                        : "border-l-transparent",
                      conv.unread ? "bg-white/[0.01]" : ""
                    )}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={cn(
                        "text-sm truncate flex-1",
                        conv.unread ? "text-white font-medium" : "text-white/60"
                      )}>
                        {conv.name || "Anonymous"}
                      </span>
                      {conv.unread && <span className="w-2 h-2 rounded-full bg-neon-cyan shrink-0" />}
                    </div>
                    {conv.email && (
                      <p className="text-[11px] text-white/30 truncate mb-0.5">{conv.email}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <p className="text-[11px] text-white/25 truncate flex-1">
                        {conv.lastMessage || "No messages"}
                      </p>
                      <span className="text-[10px] text-white/15 shrink-0">
                        {new Date(conv.lastMessageAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Chat Panel */}
        <div className="flex-1 flex flex-col">
          {!selectedId || !conversation ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle size={40} className="text-white/[0.04] mx-auto mb-3" />
                <p className="text-sm text-white/20">Select a conversation to start chatting</p>
              </div>
            </div>
          ) : loadingDetail ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 size={24} className="animate-spin text-white/20" />
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 px-5 py-3 border-b border-white/[0.04] shrink-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/80 truncate">
                    {conversation.name || "Anonymous"}
                  </p>
                  {conversation.email && (
                    <p className="text-[11px] text-white/30 truncate">{conversation.email}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span className={cn(
                    "text-[10px] font-medium px-2 py-0.5 rounded-full",
                    conversation.status === "resolved"
                      ? "bg-white/5 text-white/30"
                      : "bg-green-500/10 text-green-400"
                  )}>
                    {conversation.status}
                  </span>
                  <button
                    onClick={() => handleStatusChange(conversation.id, conversation.status === "resolved" ? "active" : "resolved")}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-white/20 hover:text-green-400 hover:bg-white/5 transition-all"
                    title={conversation.status === "resolved" ? "Reopen" : "Resolve"}
                  >
                    <CheckCircle size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(conversation.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-white/20 hover:text-red-400 hover:bg-white/5 transition-all"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                  <button
                    onClick={() => { setSelectedId(null); setConversation(null); }}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-white/20 hover:text-white/60 hover:bg-white/5 transition-all lg:hidden"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {conversation.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn("flex", msg.sender === "visitor" ? "justify-end" : "justify-start")}
                  >
                    <div className="flex items-start gap-2 max-w-[80%]">
                      {(msg.sender === "admin" || msg.sender === "ai") && (
                        <div className="flex flex-col items-center shrink-0 mt-1">
                          <div className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-full",
                            msg.sender === "ai"
                              ? "bg-purple-500/15"
                              : "bg-gradient-to-br from-neon-cyan/20 to-neon-orange/20"
                          )}>
                            {msg.sender === "ai" ? (
                              <span className="text-[7px] font-bold text-purple-400">AI</span>
                            ) : (
                              <ShieldCheck size={12} className="text-neon-cyan" />
                            )}
                          </div>
                          {msg.sender === "ai" && (
                            <span className="text-[7px] text-purple-400/60 mt-0.5 font-medium">AI</span>
                          )}
                        </div>
                      )}
                      <div className={cn(
                        "rounded-2xl px-4 py-2.5",
                        msg.sender === "visitor"
                          ? "bg-gradient-to-r from-neon-orange to-neon-cyan text-black rounded-br-md"
                          : msg.sender === "ai"
                          ? "bg-purple-500/10 text-white border border-purple-500/20 rounded-bl-md"
                          : "bg-white/10 text-white rounded-bl-md"
                      )}>
                        <div className="flex items-center gap-2">
                          <p className="text-sm whitespace-pre-wrap break-words flex-1">{msg.content}</p>
                          {msg.sender === "ai" && (
                            <span className="text-[9px] font-semibold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded shrink-0">AI</span>
                          )}
                        </div>
                        <p className={cn(
                          "text-[10px] mt-1",
                          msg.sender === "visitor" ? "text-black/50" : "text-white/30"
                        )}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      {msg.sender === "visitor" && (
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 mt-1">
                          <User size={12} className="text-white/50" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Input */}
              <div className="border-t border-white/[0.04] px-5 py-3 shrink-0">
                <div className="flex items-end gap-2">
                  <input
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your reply..."
                    className="flex-1 h-10 px-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white/80 outline-none focus:border-neon-cyan/30 placeholder-white/20"
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={!reply.trim() || sending}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-neon-orange to-neon-cyan text-black disabled:opacity-30 hover:shadow-[0_0_20px_rgba(255,107,0,0.3)] transition-all"
                  >
                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
