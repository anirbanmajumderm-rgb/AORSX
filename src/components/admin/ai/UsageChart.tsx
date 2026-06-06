"use client";

import { cn } from "@/lib/utils";
import { MessageSquare, Database, TrendingUp } from "lucide-react";

interface UsageChartProps {
  data: number[];
  labels?: string[];
  className?: string;
  todayQueries?: number;
  tokensUsed?: number;
  avgCost?: number;
}

export function UsageChart({ data, labels, className, todayQueries, tokensUsed, avgCost }: UsageChartProps) {
  const max = Math.max(...data, 1);
  const defaultLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Today's Queries", value: todayQueries?.toLocaleString() || "0", icon: MessageSquare, color: "text-neon-cyan" },
          { label: "Tokens Used", value: tokensUsed ? `${(tokensUsed / 1000000).toFixed(1)}M` : "0", icon: Database, color: "text-purple-400" },
          { label: "Avg Cost/Query", value: avgCost ? `$${avgCost.toFixed(4)}` : "$0.0000", icon: TrendingUp, color: "text-emerald-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/25 mb-1">{s.label}</p>
            <div className="flex items-center gap-2">
              <s.icon size={16} className={s.color} />
              <p className="font-heading text-2xl font-bold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-5">
        <h4 className="font-heading text-sm font-bold mb-4">Monthly Usage</h4>
        <div className="flex items-end gap-1.5 h-40">
          {data.map((val, i) => {
            const height = (val / max) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                <span className="text-[8px] text-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                  {val.toLocaleString()}
                </span>
                <div
                  className="w-full rounded-sm bg-gradient-to-t from-neon-cyan/40 to-neon-cyan/5 hover:from-neon-cyan/60 hover:to-neon-cyan/20 transition-all cursor-pointer relative overflow-hidden"
                  style={{ height: `${height}%` }}
                >
                  <div className="absolute inset-0 shimmer-overlay opacity-0 group-hover:opacity-100" />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-[9px] text-white/15">
          {(labels || defaultLabels).slice(0, data.length).map((l, i) => (
            <span key={i}>{l}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
