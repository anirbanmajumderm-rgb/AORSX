"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, MessageCircle, Loader2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useSiteData } from "@/hooks/useSiteData";
import { useAnalytics } from "@/hooks/useAnalytics";
import { cn } from "@/lib/utils";

function BotAvatar() {
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange to-cyan flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(0,229,255,0.2)]">
      <MessageCircle className="w-4 h-4 text-white" />
    </div>
  );
}

export function AIAssistant() {
  const { lang } = useLanguage();
  const { data } = useSiteData();
  const { trackInteraction } = useAnalytics();
  const [isOpen, setIsOpen] = useState(false);
  const aiEnabled = data?.featureFlags?.ai_chatbot !== false;
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<
    { id: number; text: string; sender: "ai" | "user" }[]
  >([]);
  const [inputValue, setInputValue] = useState("");
  const [kbOffset, setKbOffset] = useState(0);
  const conversationIdRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      setMessages([
        { id: 1, text: lang === "bn" ? "হ্যালো! আমি সহায়ক। কীভাবে সাহায্য করতে পারি?" : "Hello! I'm the assistant. How can I help you?", sender: "ai" },
        { id: 2, text: lang === "bn" ? "আমাদের পরিষেবা, প্রকল্প বা অন্য কিছু সম্পর্কে জিজ্ঞাসা করুন।" : "Ask about our services, projects, or anything else!", sender: "ai" },
      ]);
    }
  }, [lang]);

  useEffect(() => {
    if (!window.visualViewport) return;
    const handler = () => {
      const vv = window.visualViewport!;
      const windowHeight = window.innerHeight;
      const diff = windowHeight - vv.height;
      if (diff > 80) {
        setKbOffset(diff + 16);
      } else {
        setKbOffset(0);
      }
    };
    window.visualViewport.addEventListener("resize", handler);
    window.visualViewport.addEventListener("scroll", handler);
    return () => {
      window.visualViewport?.removeEventListener("resize", handler);
      window.visualViewport?.removeEventListener("scroll", handler);
    };
  }, []);

  const handleToggleOpen = useCallback(() => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) {
      timeoutRef.current = setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || isTyping) return;

    const currentInput = inputValue.trim();
    const tempId = Date.now();

    setMessages((prev) => [...prev, { id: tempId, text: currentInput, sender: "user" }]);
    setInputValue("");
    trackInteraction("chat", currentInput.slice(0, 100));
    setIsTyping(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentInput, lang, conversationId: conversationIdRef.current }),
      });
      const json = await res.json();
      const reply = json?.data?.response || (lang === "bn" ? "আপনার বার্তার জন্য ধন্যবাদ। আমাদের টিম শীঘ্রই যোগাযোগ করবে।" : "Thank you for your message. Our team will contact you shortly.");
      if (json?.data?.conversationId) {
        conversationIdRef.current = json.data.conversationId;
      }
      setMessages((prev) => {
        const exists = prev.some(m => m.id === tempId + 1);
        if (exists) return prev;
        return [...prev, { id: tempId + 1, text: reply, sender: "ai" }];
      });
    } catch {
      setMessages((prev) => [...prev, {
        id: tempId + 2,
        text: lang === "bn" ? "সংযোগ করতে সমস্যা হচ্ছে। দয়া করে পরে আবার চেষ্টা করুন।" : "Connection issue. Please try again later.",
        sender: "ai",
      }]);
    } finally {
      setIsTyping(false);
    }
  }, [inputValue, lang, isTyping, trackInteraction]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const chatWidth = "min(88vw, 420px)";
  const chatHeight = "clamp(300px, 58dvh, 650px)";

  if (!aiEnabled) return null;

  return (
    <div
      className="fixed z-[9999]"
      style={{
        right: "16px",
        bottom: kbOffset > 0
          ? `calc(16px + ${kbOffset}px)`
          : "calc(16px + env(safe-area-inset-bottom, 0px))",
        transition: "bottom 0.15s ease-out",
      }}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={chatRef}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-20 right-0"
            style={{
              width: chatWidth,
              height: chatHeight,
              maxHeight: "65dvh",
            }}
          >
            <div className="relative h-full flex flex-col min-h-0">
              <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-orange/40 via-cyan/40 to-cyan/40 opacity-40 blur-sm pointer-events-none" />
              <div className="relative rounded-2xl bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/10 overflow-hidden shadow-[0_0_60px_rgba(0,229,255,0.08)] flex flex-col min-h-0">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/[0.02] shrink-0">
                  <div className="flex items-center gap-3">
                    <BotAvatar />
                    <div>
                      <p className="text-sm font-semibold text-main-text">
                        {lang === "bn" ? "সহায়ক" : "Assistant"}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan" />
                        </span>
                        <span className="text-[10px] text-cyan font-medium">
                          {lang === "bn" ? "অনলাইন" : "Online"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4 text-secondary-text" />
                  </button>
                </div>

                <div
                  className="flex-1 overflow-y-auto px-5 py-4 space-y-3 min-h-0 overscroll-contain"
                  style={{ WebkitOverflowScrolling: "touch" }}
                >
                  {messages.map((msg, i) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: Math.min(i * 0.03, 0.3) }}
                      className={cn("flex gap-2", msg.sender === "user" ? "justify-end" : "justify-start")}
                    >
                      {msg.sender === "ai" && <BotAvatar />}
                      <div
                        className={cn(
                          "max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words",
                          msg.sender === "user"
                            ? "bg-gradient-to-r from-orange to-orange/80 text-white rounded-br-md"
                            : "bg-white/5 border border-white/10 text-secondary-text rounded-bl-md"
                        )}
                      >
                        {msg.text}
                      </div>
                    </motion.div>
                  ))}

                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-2 justify-start"
                    >
                      <BotAvatar />
                      <div className="bg-white/5 border border-white/10 text-secondary-text rounded-2xl rounded-bl-md px-4 py-3">
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-cyan/60 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-1.5 h-1.5 bg-cyan/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-1.5 h-1.5 bg-cyan/60 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-white/10 bg-white/[0.02] shrink-0">
                  <div className="flex items-center gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={lang === "bn" ? "একটি বার্তা লিখুন..." : "Type a message..."}
                      className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-main-text placeholder:text-muted-text/60 focus:outline-none focus:border-cyan/30 focus:ring-1 focus:ring-cyan/20 transition-all duration-300"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!inputValue.trim() || isTyping}
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 shrink-0 cursor-pointer",
                        inputValue.trim() && !isTyping
                          ? "bg-gradient-to-r from-orange to-cyan text-white shadow-[0_0_20px_rgba(255,107,0,0.3)]"
                          : "bg-white/5 border border-white/10 text-muted-text"
                      )}
                      aria-label="Send"
                    >
                      {isTyping ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative">
        <motion.button
          onClick={handleToggleOpen}
          className="relative w-16 h-16 rounded-full flex items-center justify-center cursor-pointer"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-br from-orange via-cyan to-cyan opacity-30 blur-xl"
            animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute inset-2 rounded-full bg-gradient-to-br from-orange via-cyan to-cyan opacity-40 blur-md"
            animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          />
          <motion.div
            className="relative w-14 h-14 rounded-full bg-gradient-to-br from-orange to-cyan flex items-center justify-center shadow-[0_0_40px_rgba(255,107,0,0.3)]"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            {isOpen ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <MessageCircle className="w-6 h-6 text-white" />
            )}
          </motion.div>

          <motion.div
            className="absolute -inset-4 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          >
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full"
                style={{
                  background: i % 2 === 0 ? "#FF6B00" : "#00E5FF",
                  top: "-3px",
                  left: `calc(50% - ${(i % 2 === 0 ? 3 : -3)}px)`,
                  boxShadow: `0 0 6px ${i % 2 === 0 ? "rgba(255,107,0,0.8)" : "rgba(0,229,255,0.8)"}`,
                }}
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4 }}
              />
            ))}
          </motion.div>

          <motion.div
            className="absolute -inset-3 rounded-full border border-orange/20"
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          >
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  background: i % 2 === 0 ? "#00E5FF" : "#FF6B00",
                  top: "-4px",
                  left: `calc(50% - ${i * 6}px)`,
                  boxShadow: `0 0 8px ${i % 2 === 0 ? "rgba(0,229,255,0.6)" : "rgba(255,107,0,0.6)"}`,
                }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.6 }}
              />
            ))}
          </motion.div>

          <motion.div
            className="absolute inset-0 rounded-full border border-cyan/30"
            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeOut" }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border border-orange/20"
            animate={{ scale: [1, 1.8, 1], opacity: [0.2, 0, 0.2] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeOut", delay: 1 }}
          />
        </motion.button>
      </div>
    </div>
  );
}
