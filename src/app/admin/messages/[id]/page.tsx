"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Send, User, ShieldCheck, Trash2, CheckCircle, Mail } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";

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
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

export default function ConversationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  };

  async function loadConversation() {
    try {
      const res = await fetch(`/api/admin/messages/${params.id}`);
      const json = await res.json();
      if (json.success) {
        setConversation(json.data);
        setMessages(json.data.messages || []);
        if (json.data.unread) {
          fetch(`/api/admin/messages/${params.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ unread: false }),
          }).catch(() => {});
        }
      } else {
        toast.error("Conversation not found");
        router.push("/admin/messages");
      }
    } catch { toast.error("Failed to load conversation"); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (sessionStatus === "authenticated") loadConversation();
  }, [sessionStatus, params.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const timer = setInterval(async () => {
      if (!params.id) return;
      try {
        const res = await fetch(`/api/admin/messages/${params.id}`);
        const json = await res.json();
        if (json.success) {
          setMessages(json.data.messages || []);
        }
      } catch {}
    }, 3000);
    return () => clearInterval(timer);
  }, [params.id]);

  async function handleSendReply() {
    if (!reply.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/admin/messages/${params.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: reply.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setReply("");
        setMessages((prev) => [...prev, json.data]);
        setConversation((prev) => prev ? { ...prev, status: "active" } : prev);
      } else {
        toast.error(json.error || "Failed to send");
      }
    } catch { toast.error("Failed to send"); }
    finally { setSending(false); }
  }

  async function handleStatusChange(status: string) {
    try {
      const res = await fetch(`/api/admin/messages/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(status === "resolved" ? "Resolved" : "Reopened");
        setConversation((prev) => prev ? { ...prev, status } : prev);
      }
    } catch { toast.error("Failed to update"); }
  }

  async function handleToggleRead() {
    if (!conversation) return;
    try {
      const res = await fetch(`/api/admin/messages/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unread: !conversation.unread }),
      });
      const json = await res.json();
      if (json.success) {
        setConversation((prev) => prev ? { ...prev, unread: !prev.unread } : prev);
        toast.success(conversation.unread ? "Marked as read" : "Marked as unread");
      }
    } catch { toast.error("Failed to update"); }
  }

  async function handleDelete() {
    if (!confirm("Delete this entire conversation?")) return;
    try {
      const res = await fetch(`/api/admin/messages/${params.id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast.success("Conversation deleted");
        router.push("/admin/messages");
      }
    } catch { toast.error("Failed to delete"); }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  }

  if (sessionStatus === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neon-cyan border-t-transparent" />
      </div>
    );
  }

  if (!conversation) return null;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 md:px-6 py-3 shrink-0">
        <button
          onClick={() => router.push("/admin/messages")}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-white truncate">
            {conversation.name || "Anonymous"}
          </h1>
          {conversation.email && (
            <p className="text-xs text-white/40 truncate">{conversation.email}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={conversation.status === "resolved" ? "inactive" : "active"} />
          <button
            onClick={handleToggleRead}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/20 hover:text-neon-cyan hover:bg-white/5 transition-all"
            title={conversation.unread ? "Mark as read" : "Mark as unread"}
          >
            <Mail className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleStatusChange(conversation.status === "resolved" ? "active" : "resolved")}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/20 hover:text-green-400 hover:bg-white/5 transition-all"
            title={conversation.status === "resolved" ? "Reopen" : "Resolve"}
          >
            <CheckCircle className="h-4 w-4" />
          </button>
          <button
            onClick={handleDelete}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/20 hover:text-red-400 hover:bg-white/5 transition-all"
            title="Delete conversation"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex",
              msg.sender === "admin" ? "justify-start" : "justify-end"
            )}
          >
            <div className="flex items-start gap-2 max-w-[85%] md:max-w-[70%]">
              {msg.sender === "admin" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-neon-cyan/20 to-neon-orange/20 mt-1">
                  <ShieldCheck className="h-4 w-4 text-neon-cyan" />
                </div>
              )}
              <div
                className={cn(
                  "rounded-2xl px-4 py-2.5",
                  msg.sender === "admin"
                    ? "bg-white/10 text-white rounded-bl-md"
                    : "bg-gradient-to-r from-neon-orange to-neon-cyan text-black rounded-br-md"
                )}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                <p
                  className={cn(
                    "text-[10px] mt-1",
                    msg.sender === "admin" ? "text-white/30" : "text-black/50"
                  )}
                >
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              {msg.sender === "visitor" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 mt-1">
                  <User className="h-4 w-4 text-white/50" />
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-white/[0.06] px-4 md:px-6 py-3 shrink-0">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your reply..."
              className="bg-white/5 border-white/10 text-white placeholder-white/30"
            />
          </div>
          <Button
            onClick={handleSendReply}
            disabled={!reply.trim() || sending}
            className="h-10 bg-gradient-to-r from-neon-orange to-neon-cyan text-black hover:shadow-[0_0_20px_rgba(255,107,0,0.3)]"
          >
            <Send className="h-4 w-4 mr-1" />
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
