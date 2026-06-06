"use client";

import { Button } from "@/components/ui/button";
import { Home, Search } from "lucide-react";

export default function AdminNotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen p-8">
      <div className="flex flex-col items-center text-center max-w-md">
        <div className="relative mb-6">
          <h1 className="font-heading text-9xl font-bold bg-gradient-to-r from-neon-orange to-neon-cyan bg-clip-text text-transparent leading-none">
            404
          </h1>
          <div className="absolute -inset-4 bg-gradient-to-r from-neon-orange/5 to-neon-cyan/5 rounded-full blur-3xl -z-10" />
        </div>
        <h2 className="font-heading text-2xl font-bold mb-2">Page Not Found</h2>
        <p className="text-white/40 text-sm mb-8 max-w-sm">
          The page you&apos;re looking for doesn&apos;t exist or has been moved to a new location.
        </p>
        <div className="flex gap-3">
          <Button onClick={() => window.location.href = "/admin/dashboard"} className="gap-2">
            <Home size={14} />
            Go Home
          </Button>
          <Button variant="outline" onClick={() => window.history.back()} className="gap-2">
            <Search size={14} />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
