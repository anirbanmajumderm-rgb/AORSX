"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

interface CsrfContextType {
  token: string | null;
  loading: boolean;
  fetchWithCsrf: (url: string, options?: RequestInit) => Promise<Response>;
}

const CsrfContext = createContext<CsrfContextType>({
  token: null,
  loading: true,
  fetchWithCsrf: async () => new Response(),
});

export function CsrfProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/csrf");
        const json = await res.json();
        if (!cancelled && json.success) {
          setToken(json.data.token);
        } else if (!cancelled) {
          console.error("[CSRF] Token fetch failed:", json.error || "Unknown error");
        }
      } catch (err) {
        console.error("[CSRF] Token fetch error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 10 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const fetchWithCsrf = useCallback(
    async (url: string, options?: RequestInit): Promise<Response> => {
      const headers = new Headers(options?.headers);
      if (token && (options?.method === undefined || (options.method !== "GET" && options.method !== "HEAD" && options.method !== "OPTIONS"))) {
        headers.set("x-csrf-token", token);
      }
      return fetch(url, { ...options, headers });
    },
    [token]
  );

  return (
    <CsrfContext.Provider value={{ token, loading, fetchWithCsrf }}>
      {children}
    </CsrfContext.Provider>
  );
}

export const useCsrf = () => useContext(CsrfContext);
