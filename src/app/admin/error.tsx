"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-screen p-8">
      <div className="flex flex-col items-center text-center max-w-md">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-red-500/[0.06] border border-red-500/10 mb-6">
          <AlertTriangle size={36} className="text-red-400/70" />
        </div>
        <h2 className="font-heading text-2xl font-bold mb-2">System Error</h2>
        <p className="text-white/40 text-sm mb-8 max-w-sm">
          {error.message || "A critical system error occurred. Please try again or contact support."}
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => window.location.href = "/admin/dashboard"}
            className="gap-2"
          >
            <ArrowLeft size={14} />
            Dashboard
          </Button>
          <Button onClick={reset} className="gap-2">
            <RefreshCw size={14} />
            Retry
          </Button>
        </div>
      </div>
    </div>
  );
}
