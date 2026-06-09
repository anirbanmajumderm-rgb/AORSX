"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const BRAND = "A-ORSX";

const letterVariants = {
  hidden: {
    opacity: 0,
    y: 120,
    rotateX: -100,
    scale: 3,
    filter: "blur(20px)",
  },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 1,
      delay: 0.5 + i * 0.22,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  }),
};

const glowVariants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: (i: number) => ({
    opacity: [0, 0.4, 0.15],
    scale: [0.5, 1.5, 1],
    transition: {
      duration: 1.2,
      delay: 0.5 + i * 0.22,
      ease: "easeOut" as const,
    },
  }),
};

export function CinematicIntro({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<"intro" | "flash" | "done">("intro");
  const [showTagline, setShowTagline] = useState(false);
  const sweepRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const alreadyPlayed = sessionStorage.getItem("aorsx-intro-played");
    if (alreadyPlayed) {
      setPhase("done");
      return;
    }

    const taglineTimer = setTimeout(() => setShowTagline(true), 2400);

    const flashTimer = setTimeout(() => {
      setPhase("flash");
      setTimeout(() => {
        setPhase("done");
        sessionStorage.setItem("aorsx-intro-played", "true");
      }, 900);
    }, 3800);

    return () => {
      clearTimeout(taglineTimer);
      clearTimeout(flashTimer);
    };
  }, []);

  const totalLetters = BRAND.length;

  return (
    <>
      <AnimatePresence mode="wait">
        {phase !== "done" && (
          <motion.div
            key="cine-intro"
            className="fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Scanlines */}
            <div
              className="absolute inset-0 opacity-[0.06] pointer-events-none"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)",
              }}
            />

            {/* Vignette */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 75%, rgba(0,0,0,0.95) 100%)",
              }}
            />

            {/* Flash */}
            {phase === "flash" && (
              <motion.div
                className="absolute inset-0 z-10 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0.6, 0] }}
                transition={{
                  duration: 0.9,
                  times: [0, 0.15, 0.3, 1],
                  ease: "easeOut",
                }}
                style={{
                  background:
                    "radial-gradient(ellipse at center, rgba(255,255,255,1) 0%, rgba(180,220,255,0.9) 25%, rgba(255,107,0,0.2) 50%, transparent 70%)",
                }}
              />
            )}

            {/* Ambient glow orbs */}
            <div className="absolute top-[20%] left-[15%] w-72 h-72 rounded-full bg-gradient-to-r from-orange/15 to-transparent blur-[120px]" />
            <div className="absolute bottom-[20%] right-[15%] w-72 h-72 rounded-full bg-gradient-to-l from-cyan/15 to-transparent blur-[120px]" />
            <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-gradient-to-r from-orange/5 via-cyan/5 to-orange/5 blur-[150px]" />

            {/* Light sweep beam */}
            <motion.div
              ref={sweepRef}
              className="absolute inset-0 z-[3] pointer-events-none"
              initial={{ x: "-100%" }}
              animate={{ x: ["-100%", "250%"] }}
              transition={{
                duration: 3,
                delay: 0.3,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.02) 20%, rgba(255,255,255,0.06) 40%, rgba(255,107,0,0.03) 55%, rgba(0,229,255,0.03) 70%, rgba(255,255,255,0.02) 85%, transparent 100%)",
                width: "90%",
              }}
            />

            {/* Brand container */}
            <div className="relative z-[5] flex flex-col items-center">
              {/* Letter glow bursts */}
              <div className="absolute inset-0 flex items-center justify-center">
                {BRAND.split("").map((_, i) => (
                  <motion.div
                    key={`glow-${i}`}
                    className="absolute w-16 h-16 rounded-full bg-gradient-to-r from-orange/40 to-cyan/40"
                    style={{
                      left: `calc(${(i / (totalLetters - 1)) * 100}% + ${-32 + (i / (totalLetters - 1)) * 64}px)`,
                      transform: "translateX(-50%)",
                    }}
                    custom={i}
                    variants={glowVariants}
                    initial="hidden"
                    animate="visible"
                  />
                ))}
              </div>

              {/* Letters */}
              <div className="flex items-center gap-0 perspective-[1200px]">
                {BRAND.split("").map((char, i) => (
                  <div key={i} className="relative">
                    <motion.span
                      className="inline-block text-7xl md:text-8xl lg:text-9xl font-bold leading-none tracking-[-0.02em]"
                      style={{
                        fontFamily: "var(--font-space, 'Space Grotesk'), sans-serif",
                        background:
                          i === 0
                            ? "linear-gradient(135deg, #FF6B00 0%, #FF8C38 50%, #ffffff 100%)"
                            : i === totalLetters - 1
                              ? "linear-gradient(135deg, #ffffff 0%, #00E5FF 50%, #00B8D4 100%)"
                              : "linear-gradient(180deg, #ffffff 20%, rgba(255,255,255,0.5) 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        textShadow: "none",
                      }}
                      custom={i}
                      variants={letterVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {char}
                    </motion.span>
                  </div>
                ))}
              </div>

              {/* Tagline */}
              <AnimatePresence>
                {showTagline && (
                  <motion.p
                    className="text-xs md:text-sm text-white/25 tracking-[0.35em] uppercase mt-6 font-light"
                    initial={{ opacity: 0, y: 15, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  >
                    AI SaaS Agency
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Subtle bottom line */}
              <motion.div
                className="mt-10 h-px w-0"
                initial={{ width: 0 }}
                animate={{ width: "6rem" }}
                transition={{ duration: 1.2, delay: 2.6, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,107,0,0.3), rgba(0,229,255,0.3), transparent)",
                }}
              />
            </div>

            {/* Film grain */}
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E\")",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {children}
    </>
  );
}
