"use client";

import { type LucideIcon, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface StatItem {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; positive: boolean };
  variant?: "cyan" | "orange" | "purple" | "emerald" | "pink" | "blue";
  description?: string;
}

interface StatCardGridProps {
  stats: StatItem[];
  columns?: 2 | 3 | 4;
  className?: string;
}

const variantStyles: Record<string, { bg: string; icon: string; glow: string; gradient: string }> = {
  cyan: { bg: "bg-neon-cyan/[0.04]", icon: "text-neon-cyan", glow: "bg-neon-cyan", gradient: "from-neon-cyan/20 to-blue-500/20" },
  orange: { bg: "bg-neon-orange/[0.04]", icon: "text-neon-orange", glow: "bg-neon-orange", gradient: "from-neon-orange/20 to-amber-500/20" },
  purple: { bg: "bg-purple-500/[0.04]", icon: "text-purple-400", glow: "bg-purple-400", gradient: "from-purple-500/20 to-pink-500/20" },
  emerald: { bg: "bg-emerald-500/[0.04]", icon: "text-emerald-400", glow: "bg-emerald-400", gradient: "from-emerald-500/20 to-teal-500/20" },
  pink: { bg: "bg-pink-500/[0.04]", icon: "text-pink-400", glow: "bg-pink-400", gradient: "from-pink-500/20 to-rose-500/20" },
  blue: { bg: "bg-blue-500/[0.04]", icon: "text-blue-400", glow: "bg-blue-400", gradient: "from-blue-500/20 to-indigo-500/20" },
};

export function StatCardGrid({ stats, columns = 4, className }: StatCardGridProps) {
  const gridCols = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid grid-cols-1 gap-4", gridCols[columns], className)}>
      {stats.map((stat, i) => {
        const vs = variantStyles[stat.variant || "cyan"];
        return (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "group relative overflow-hidden rounded-2xl border border-white/[0.04] p-5 transition-all duration-300",
              "hover:border-white/[0.08] hover:shadow-lg hover:-translate-y-0.5",
              vs.bg,
              className
            )}
          >
            <div className={cn(
              "absolute -right-10 -top-10 h-24 w-24 rounded-full opacity-[0.02] blur-3xl transition-all duration-500 group-hover:opacity-[0.06] group-hover:scale-150",
              vs.glow
            )} />

            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.04] bg-white/[0.03]",
                )}>
                  <stat.icon size={17} className={vs.icon} />
                </div>
                {stat.trend && (
                  <span className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                    stat.trend.positive
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-red-500/10 text-red-400"
                  )}>
                    <TrendingUp size={10} className={cn(stat.trend.positive ? "" : "rotate-180")} />
                    {Math.abs(stat.trend.value)}%
                  </span>
                )}
              </div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/30">{stat.title}</p>
              <p className="mt-1.5 font-heading text-2xl font-bold tracking-tight">{stat.value}</p>
              {stat.description && (
                <p className="mt-1 text-[11px] text-white/25">{stat.description}</p>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
