"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Send, ArrowLeft, Loader2, Bot } from "lucide-react";
import { useVisualViewport, useKeyboardAwareScroll } from "@/lib/use-visual-viewport";

function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("visitor_id");
  if (!id) {
    id = "v_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10);
    localStorage.setItem("visitor_id", id);
  }
  return id;
}

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
  status: string;
  createdAt: string;
  messages: Message[];
}

export default function MessagesPage() {
  const router = useRouter();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [showForm, setShowForm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const visitorId = getVisitorId();

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, []);

  const vv = useVisualViewport();
  useKeyboardAwareScroll(vv.isKeyboardOpen, scrollToBottom);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedName = localStorage.getItem("visitor_name");
    const savedEmail = localStorage.getItem("visitor_email");
    if (savedName) setName(savedName);
    if (savedEmail) setEmail(savedEmail);
  }, []);

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch(`/api/messages?visitorId=${visitorId}`);
        const json = await res.json();
        if (json.success && json.data) {
          setConversation(json.data);
          setMessages(json.data.messages || []);
        }
      } catch {} finally {
        setLoading(false);
      }
    }
    if (visitorId) init();
  }, [visitorId]);

  const startPolling = useCallback((convId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/messages/${convId}`);
        const json = await res.json();
        if (json.success && json.data) {
          setMessages(json.data);
        }
      } catch {}
    }, 3000);
  }, []);

  useEffect(() => {
    if (conversation?.id) {
      startPolling(conversation.id);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [conversation?.id, startPolling]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!window.visualViewport || !containerRef.current) return;

    const updateContainer = () => {
      if (!containerRef.current || !window.visualViewport) return;
      containerRef.current.style.height = `${window.visualViewport.height}px`;
    };

    window.visualViewport.addEventListener("resize", updateContainer);
    window.visualViewport.addEventListener("scroll", updateContainer);
    updateContainer();

    return () => {
      window.visualViewport?.removeEventListener("resize", updateContainer);
      window.visualViewport?.removeEventListener("scroll", updateContainer);
    };
  }, []);

  async function handleStart() {
    if (!name.trim()) return;
    localStorage.setItem("visitor_name", name.trim());
    if (email.trim()) localStorage.setItem("visitor_email", email.trim());
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          visitorId,
          name: name.trim(),
          email: email.trim() || null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setConversation(json.data);
        setMessages(json.data.messages || []);
        setShowForm(false);
      }
    } catch {}
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || !conversation?.id || sending) return;
    setSending(true);
    setInput("");
    try {
      const res = await fetch(`/api/messages/${conversation.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      const json = await res.json();
      if (json.success) {
        setMessages((prev) => {
          const updated = [...prev, json.data];
          if (json.autoReply) {
            updated.push(json.autoReply);
          }
          return updated;
        });
      }
    } catch {} finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const containerStyle: React.CSSProperties = {
    height: vv.height > 0 ? `${vv.height}px` : "100dvh",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-[#050505] w-full md:w-[500px] lg:w-[450px] mx-auto overflow-x-hidden min-h-dvh" style={containerStyle}>
        <Loader2 className="h-8 w-8 animate-spin text-neon-cyan" />
      </div>
    );
  }

  if (!conversation && !showForm) {
    return (
      <div className="flex flex-col bg-[#050505] w-full md:w-[500px] lg:w-[450px] mx-auto overflow-x-hidden" style={containerStyle}>
        <header className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3 shrink-0">
          <button onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-neon-orange/20 to-neon-cyan/20">
            <Bot className="h-4 w-4 text-neon-cyan" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-white">AI Assistant</h1>
            <p className="text-xs text-green-400">Online</p>
          </div>
        </header>
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-neon-orange/20 to-neon-cyan/20">
            <Bot className="h-7 w-7 text-neon-cyan" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-white">Need help?</h2>
          <p className="mb-6 max-w-sm text-sm text-white/50">Our AI assistant is here to help. Start a conversation and we&apos;ll get back to you.</p>
          <button onClick={() => setShowForm(true)} className="rounded-xl bg-gradient-to-r from-neon-orange to-neon-cyan px-6 py-3 text-sm font-semibold text-black transition-all hover:shadow-[0_0_30px_rgba(255,107,0,0.3)]">
            Start Conversation
          </button>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="flex flex-col bg-[#050505] w-full md:w-[500px] lg:w-[450px] mx-auto overflow-x-hidden" style={containerStyle}>
        <header className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3 shrink-0">
          <button onClick={() => setShowForm(false)} className="flex h-9 w-9 items-center justify-center rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-neon-orange/20 to-neon-cyan/20">
            <Bot className="h-4 w-4 text-neon-cyan" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-white">New Conversation</h1>
          </div>
        </header>
        <div className="flex flex-1 flex-col justify-center px-6">
          <div className="mx-auto w-full max-w-md space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/60">Your Name *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/20 transition-all"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-white/60">Email (optional)</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                type="email"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/20 transition-all"
              />
            </div>
            <button
              onClick={handleStart}
              disabled={!name.trim()}
              className="w-full rounded-xl bg-gradient-to-r from-neon-orange to-neon-cyan px-6 py-3 text-sm font-semibold text-black transition-all hover:shadow-[0_0_30px_rgba(255,107,0,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Conversation
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col bg-[#050505] w-full md:w-[500px] lg:w-[450px] mx-auto overflow-x-hidden" style={containerStyle}>
      <header className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3 shrink-0">
        <button onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-neon-orange/20 to-neon-cyan/20">
          <Bot className="h-4 w-4 text-neon-cyan" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-white truncate">AI Assistant</h1>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
            <p className="text-xs text-green-400">Online</p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin" style={{ overscrollBehavior: "contain" }}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === "visitor" ? "justify-end" : "justify-start"}`}>
            {msg.sender !== "visitor" && (
              <div className="flex flex-col items-center mr-2 mt-1 shrink-0">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-neon-orange/20 to-neon-cyan/20">
                  {msg.sender === "ai" ? (
                    <span className="text-[8px] font-bold text-neon-cyan">AI</span>
                  ) : (
                    <Bot className="h-3.5 w-3.5 text-neon-cyan" />
                  )}
                </div>
                {msg.sender === "ai" && (
                  <span className="text-[8px] text-neon-cyan/60 mt-0.5 font-medium">AI</span>
                )}
              </div>
            )}
            <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-2.5 ${
              msg.sender === "visitor"
                ? "bg-gradient-to-r from-neon-orange to-neon-cyan text-black rounded-br-md"
                : msg.sender === "ai"
                ? "bg-purple-500/10 text-white border border-purple-500/20 rounded-bl-md"
                : "bg-white/10 text-white rounded-bl-md"
            }`}>
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm whitespace-pre-wrap break-words flex-1">{msg.content}</p>
                {msg.sender === "ai" && (
                  <span className="text-[9px] font-semibold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded shrink-0">AI</span>
                )}
              </div>
              <p className={`text-[10px] mt-1 ${msg.sender === "visitor" ? "text-black/50" : "text-white/30"}`}>
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-white/[0.06] px-4 py-3 shrink-0" id="message-input-area">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/20 transition-all max-h-32 scrollbar-thin"
            style={{ minHeight: "44px" }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-neon-orange to-neon-cyan text-black transition-all hover:shadow-[0_0_20px_rgba(255,107,0,0.3)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
