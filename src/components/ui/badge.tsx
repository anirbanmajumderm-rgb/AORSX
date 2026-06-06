import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = {
  default:
    "bg-neon-orange/15 text-neon-orange border border-neon-orange/20",
  secondary:
    "bg-white/5 text-white/70 border border-white/10",
  destructive:
    "bg-red-500/15 text-red-400 border border-red-500/20",
  success:
    "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  cyan:
    "bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/20",
  orange:
    "bg-neon-orange/15 text-neon-orange border border-neon-orange/20",
  outline:
    "border border-white/10 text-white/60",
};

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof badgeVariants;
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
          badgeVariants[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";

export { Badge, badgeVariants };
