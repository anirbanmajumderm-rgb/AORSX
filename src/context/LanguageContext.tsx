"use client";
import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { defaultLang, getTranslation } from "@/i18n/translations";

type Language = "en" | "bn";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
  hydrated: boolean;
}

const STORAGE_KEY = "site-lang";

const LanguageContext = createContext<LanguageContextType>({
  lang: defaultLang as Language,
  setLang: () => {},
  t: (key: string) => key,
  hydrated: false,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === "en" || stored === "bn") return stored;
      } catch { /* ignore */ }
    }
    return defaultLang as Language;
  });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
  }, []);

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key: string) => getTranslation(lang, key),
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, hydrated }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
