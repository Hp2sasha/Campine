"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Mode = "day" | "night";

export const THEME_KEY = "campine:mode";

type ThemeCtx = {
  mode: Mode;
  setMode: (m: Mode) => void;
  ready: boolean;
};

const Ctx = createContext<ThemeCtx>({ mode: "night", setMode: () => {}, ready: false });

export function autoModeByHour(): Mode {
  const h = new Date().getHours();
  return h >= 6 && h < 18 ? "day" : "night";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<Mode>("night");
  const [ready, setReady] = useState(false);

  // pick up saved choice, otherwise follow the visitor's local clock
  useEffect(() => {
    const saved = window.localStorage.getItem(THEME_KEY);
    const initial: Mode = saved === "day" || saved === "night" ? saved : autoModeByHour();
    setModeState(initial);
    setReady(true);
  }, []);

  // apply to <html> for the whole document (all pages)
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", mode === "night");
    root.setAttribute("data-mode", mode);
  }, [mode]);

  // while the user has not chosen manually, follow the clock
  useEffect(() => {
    const t = window.setInterval(() => {
      const saved = window.localStorage.getItem(THEME_KEY);
      if (saved !== "day" && saved !== "night") {
        setModeState(autoModeByHour());
      }
    }, 60_000);
    return () => window.clearInterval(t);
  }, []);

  const setMode = (m: Mode) => {
    setModeState(m);
    try {
      window.localStorage.setItem(THEME_KEY, m);
    } catch {
      /* ignore */
    }
  };

  return <Ctx.Provider value={{ mode, setMode, ready }}>{children}</Ctx.Provider>;
}

export function useTheme() {
  return useContext(Ctx);
}
