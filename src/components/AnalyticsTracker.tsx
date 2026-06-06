"use client";

import { useEffect, useRef } from "react";
import { useAnalytics } from "@/hooks/useAnalytics";

export function AnalyticsTracker() {
  const { trackPageView, trackInteraction } = useAnalytics();
  const trackedInteractions = useRef<Set<string>>(new Set());

  useEffect(() => {
    trackPageView();
    const handleRouteChange = () => trackPageView();
    window.addEventListener("popstate", handleRouteChange);
    return () => window.removeEventListener("popstate", handleRouteChange);
  }, [trackPageView]);

  useEffect(() => {
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
      trackedInteractions.current.add(key);

      const type = tag === "button" || tag === "a" ? "click" : "form_interaction";
      trackInteraction(type, text || tag);
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [trackInteraction]);

  return null;
}
