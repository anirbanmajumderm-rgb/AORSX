"use client";

import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAction {
  label: string;
  icon: LucideIcon;
  desc: string;
  href: string;
  gradient: string;
  iconColor: string;
}

interface QuickActionsProps {
  actions: QuickAction[];
  className?: string;
}

export function QuickActions({ actions, className }: QuickActionsProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-3", className)}>
      {actions.map((action) => (
        <Link key={action.label} href={action.href}>
          <div className="group flex flex-col items-center justify-center rounded-xl border border-white/[0.04] p-4 text-center transition-all duration-200 hover:border-white/[0.08] hover:bg-white/[0.02] hover:-translate-y-0.5">
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br mb-2.5 transition-transform duration-200 group-hover:scale-110",
              action.gradient
            )}>
              <action.icon size={18} className={action.iconColor} />
            </div>
            <p className="text-xs font-medium text-white/60 group-hover:text-white/80 transition-colors">{action.label}</p>
            <p className="text-[10px] text-white/20 mt-0.5">{action.desc}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
