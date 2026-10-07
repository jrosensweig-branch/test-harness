"use client";

import { Moon, Sun, Sunset, Terminal, type LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { THEMES, type ThemeId } from "@/lib/themes";
import { useTheme } from "./useTheme";
import styles from "./shell.module.css";

export const THEME_ICONS: Record<ThemeId, LucideIcon> = {
  light: Sun,
  dark: Moon,
  synthwave: Sunset,
  crt: Terminal,
};

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className={styles.themeSwitcher} role="radiogroup" aria-label="Theme">
      {THEMES.map((entry) => {
        const Icon = THEME_ICONS[entry.id];
        const active = theme === entry.id;
        return (
          <button
            key={entry.id}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={`${entry.label} theme`}
            title={entry.label}
            className={styles.themeOption}
            data-active={active}
            onClick={(event) => setTheme(entry.id, { x: event.clientX, y: event.clientY })}
          >
            {active && (
              <motion.span
                layoutId="theme-active"
                className={styles.themeActive}
                transition={{ type: "spring", stiffness: 500, damping: 36 }}
              />
            )}
            <motion.span className={styles.themeIcon} whileTap={{ scale: 0.8, rotate: -20 }}>
              <Icon size={15} strokeWidth={2} />
            </motion.span>
          </button>
        );
      })}
    </div>
  );
}
