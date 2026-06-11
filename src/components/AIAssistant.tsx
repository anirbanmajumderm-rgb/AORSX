"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Sparkles, Loader2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useSiteData } from "@/hooks/useSiteData";
import { useAnalytics } from "@/hooks/useAnalytics";
import { cn } from "@/lib/utils";

function AIFace({ isListening }: { isListening: boolean }) {
  const [blink, setBlink] = useState(false);
  const [lookDir, setLookDir] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(blinkInterval);
  }, []);

  useEffect(() => {
    if (isListening) {
      const move = setInterval(() => {
        setLookDir({
          x: (Math.random() - 0.5) * 6,
          y: (Math.random() - 0.5) * 4,
        });
      }, 800);
      return () => clearInterval(move);
    } else {
      const idle = setTimeout(() => {
        setLookDir({ x: 0, y: 0 });
      }, 300);
      const wander = setInterval(() => {
        setLookDir({
          x: (Math.random() - 0.5) * 3,
          y: (Math.random() - 0.5) * 2,
        });
      }, 4000);
      return () => {
        clearTimeout(idle);
        clearInterval(wander);
      };
    }
  }, [isListening]);

  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
      <circle cx="24" cy="24" r="22" fill="url(#faceGrad)" opacity="0.3" />
      <defs>
        <radialGradient id="faceGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="20" stroke="url(#eyeRingGrad)" strokeWidth="1.5" opacity="0.6" />
      <defs>
        <linearGradient id="eyeRingGrad" x1="0" y1="0" x2="48" y2="48">
          <stop offset="0%" stopColor="#FF6B00" />
          <stop offset="100%" stopColor="#00E5FF" />
        </linearGradient>
      </defs>
      <g transform={`translate(${lookDir.x * 0.5}, ${lookDir.y * 0.5})`}>
        <ellipse cx="17" cy="22" rx="5" ry={blink ? 0.5 : 5.5} fill="white" opacity="0.9">
          <animate attributeName="ry" values="5.5;5.5;0.5;5.5;5.5" dur="4s" repeatCount="indefinite" keyTimes="0;0.45;0.5;0.55;1" />
        </ellipse>
        <circle cx="17" cy="22" r="2.5" fill="#00E5FF">
          <animate attributeName="r" values="2.5;2.5;2.5;0.5;2.5;2.5" dur="4s" repeatCount="indefinite" keyTimes="0;0.45;0.5;0.52;0.55;1" />
        </circle>
        <circle cx="18" cy="21" r="1" fill="white" opacity="0.8">
          <animate attributeName="r" values="1;1;1;0;1;1" dur="4s" repeatCount="indefinite" keyTimes="0;0.45;0.5;0.52;0.55;1" />
        </circle>
      </g>
      <g transform={`translate(${lookDir.x * 0.5}, ${lookDir.y * 0.5})`}>
        <ellipse cx="31" cy="22" rx="5" ry={blink ? 0.5 : 5.5} fill="white" opacity="0.9">
          <animate attributeName="ry" values="5.5;5.5;0.5;5.5;5.5" dur="4s" repeatCount="indefinite" keyTimes="0;0.45;0.5;0.55;1" />
        </ellipse>
        <circle cx="31" cy="22" r="2.5" fill="#00E5FF">
          <animate attributeName="r" values="2.5;2.5;2.5;0.5;2.5;2.5" dur="4s" repeatCount="indefinite" keyTimes="0;0.45;0.5;0.52;0.55;1" />
        </circle>
        <circle cx="32" cy="21" r="1" fill="white" opacity="0.8">
          <animate attributeName="r" values="1;1;1;0;1;1" dur="4s" repeatCount="indefinite" keyTimes="0;0.45;0.5;0.52;0.55;1" />
        </circle>
      </g>
      <path
        d="M20 30 C22 33, 26 33, 28 30"
        stroke="#00E5FF"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity={isListening ? 0.9 : 0.5}
      >
        <animate attributeName="d" values="M20 30 C22 33, 26 33, 28 30;M20 31 C22 34, 26 34, 28 31;M20 30 C22 33, 26 33, 28 30" dur="2s" repeatCount="indefinite" />
      </path>
      {[0, 60, 120, 180, 240, 300].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        return (
          <circle key={angle} cx={Number((24 + Math.cos(rad) * 24).toFixed(4))} cy={Number((24 + Math.sin(rad) * 24).toFixed(4))} r="1.5" fill={i % 2 === 0 ? "#FF6B00" : "#00E5FF"} opacity={0.6}>
            <animate attributeName="opacity" values="0.2;0.8;0.2" dur={`${2 + (i % 3)}s`} repeatCount="indefinite" />
          </circle>
        );
      })}
    </svg>
  );
}

