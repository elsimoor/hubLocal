"use client";

/*
 * ThemeProvider manages a simple theme system (light, dark, colorful) for the app.
 * The current theme is persisted to localStorage and applied as a data attribute
 * on the <html> element. Other components can consume the theme via the
 * useTheme() hook to switch between themes. This implements FEAT-005 (Theme
 * choice) from the project checklist.
 */

import React, { createContext, useState, useEffect, useContext } from "react";

type Theme = "light" | "dark" | "colorful";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  // Load persisted theme from localStorage on mount
  useEffect(() => {
    try {
      const stored = (typeof window !== "undefined" && window.localStorage.getItem("theme")) as Theme | null;
      if (stored === "light" || stored === "dark" || stored === "colorful") {
        setTheme(stored);
      }
    } catch {
      // ignore localStorage errors in SSR
    }
  }, []);

  // Apply theme as a data attribute on the <html> element and persist it
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
    }
    try {
      window.localStorage.setItem("theme", theme);
    } catch {
      // ignore localStorage errors
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Custom hook to access the current theme and update it. Throws if used outside
 * of the ThemeProvider.
 */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}