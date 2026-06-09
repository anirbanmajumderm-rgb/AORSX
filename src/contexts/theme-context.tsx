"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let stored: Theme = "dark";
    try {
      const s = localStorage.getItem("admin-theme") as Theme | null;
      if (s === "light" || s === "dark") stored = s;
    } catch { /* ignore */ }
    setThemeState(stored);
    setMounted(true);
    document.documentElement.classList.toggle("light", stored === "light");
    document.documentElement.classList.toggle("dark", stored === "dark");
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem("admin-theme", t);
    document.documentElement.classList.toggle("light", t === "light");
    document.documentElement.classList.toggle("dark", t === "dark");
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
