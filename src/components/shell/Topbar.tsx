"use client";

import { Search } from "lucide-react";
import { AnimatePresence, motion, useScroll, useSpring } from "motion/react";
import { usePathname } from "next/navigation";
import { navItemFor } from "./nav";
import { ThemeSwitcher } from "./ThemeSwitcher";
import styles from "./shell.module.css";

export function Topbar({ onOpenPalette }: { onOpenPalette: () => void }) {
  const pathname = usePathname();
  const current = navItemFor(pathname);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 220, damping: 32, restDelta: 0.001 });

  return (
    <header className={styles.topbar}>
      <div className={styles.crumbs}>
        <span className={styles.crumbRoot}>harness</span>
        <span className={styles.crumbSlash}>/</span>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={current.href}
            className={styles.crumbCurrent}
            initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
            transition={{ duration: 0.22 }}
          >
            {current.label}
          </motion.span>
        </AnimatePresence>
      </div>

      <div className={styles.topActions}>
        <button type="button" className={styles.searchButton} onClick={onOpenPalette}>
          <Search size={15} />
          <span className={styles.searchLabel}>Jump to…</span>
          <kbd className={styles.kbd}>⌘K</kbd>
        </button>
        <span className={styles.liveBadge}>
          <span className={styles.liveDot} />
          Live
        </span>
        <ThemeSwitcher />
      </div>

      <motion.div className={styles.scrollProgress} style={{ scaleX: progress }} aria-hidden />
    </header>
  );
}
