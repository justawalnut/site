"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function getMediaQuery(): MediaQueryList | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.matchMedia("(prefers-color-scheme: dark)");
}

function resolveSystemTheme(): ResolvedTheme {
  const media = getMediaQuery();
  if (!media) {
    return "light";
  }

  return media.matches ? "dark" : "light";
}

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "dashboard-theme",
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>("light");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const stored = window.localStorage.getItem(storageKey) as Theme | null;
    if (stored) {
      setThemeState(stored);
    }

    setSystemTheme(resolveSystemTheme());
    setIsMounted(true);

    const media = getMediaQuery();
    if (!media) {
      return;
    }

    const handleChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? "dark" : "light");
    };

    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [storageKey]);

  useEffect(() => {
    if (!isMounted || typeof document === "undefined") {
      return;
    }

    const root = document.documentElement;
    const appliedTheme = theme === "system" ? systemTheme : theme;

    root.classList.toggle("dark", appliedTheme === "dark");
  }, [isMounted, systemTheme, theme]);

  useEffect(() => {
    if (!isMounted || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(storageKey, theme);
  }, [isMounted, storageKey, theme]);

  const setTheme = useCallback((value: Theme) => {
    setThemeState(value);
  }, []);

  const resolvedTheme = theme === "system" ? systemTheme : theme;

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
    }),
    [resolvedTheme, setTheme, theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}
