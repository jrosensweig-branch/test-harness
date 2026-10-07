"use client";

import { MotionConfig } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Backdrop } from "./Backdrop";
import { CommandPalette } from "./CommandPalette";
import { MobileDock } from "./MobileDock";
import { NAV } from "./nav";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useTheme } from "./useTheme";
import styles from "./shell.module.css";

const COLLAPSE_STORAGE_KEY = "harness-sidebar-collapsed";
const JUMP_WINDOW_MS = 1200;

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { cycleTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const jumpArmedAt = useRef(0);

  useEffect(() => {
    // Restore after mount so server and client agree on the first render.
    if (localStorage.getItem(COLLAPSE_STORAGE_KEY) === "true") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore of a persisted preference
      setCollapsed(true);
    }
  }, []);

  const toggleSidebar = useCallback(() => {
    setCollapsed((previous) => {
      localStorage.setItem(COLLAPSE_STORAGE_KEY, String(!previous));
      return !previous;
    });
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
        return;
      }
      if (paletteOpen || isTypingTarget(event.target) || event.metaKey || event.ctrlKey || event.altKey) return;

      const key = event.key.toLowerCase();
      if (Date.now() - jumpArmedAt.current < JUMP_WINDOW_MS) {
        jumpArmedAt.current = 0;
        const destination = NAV.find((item) => item.jumpKey === key);
        if (destination) {
          event.preventDefault();
          router.push(destination.href);
        }
        return;
      }

      switch (key) {
        case "/":
          event.preventDefault();
          setPaletteOpen(true);
          break;
        case "g":
          jumpArmedAt.current = Date.now();
          break;
        case "t":
          cycleTheme();
          break;
        case "[":
          toggleSidebar();
          break;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [paletteOpen, router, cycleTheme, toggleSidebar]);

  return (
    <MotionConfig reducedMotion="user">
      <Backdrop />
      <div className={styles.shell} data-collapsed={collapsed}>
        <Sidebar collapsed={collapsed} onToggle={toggleSidebar} />
        <div className={styles.main}>
          <Topbar onOpenPalette={() => setPaletteOpen(true)} />
          <main className={styles.content}>{children}</main>
        </div>
      </div>
      <MobileDock />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} onToggleSidebar={toggleSidebar} />
    </MotionConfig>
  );
}
