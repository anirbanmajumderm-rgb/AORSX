"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, User, Bot, Loader2 } from "lucide-react";

interface Message {
  id: number;
  sender: string;
  content: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  visitorId: string;
  name: string | null;
  email: string | null;
}

function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("chat-visitor-id");
  if (!id) {
    id = "visitor_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem("chat-visitor-id", id);
  }
  return id;
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [started, setStarted] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const visitorId = getVisitorId();

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, []);

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!open || !conversation) return;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/messages/${conversation.id}`);
        const json = await res.json();
        if (json.success) setMessages(json.data);
      } catch {}
    }, 3000);
    return () => clearInterval(timer);
  }, [open, conversation]);

  async function handleStart() {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const convRes = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId, name: name.trim(), email: email.trim() || undefined }),
      });
      const convJson = await convRes.json();
      if (convJson.success) {
        setConversation(convJson.data);
        const msgRes = await fetch(`/api/messages/${convJson.data.id}`);
        const msgJson = await msgRes.json();
        if (msgJson.success) setMessages(msgJson.data || []);
        setStarted(true);
      }
    } catch {} finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    if (!input.trim() || sending || !conversation) return;
    setSending(true);
    const content = input.trim();
    setInput("");
    try {
      const res = await fetch(`/api/messages/${conversation.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const json = await res.json();
      if (json.success) {
        setMessages((prev) => {
          const next = [...prev, json.data];
          if (json.autoReply && !next.some((m) => m.id === (json.autoReply as Message).id)) {
            next.push(json.autoReply as Message);
          }
          return next;
        });
      }
    } catch {} finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (started) handleSend();
      else handleStart();
    }
  }

  return (
    <>
      {/* Chat bubble button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-[9998] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-neon-orange to-neon-cyan text-black shadow-[0_0_30px_rgba(255,107,0,0.3)] hover:shadow-[0_0_40px_rgba(255,107,0,0.5)] transition-all duration-300 hover:scale-105 active:scale-95"
        aria-label="Open chat"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed bottom-5 right-5 z-[9999] flex flex-col w-[380px] max-w-[calc(100vw-40px)] h-[600px] max-h-[calc(100vh-120px)] rounded-2xl border border-white/[0.08] bg-[#0a0a0a] shadow-[0_0_60px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] bg-gradient-to-r from-[#0a0a0a] to-[#111] shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-neon-orange/20 to-neon-cyan/20">
                <Bot className="h-5 w-5 text-neon-cyan" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white">AORNX Chat</h3>
                <p className="text-[10px] text-white/40">We typically reply in minutes</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {!started ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-neon-orange/20 to-neon-cyan/20 mb-4">
                    <MessageCircle className="h-7 w-7 text-neon-cyan" />
                  </div>
                  <h4 className="text-base font-semibold text-white mb-1">Hi there!</h4>
                  <p className="text-xs text-white/50 mb-6 max-w-xs">
                    Send us a message and we'll get back to you as soon as possible.
                  </p>
                  <input
                    ref={inputRef}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Your name"
                    className="w-full mb-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-neon-cyan/50 transition-all"
                  />
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Your email (optional)"
                    className="w-full mb-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-neon-cyan/50 transition-all"
                  />
                  <button
                    onClick={handleStart}
                    disabled={loading || !name.trim()}
                    className="w-full rounded-xl bg-gradient-to-r from-neon-orange to-neon-cyan text-black font-semibold py-2.5 text-sm hover:shadow-[0_0_20px_rgba(255,107,0,0.3)] transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    ) : (
                      "Start Chat"
                    )}
                  </button>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <Bot className="h-10 w-10 text-neon-cyan/30 mb-3" />
                  <p className="text-sm text-white/50">Send a message to start the conversation!</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === "visitor" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`flex items-start gap-2 max-w-[85%] ${msg.sender === "visitor" ? "flex-row-reverse" : ""}`}>
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full mt-1 ${
                        msg.sender === "admin" || msg.sender === "ai"
                          ? "bg-gradient-to-br from-neon-cyan/20 to-neon-orange/20"
                          : "bg-white/10"
                      }`}>
                        {msg.sender === "ai" ? (
                          <span className="text-[7px] font-bold text-neon-cyan">AI</span>
                        ) : msg.sender === "admin" ? (
                          <Bot className="h-3.5 w-3.5 text-neon-cyan" />
                        ) : (
                          <User className="h-3.5 w-3.5 text-white/50" />
                        )}
                      </div>
                      <div className={`rounded-2xl px-3.5 py-2 ${
                        msg.sender === "visitor"
                          ? "bg-gradient-to-r from-neon-orange to-neon-cyan text-black rounded-br-md"
                          : msg.sender === "ai"
                          ? "bg-purple-500/10 text-white border border-purple-500/20 rounded-bl-md"
                          : "bg-white/10 text-white rounded-bl-md"
                      }`}>
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${
                          msg.sender === "visitor" ? "text-black/50" : "text-white/30"
                        }`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            {started && (
              <div className="border-t border-white/[0.06] px-4 py-3 shrink-0">
                <div className="flex items-end gap-2">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-neon-cyan/50 transition-all"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || sending}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-neon-orange to-neon-cyan text-black disabled:opacity-50 transition-all"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
