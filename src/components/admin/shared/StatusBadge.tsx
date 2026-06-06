import { cn } from "@/lib/utils";

type StatusType = "active" | "inactive" | "pending" | "draft" | "published" | "error" | "warning" | "success" | "revoked";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
  size?: "sm" | "md";
}

const statusConfig: Record<StatusType, { label: string; dot: string; bg: string }> = {
  active: { label: "Active", dot: "bg-emerald-400", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/10" },
  inactive: { label: "Inactive", dot: "bg-white/20", bg: "bg-white/[0.04] text-white/40 border-white/[0.04]" },
  pending: { label: "Pending", dot: "bg-amber-400", bg: "bg-amber-500/10 text-amber-400 border-amber-500/10" },
  draft: { label: "Draft", dot: "bg-white/20", bg: "bg-white/[0.04] text-white/40 border-white/[0.04]" },
  published: { label: "Published", dot: "bg-emerald-400", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/10" },
  error: { label: "Error", dot: "bg-red-400", bg: "bg-red-500/10 text-red-400 border-red-500/10" },
  warning: { label: "Warning", dot: "bg-amber-400", bg: "bg-amber-500/10 text-amber-400 border-amber-500/10" },
  success: { label: "Success", dot: "bg-emerald-400", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/10" },
  revoked: { label: "Revoked", dot: "bg-red-400", bg: "bg-red-500/10 text-red-400 border-red-500/10" },
};

export function StatusBadge({ status, className, size = "sm" }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.inactive;
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full font-medium border",
      size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
      config.bg,
      className
    )}>
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}
