"use client";

import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, children, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8", className)}>
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-neon-orange/20 to-neon-cyan/20">
            <Sparkles size={16} className="text-neon-cyan" />
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">{title}</h1>
        </div>
        {description && (
          <p className="text-sm text-white/30 ml-11">{description}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-3 ml-11 sm:ml-0">
          {children}
        </div>
      )}
    </div>
  );
}
