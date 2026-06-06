"use client";

import { Activity, Plus, BrainCircuit, MessageSquare, Server, Users, FileText, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string | number;
  type: string;
  action: string;
  detail?: string;
  time: string;
}

interface ActivityFeedProps {
  items: ActivityItem[];
  className?: string;
  emptyMessage?: string;
}

const activityConfig: Record<string, { icon: typeof Activity; color: string }> = {
  create: { icon: Plus, color: "bg-neon-orange/10 text-neon-orange border-neon-orange/10" },
  ai: { icon: BrainCircuit, color: "bg-neon-cyan/10 text-neon-cyan border-neon-cyan/10" },
  review: { icon: MessageSquare, color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/10" },
  system: { icon: Server, color: "bg-purple-500/10 text-purple-400 border-purple-500/10" },
  contact: { icon: Users, color: "bg-blue-500/10 text-blue-400 border-blue-500/10" },
  update: { icon: FileText, color: "bg-amber-500/10 text-amber-400 border-amber-500/10" },
  automation: { icon: Zap, color: "bg-pink-500/10 text-pink-400 border-pink-500/10" },
};

function formatTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function ActivityFeed({ items, className, emptyMessage = "No recent activity" }: ActivityFeedProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-10">
        <Activity size={22} className="mx-auto text-white/15 mb-3" />
        <p className="text-sm text-white/25">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      {items.slice(0, 8).map((item, i) => {
        const config = activityConfig[item.type] || activityConfig.system;
        const Icon = config.icon;
        return (
          <div
            key={item.id ?? i}
            className="group flex items-center gap-4 p-3 rounded-xl transition-all duration-200 hover:bg-white/[0.02]"
          >
            <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg border shrink-0", config.color)}>
              <Icon size={13} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/70 font-medium">{item.action}</p>
              {item.detail && (
                <p className="text-xs text-white/25 truncate">{item.detail}</p>
              )}
            </div>
            <span className="text-[11px] text-white/15 shrink-0 font-mono">
              {formatTime(item.time)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
