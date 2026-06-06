"use client";

import { createContext, useContext, useState, useRef, useEffect, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface DropdownContextType {
  open: boolean;
  setOpen: (v: boolean) => void;
}

const DropdownContext = createContext<DropdownContextType>({ open: false, setOpen: () => {} });

const DropdownMenu = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      {children}
    </DropdownContext.Provider>
  );
};

const DropdownMenuTrigger = ({ children, ...props }: HTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) => {
  const { setOpen } = useContext(DropdownContext);
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={cn("inline-flex items-center justify-center", props.className)}
      {...props}
    >
      {children}
    </button>
  );
};

const DropdownMenuContent = ({ children, className, align = "end", ...props }: HTMLAttributes<HTMLDivElement> & { align?: "start" | "end" }) => {
  const { open, setOpen } = useContext(DropdownContext);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "absolute z-50 mt-1 min-w-[12rem] overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a]/95 backdrop-blur-2xl shadow-2xl animate-in fade-in zoom-in-95 origin-top-right",
        align === "end" ? "right-0" : "left-0",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

const DropdownMenuItem = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => {
  const { setOpen } = useContext(DropdownContext);
  return (
    <div
      onClick={() => setOpen(false)}
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/70 outline-none transition-colors hover:bg-white/5 hover:text-white data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    />
  );
};

const DropdownMenuSeparator = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("my-1 h-px bg-white/5", className)} {...props} />
);

export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator };
