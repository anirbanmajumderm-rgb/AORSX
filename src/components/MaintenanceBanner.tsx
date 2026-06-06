"use client";

import { motion } from "framer-motion";
import { Construction, X } from "lucide-react";
import { useSiteData } from "@/hooks/useSiteData";
import { useState } from "react";

export function MaintenanceBanner() {
  const { data } = useSiteData();
  const [dismissed, setDismissed] = useState(false);
  const isEnabled = data?.featureFlags?.maintenance_mode === true;

  if (!isEnabled || dismissed) return null;

  return (
    <motion.div
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="relative z-[9999] bg-gradient-to-r from-amber-600/20 via-amber-500/20 to-amber-600/20 border-b border-amber-500/30 backdrop-blur-xl"
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-center gap-3">
        <Construction className="w-4 h-4 text-amber-400 shrink-0" />
        <p className="text-sm text-amber-200/90">
          Site is currently under maintenance. Some features may be unavailable.
        </p>
        <button
          onClick={() => setDismissed(true)}
          className="ml-4 p-1 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Dismiss maintenance banner"
        >
          <X className="w-4 h-4 text-amber-400/60" />
        </button>
      </div>
    </motion.div>
  );
}
