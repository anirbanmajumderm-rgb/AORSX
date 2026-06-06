"use client";

import { X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "default";
  loading?: boolean;
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  loading,
}: ConfirmModalProps) {
  useEffect(() => {
    if (open) {
      const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
      document.addEventListener("keydown", handler);
      return () => document.removeEventListener("keydown", handler);
    }
  }, [open, onClose]);

  if (!open) return null;

  const variantStyles = {
    danger: { icon: "text-red-400 bg-red-500/10 border-red-500/10", button: "bg-red-500 hover:bg-red-600 text-white" },
    warning: { icon: "text-amber-400 bg-amber-500/10 border-amber-500/10", button: "bg-amber-500 hover:bg-amber-600 text-white" },
    default: { icon: "text-neon-cyan bg-neon-cyan/10 border-neon-cyan/10", button: "bg-neon-cyan hover:bg-neon-cyan/90 text-black" },
  };

  const vs = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-white/[0.06] bg-[#0a0a0a]/95 backdrop-blur-2xl p-6 shadow-2xl animate-scale-in">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/20 hover:text-white/60 transition-colors">
          <X size={16} />
        </button>
        <div className="flex items-center gap-4 mb-4">
          <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl border", vs.icon)}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <h3 className="text-base font-bold">{title}</h3>
            <p className="text-sm text-white/40 mt-0.5">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 justify-end mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-sm font-medium text-white/40 hover:text-white/70 border border-white/[0.06] hover:border-white/[0.12] transition-all disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn("px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50", vs.button)}
          >
            {loading ? "Loading..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
