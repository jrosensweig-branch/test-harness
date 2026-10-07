"use client";

import { useCallback, useSyncExternalStore } from "react";
import { DEFAULT_THEME, THEMES, THEME_STORAGE_KEY, isThemeId, type ThemeId } from "@/lib/themes";

/*
 * The theme lives on <html data-theme>, set before paint by THEME_BOOT_SCRIPT.
 * React subscribes to that attribute instead of owning a copy, so there is a
 * single source of truth and no hydration flash.
 */

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

function readTheme(): ThemeId {
  const value = document.documentElement.dataset.theme;
  return isThemeId(value) ? value : DEFAULT_THEME;
}

export type RevealOrigin = { x: number; y: number };

export function useTheme() {
  const theme = useSyncExternalStore<ThemeId | null>(subscribe, readTheme, () => null);

  const setTheme = useCallback((next: ThemeId, origin?: RevealOrigin) => {
    const root = document.documentElement;
    if (root.dataset.theme === next) return;

    const apply = () => {
      root.dataset.theme = next;
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        // Private mode: the theme still applies for this session.
      }
    };

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!document.startViewTransition || reduceMotion) {
      apply();
      return;
    }

    const x = origin?.x ?? window.innerWidth / 2;
    const y = origin?.y ?? window.innerHeight / 2;
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    root.style.setProperty("--reveal-x", `${x}px`);
    root.style.setProperty("--reveal-y", `${y}px`);
    root.style.setProperty("--reveal-r", `${radius}px`);

    document.startViewTransition(apply);
  }, []);

  const cycleTheme = useCallback(
    (origin?: RevealOrigin) => {
      const current = readTheme();
      const index = THEMES.findIndex((entry) => entry.id === current);
      setTheme(THEMES[(index + 1) % THEMES.length].id, origin);
    },
    [setTheme],
  );

  return { theme, setTheme, cycleTheme };
}
