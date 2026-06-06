"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  hover?: boolean;
  as?: "div" | "section" | "article";
}

export function GlassCard({
  children,
  className,
  glow = false,
  hover = true,
  as: Component = "div",
}: GlassCardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -4 } : undefined}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="relative group"
    >
      {glow && (
        <div className="absolute -inset-[1px] rounded-[var(--radius-card)] bg-gradient-to-br from-orange/20 via-cyan/20 to-cyan/20 opacity-0 blur-xl transition-opacity duration-700 group-hover:opacity-100" />
      )}
      <Component
        className={cn(
          "relative rounded-[var(--radius-card)] bg-card-bg border border-soft-border backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.2)] transition-all duration-500",
          hover && "group-hover:border-orange/30 group-hover:shadow-[0_24px_64px_rgba(0,0,0,0.45),0_0_30px_rgba(255,107,0,0.08)]",
          className
        )}
      >
        {children}
      </Component>
    </motion.div>
  );
}
