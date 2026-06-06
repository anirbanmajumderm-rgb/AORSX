"use client";

import { createContext, useContext, useState, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface TabsContextType {
  value: string;
  onValueChange: (v: string) => void;
}

const TabsContext = createContext<TabsContextType>({ value: "", onValueChange: () => {} });

const Tabs = ({ value, onValueChange, children, className, ...props }: HTMLAttributes<HTMLDivElement> & { value: string; onValueChange: (v: string) => void }) => {
  const [internalValue, setInternalValue] = useState(value);
  const currentValue = value ?? internalValue;
  const handleChange = onValueChange ?? setInternalValue;

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleChange }}>
      <div className={cn("", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

const TabsList = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "inline-flex h-10 items-center justify-start overflow-x-auto w-full rounded-xl bg-white/[0.04] p-1 border border-white/5 scrollbar-none",
      className
    )}
    {...props}
  />
);

const TabsTrigger = ({ value, className, ...props }: HTMLAttributes<HTMLButtonElement> & { value: string }) => {
  const ctx = useContext(TabsContext);
  const isActive = ctx.value === value;
  return (
    <button
      type="button"
      onClick={() => ctx.onValueChange(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-neon-orange/20 text-neon-orange shadow-sm"
          : "text-white/50 hover:text-white",
        className
      )}
      {...props}
    />
  );
};

const TabsContent = ({ value, className, ...props }: HTMLAttributes<HTMLDivElement> & { value: string }) => {
  const ctx = useContext(TabsContext);
  if (ctx.value !== value) return null;
  return (
    <div
      className={cn("mt-4 focus-visible:outline-none", className)}
      {...props}
    />
  );
};

export { Tabs, TabsList, TabsTrigger, TabsContent };
