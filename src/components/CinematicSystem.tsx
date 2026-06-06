"use client";

import { useEffect, useRef, useState, ReactNode } from "react";
import { motion, useScroll, useSpring } from "framer-motion";

function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });

  return (
    <>
      <motion.div
        className="fixed top-0 left-0 right-0 h-[3px] z-[100] origin-left"
        style={{
          scaleX,
          background: "linear-gradient(90deg, #FF6B00, #00E5FF, #7C3AED, #F43F5E, #FF6B00)",
          backgroundSize: "200% 100%",
          boxShadow: "0 0 20px rgba(255,107,0,0.4), 0 0 40px rgba(0,229,255,0.2)",
        }}
      />
      <div className="fixed top-[3px] left-0 right-0 h-[1px] z-[100] bg-white/5" />
    </>
  );
}

function MouseGlow() {
  const glowRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      targetRef.current.x = e.clientX;
      targetRef.current.y = e.clientY;
    };

    const animate = () => {
      currentRef.current.x += (targetRef.current.x - currentRef.current.x) * 0.05;
      currentRef.current.y += (targetRef.current.y - currentRef.current.y) * 0.05;

      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${currentRef.current.x - 250}px, ${currentRef.current.y - 250}px)`;
      }
      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMouseMove);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const isTouchDevice = typeof window !== "undefined" && "ontouchstart" in window;

  if (isTouchDevice) return null;

  return (
    <div
      ref={glowRef}
      className="fixed top-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none z-[2] mix-blend-screen"
      style={{
        background: "radial-gradient(circle, rgba(255,107,0,0.06) 0%, rgba(0,229,255,0.04) 30%, transparent 70%)",
        transition: "opacity 0.5s ease",
      }}
    />
  );
}

function SectionDivider() {
  return (
    <div className="relative w-full h-24 md:h-32 overflow-hidden -my-2">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full max-w-4xl mx-auto px-6">
          <div className="relative">
            <div className="h-px bg-gradient-to-r from-transparent via-orange/20 to-transparent" />
            <div className="h-px bg-gradient-to-r from-transparent via-cyan/15 to-transparent mt-px" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-orange/30 shadow-[0_0_10px_rgba(255,107,0,0.3)] mx-auto" />
            </div>
          </div>
        </div>
      </div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-full bg-gradient-to-b from-orange/[0.02] via-cyan/[0.02] to-transparent blur-[40px]" />
    </div>
  );
}

interface CineSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: "slide-up" | "slide-left" | "slide-right" | "zoom-in" | "fade";
  id?: string;
}

const variantStyles = {
  "slide-up": { y: 60, opacity: 0 },
  "slide-left": { x: 60, opacity: 0 },
  "slide-right": { x: -60, opacity: 0 },
  "zoom-in": { scale: 0.9, opacity: 0 },
  "fade": { opacity: 0 },
};

export function CineSection({ children, className = "", delay = 0, variant = "slide-up", id }: CineSectionProps) {
  return (
    <motion.section
      id={id}
      initial={variantStyles[variant]}
      whileInView={{ x: 0, y: 0, scale: 1, opacity: 1 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: 0.8,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

interface CineRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}

export function CineReveal({ children, className = "", delay = 0, duration = 0.7 }: CineRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, filter: "blur(4px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface CineTextProps {
  children: string;
  className?: string;
  delay?: number;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span";
}

export function CineText({ children, className = "", delay = 0, as: Tag = "span" }: CineTextProps) {
  const words = children.split(" ");

  return (
    <Tag className={className}>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden">
          <motion.span
            className="inline-block"
            initial={{ y: "100%" }}
            whileInView={{ y: 0 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.5,
              delay: delay + i * 0.05,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {word}
            {i < words.length - 1 && "\u00A0"}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

interface CineLettersProps {
  text: string;
  className?: string;
  delay?: number;
  letterDelay?: number;
  stagger?: number;
  as?: "span" | "h1" | "h2" | "h3" | "h4" | "p";
  once?: boolean;
}

export function CineLetters({
  text,
  className = "",
  delay = 0.3,
  letterDelay = 0.06,
  stagger = 0.04,
  as: Tag = "span",
  once = true,
}: CineLettersProps) {
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [delay]);

  const letters = text.split("");

  return (
    <Tag className={className} aria-label={text}>
      {letters.map((char, i) => (
        <span
          key={i}
          className="inline-block overflow-hidden"
          style={{
            display: char === " " ? "inline-block" : "inline-block",
            width: char === " " ? "0.3em" : undefined,
          }}
        >
          <motion.span
            className="inline-block"
            initial={{ y: 80, opacity: 0, rotateX: -40, filter: "blur(6px)" }}
            animate={started ? { y: 0, opacity: 1, rotateX: 0, filter: "blur(0px)" } : {}}
            transition={{
              duration: 0.6,
              delay: i * stagger + letterDelay,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

export function CinematicSystem({ children }: { children: ReactNode }) {
  return (
    <>
      <ScrollProgressBar />
      <MouseGlow />
      {children}
    </>
  );
}

export { SectionDivider };
