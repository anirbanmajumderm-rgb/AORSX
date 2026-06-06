"use client";

import { Bot, Clock, Activity, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";

interface ModelCardProps {
  name: string;
  provider: string;
  version: string;
  status: "active" | "inactive" | "maintenance";
  uptime: number;
  latency: string;
  cost: string;
  className?: string;
}

export function ModelCard({ name, provider, version, status, uptime, latency, cost, className }: ModelCardProps) {
  return (
    <div className={cn(
      "rounded-xl border border-white/[0.04] bg-white/[0.02] p-4 hover:border-white/[0.08] hover:bg-white/[0.03] transition-all group",
      className
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-neon-cyan/20 to-blue-500/20">
            <Bot size={18} className="text-neon-cyan" />
          </div>
          <div>
            <p className="text-white font-medium text-sm">{name}</p>
            <p className="text-white/25 text-xs">{provider}</p>
          </div>
        </div>
        <span className="text-[9px] px-2 py-0.5 rounded-md bg-white/[0.04] text-white/30 font-mono border border-white/[0.04]">
          v{version}
        </span>
      </div>
      <div className="flex items-center gap-3 text-[11px] text-white/25">
        <span className="flex items-center gap-1">
          <Clock size={10} /> {latency}
        </span>
        <span className="flex items-center gap-1">
          <Activity size={10} /> {uptime}%
        </span>
        <span className="flex items-center gap-1">
          <Cpu size={10} /> {cost}
        </span>
        <span className="ml-auto">
          <StatusBadge status={status === "maintenance" ? "warning" : status as any} size="sm" />
        </span>
      </div>
    </div>
  );
}
