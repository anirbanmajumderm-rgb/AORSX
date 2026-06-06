import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, ...props }, ref) => {
    return (
      <div>
        {label && <label className="block text-xs font-medium text-white/50 mb-1.5">{label}</label>}
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white placeholder:text-white/30 outline-none transition-all duration-200 focus:border-neon-cyan/50 focus:shadow-[0_0_20px_-8px_rgba(0,229,255,0.3)] disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = "Input";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <div>
        {label && <label className="block text-xs font-medium text-white/50 mb-1.5">{label}</label>}
        <textarea
          className={cn(
            "flex min-h-[120px] w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition-all duration-200 focus:border-neon-cyan/50 focus:shadow-[0_0_20px_-8px_rgba(0,229,255,0.3)] disabled:cursor-not-allowed disabled:opacity-50 resize-y",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Input, Textarea };
