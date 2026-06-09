"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAnalytics } from "@/hooks/useAnalytics";

export function AnalyticsTracker() {
  const pathname = usePathname();
  const { trackPageView, trackInteraction } = useAnalytics();
  const trackedInteractions = useRef<Set<string>>(new Set());

  useEffect(() => {
    trackPageView();
  }, [pathname, trackPageView]);

  useEffect(() => {
    const MAX_TRACKED = 500;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const interactive = target.closest<HTMLElement>(
        "button, a, [role='button'], input[type='submit'], [onclick]"
      );
      if (!interactive) return;

      const tag = interactive.tagName.toLowerCase();
      const text = (interactive.textContent || "").trim().slice(0, 60) || tag;
      const href = (interactive as HTMLAnchorElement).href || "";

      const key = `${tag}:${text}:${href}`;
      if (trackedInteractions.current.has(key)) return;
      if (trackedInteractions.current.size >= MAX_TRACKED) {
        const first = trackedInteractions.current.values().next().value;
        if (first) trackedInteractions.current.delete(first);
      }
      trackedInteractions.current.add(key);

      const type = tag === "button" || tag === "a" ? "click" : "form_interaction";
      trackInteraction(type, text || tag);
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [trackInteraction]);

  return null;
}
