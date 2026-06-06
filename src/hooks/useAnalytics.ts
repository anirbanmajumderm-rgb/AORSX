"use client";

import { useEffect, useRef, useCallback } from "react";

function getVisitorId(): string {
  let id = localStorage.getItem("_visitor_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("_visitor_id", id);
  }
  return id;
}

function getDevice(): string {
  const ua = navigator.userAgent;
  if (/Mobile|Android|iPhone|iPad/i.test(ua)) return "mobile";
  if (/Tablet|iPad/i.test(ua)) return "tablet";
  return "desktop";
}

export function useAnalytics() {
  const visitorId = useRef<string>("");
  const lastPage = useRef<string>("");

  useEffect(() => {
    visitorId.current = getVisitorId();
  }, []);

  const trackPageView = useCallback(() => {
    const page = window.location.pathname;
    if (page === lastPage.current) return;
    lastPage.current = page;

    fetch("/api/admin/analytics/record", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: "pageview",
        page,
        referrer: document.referrer || null,
        device: getDevice(),
        visitorId: visitorId.current,
      }),
    }).catch(() => {});
  }, []);

  const trackInteraction = useCallback(
    (type: string, label?: string, metadata?: Record<string, unknown>) => {
      fetch("/api/admin/analytics/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: "interaction",
          type,
          page: window.location.pathname,
          label: label || null,
          metadata: metadata || null,
          visitorId: visitorId.current,
        }),
      }).catch(() => {});
    },
    []
  );

  return { trackPageView, trackInteraction };
}