function FloatingHand({ side, isOpen }: { side: "left" | "right"; isOpen: boolean }) {
  return (
    <motion.div
      className={cn("absolute bottom-0 w-8 h-12 pointer-events-none", side === "left" ? "-left-6" : "-right-6")}
      animate={isOpen ? { y: [0, -8, 0], rotate: side === "left" ? [-5, 5, -5] : [5, -5, 5] } : { y: [0, -4, 0], rotate: side === "left" ? [-10, 10, -10] : [10, -10, 10] }}
      transition={{ duration: isOpen ? 3 : 5, repeat: Infinity, ease: "easeInOut" }}
    >
      <svg width="32" height="48" viewBox="0 0 32 48" fill="none" className={cn("transition-all duration-500", side === "left" ? "rotate-12" : "-rotate-12")}>
        <ellipse cx="16" cy="30" rx="10" ry="14" fill="url(#handGrad)" opacity="0.7" />
        <rect x="8" y="2" width="4" height="18" rx="2" fill="url(#handGrad)" opacity="0.6" />
        <rect x="14" y="0" width="4" height="20" rx="2" fill="url(#handGrad)" opacity="0.7" />
        <rect x="20" y="2" width="4" height="18" rx="2" fill="url(#handGrad)" opacity="0.6" />
        <rect x="2" y="14" width="6" height="4" rx="2" fill="url(#handGrad)" opacity="0.5" transform="rotate(-20 5 16)" />
        <defs>
          <linearGradient id="handGrad" x1="0" y1="0" x2="32" y2="48">
            <stop offset="0%" stopColor="#FF6B00" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#00E5FF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FF6B00" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <ellipse cx="16" cy="30" rx="12" ry="16" fill="#00E5FF" opacity="0.1">
          <animate attributeName="opacity" values="0.05;0.15;0.05" dur="3s" repeatCount="indefinite" />
        </ellipse>
      </svg>
    </motion.div>
  );
}

