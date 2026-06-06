import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const variantStyles = {
  default:
    "bg-gradient-to-r from-neon-orange to-neon-cyan text-white shadow-lg shadow-neon-orange/20 hover:shadow-xl hover:shadow-neon-orange/30 active:scale-[0.98]",
  destructive:
    "bg-red-500/90 text-white hover:bg-red-500 shadow-lg shadow-red-500/20",
  outline:
    "border border-white/10 bg-transparent hover:bg-white/5 hover:border-white/20",
  secondary:
    "bg-white/5 text-white hover:bg-white/10 border border-white/10",
  ghost: "bg-transparent hover:bg-white/5 text-white/70 hover:text-white",
  link: "text-neon-cyan underline-offset-4 hover:underline",
};

const sizeStyles = {
  default: "h-10 px-5 py-2",
  sm: "h-8 px-3 text-xs",
  lg: "h-12 px-8 text-base",
  xl: "h-14 px-10 text-lg",
  icon: "h-10 w-10",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantStyles;
  size?: keyof typeof sizeStyles;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neon-cyan/50 disabled:pointer-events-none disabled:opacity-50",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, variantStyles };
