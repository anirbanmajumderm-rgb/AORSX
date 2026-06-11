"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Send, User, Bot, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";

interface Message {
  id: number;
  role: string;
  content: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  clientName: string | null;
  clientEmail: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function ConversationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  async function loadConversation() {
    try {
      const res = await fetch(`/api/admin/conversations/${params.id}`);
      const json = await res.json();
      if (json.success) {
        setConversation(json.data.conversation);
        setMessages(json.data.messages || []);
      } else {
        toast.error("Conversation not found");
        router.push("/admin/ai/conversations");
      }
    } catch { toast.error("Failed to load conversation"); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (sessionStatus === "authenticated") loadConversation();
  }, [sessionStatus]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleReply() {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/admin/conversations/${params.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyText.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        setMessages((prev) => [...prev, json.data]);
        setReplyText("");
        toast.success("Reply sent");
      } else throw new Error(json.error);
    } catch { toast.error("Failed to send reply"); }
    finally { setSending(false); }
  }

  async function handleStatusChange(status: string) {
    try {
      const res = await fetch(`/api/admin/conversations/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (json.success) {
        setConversation((prev) => prev ? { ...prev, status } : prev);
        toast.success(`Status: ${status}`);
      } else throw new Error(json.error);
    } catch { toast.error("Failed to update status"); }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!conversation) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={() => router.push("/admin/ai/conversations")}
        className="flex items-center gap-2 text-sm text-white/40 hover:text-white/60 mb-6 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to conversations
      </button>

      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl font-bold text-white/90">
            {conversation.clientName || "Anonymous"}
          </h1>
          {conversation.clientEmail && (
            <p className="text-sm text-white/30 mt-1">{conversation.clientEmail}</p>
          )}
          <p className="text-[10px] text-white/20 mt-1">
            Started {new Date(conversation.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={conversation.status === "active" ? "active" : "inactive"} />
          <div className="flex gap-1">
            <button
              onClick={() => handleStatusChange("active")}
              className={cn(
                "px-2 py-1 rounded text-[10px] font-medium transition-all",
                conversation.status === "active"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-white/[0.04] text-white/30 hover:text-white/50"
              )}
            >
              Active
            </button>
            <button
              onClick={() => handleStatusChange("closed")}
              className={cn(
                "px-2 py-1 rounded text-[10px] font-medium transition-all",
                conversation.status === "closed"
                  ? "bg-white/10 text-white/60"
                  : "bg-white/[0.04] text-white/30 hover:text-white/50"
              )}
            >
              Closed
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
        <div className="h-[400px] overflow-y-auto p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-white/20">No messages yet</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex gap-3",
                  msg.role === "user" ? "justify-start" : msg.role === "admin" ? "justify-end" : "justify-start"
                )}
              >
                <div className={cn("flex gap-3 max-w-[80%]", msg.role === "admin" && "flex-row-reverse")}>
                  <div className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full mt-0.5",
                    msg.role === "user" && "bg-gradient-to-br from-neon-orange/20 to-neon-cyan/20",
                    msg.role === "assistant" && "bg-white/[0.06]",
                    msg.role === "admin" && "bg-emerald-500/20"
                  )}>
                    {msg.role === "admin" ? <ShieldCheck size={14} className="text-emerald-400" />
                      : msg.role === "user" ? <User size={14} className="text-neon-cyan" />
                      : <Bot size={14} className="text-white/40" />}
                  </div>
                  <div>
                    <div className={cn(
                      "px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                      msg.role === "user"
                        ? "bg-white/[0.04] border border-white/[0.06] text-white/70 rounded-bl-md"
                        : msg.role === "admin"
                        ? "bg-emerald-500/15 border border-emerald-500/20 text-emerald-200 rounded-br-md"
                        : "bg-white/[0.04] border border-white/[0.06] text-white/70"
                    )}>
                      {msg.content}
                    </div>
                    <p className="text-[10px] text-white/15 mt-1 px-1">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
              placeholder="Type your reply..."
              className="flex-1 h-10 text-sm"
            />
            <Button onClick={handleReply} disabled={!replyText.trim() || sending} size="sm">
              {sending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send size={14} />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