export function AIAssistant() {
  const { lang, t } = useLanguage();
  const { data } = useSiteData();
  const { trackInteraction } = useAnalytics();
  const [isOpen, setIsOpen] = useState(false);
  const aiEnabled = data?.featureFlags?.ai_chatbot !== false;
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<
    { id: number; text: string; sender: "ai" | "user" }[]
  >([
    { id: 1, text: t("ai.greeting"), sender: "ai" },
    { id: 2, text: t("ai.initialMessage"), sender: "ai" },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [kbHeight, setKbHeight] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    const timer = setInterval(() => {
      const v = window.visualViewport;
      if (!v) return;
      const d = (window.innerHeight || document.documentElement.clientHeight) - v.height;
      setKbHeight(h => {
        const n = d > 50 ? d + 12 : 0;
        return n !== h ? n : h;
      });
    }, 300);
    return () => clearInterval(timer);
  }, []);

  const handleToggleOpen = useCallback(() => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) {
      setIsListening(true);
      timeoutRef.current = setTimeout(() => inputRef.current?.focus(), 400);
    } else {
      setIsListening(false);
    }
  }, [isOpen]);

  const handleSend = useCallback(async () => {
    if (!inputValue.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      text: inputValue.trim(),
      sender: "user" as const,
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputValue.trim();
    setInputValue("");
    trackInteraction("chat", currentInput.slice(0, 100));
    setIsListening(false);
    setIsTyping(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentInput, lang }),
      });
      const data = await res.json();
      const reply = data?.data?.response || (lang === "bn" ? "দুঃখিত, আমি এটি প্রক্রিয়া করতে পারিনি।" : "Sorry, I couldn't process that. Please try asking about services, skills, or projects.");
      setMessages((prev) => [...prev, { id: prev.length + 1, text: reply, sender: "ai" }]);
    } catch {
      setMessages((prev) => [...prev, {
        id: prev.length + 1,
        text: lang === "bn" ? "সংযোগ করতে সমস্যা হচ্ছে। দয়া করে পরে আবার চেষ্টা করুন।" : "I'm having trouble connecting. Please try again later.",
        sender: "ai",
      }]);
    } finally {
      setIsTyping(false);
      timeoutRef.current = setTimeout(() => setIsListening(true), 500);
    }
  }, [inputValue, messages, lang]);

  const handleInputFocus = useCallback(() => {
    setTimeout(() => {
      const v = window.visualViewport;
      if (!v) return;
      const d = (window.innerHeight || document.documentElement.clientHeight) - v.height;
      if (d > 50) setKbHeight(d + 12);
    }, 400);
  }, []);

  const handleInputBlur = useCallback(() => {
    setTimeout(() => setKbHeight(0), 200);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!aiEnabled) return null;

  return (
    <div className="fixed z-50" style={{ right: "clamp(12px, 4vw, 24px)", bottom: kbHeight > 0 ? `calc(clamp(12px, 4vw, 24px) + ${kbHeight}px)` : "clamp(12px, 4vw, 24px)" }}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-20 right-0"
            style={{
              width: "clamp(240px, 70vw, 340px)",
              height: kbHeight > 0 ? "clamp(200px, 35dvh, 300px)" : "clamp(300px, 50dvh, 420px)",
            }}
          >
              <div className="relative h-full flex flex-col min-h-0">
              <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-orange/40 via-cyan/40 to-cyan/40 opacity-40 blur-sm" />
              <div className="relative rounded-2xl bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/10 overflow-hidden shadow-[0_0_60px_rgba(0,229,255,0.08)]">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <AIFace isListening={isListening} />
                      <motion.div
                        className="absolute -inset-2 rounded-full bg-gradient-to-br from-orange/20 to-cyan/20 blur-md"
                        animate={{ opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-main-text">AI Assistant</p>
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
                    className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors cursor-pointer"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4 text-secondary-text" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 scrollbar-thin min-h-0">
                  {messages.map((msg, i) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.3, delay: i * 0.05, ease: "easeOut" }}
                      className={cn("flex", msg.sender === "user" ? "justify-end" : "justify-start")}
                    >
                      {msg.sender === "ai" && (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange to-cyan flex items-center justify-center mr-2 mt-1 shrink-0">
                          <Sparkles className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
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
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange to-cyan flex items-center justify-center mr-2 mt-1 shrink-0">
                        <Sparkles className="w-3 h-3 text-white" />
                      </div>
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

                <div className="p-4 border-t border-white/10 bg-white/[0.02] relative">
                  <div className="flex items-center gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      onKeyDown={handleKeyDown}
                      placeholder={lang === "bn" ? "একটি বার্তা লিখুন..." : "Type a message..."}
                      className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-main-text placeholder:text-muted-text/60 focus:outline-none focus:border-cyan/30 focus:ring-1 focus:ring-cyan/20 transition-all duration-300"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!inputValue.trim() || isTyping}
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 cursor-pointer",
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
        <FloatingHand side="left" isOpen={isOpen} />
        <FloatingHand side="right" isOpen={isOpen} />

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
              <AIFace isListening={false} />
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
