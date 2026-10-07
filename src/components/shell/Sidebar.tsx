"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "./BrandMark";
import { NAV } from "./nav";
import styles from "./shell.module.css";

const fade = {
  initial: { opacity: 0, x: -6 },
  animate: { opacity: 1, x: 0, transition: { delay: 0.12 } },
  exit: { opacity: 0, x: -6, transition: { duration: 0.12 } },
};

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar} aria-label="Primary">
      <Link href="/" className={styles.brand} aria-label="Test Harness home">
        <BrandMark />
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.span className={styles.brandText} {...fade}>
              <span className={styles.brandName}>Test Harness</span>
              <span className={styles.brandMeta}>v0.1 · mock data</span>
            </motion.span>
          )}
        </AnimatePresence>
      </Link>

      <nav className={styles.nav}>
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.p className={styles.navHeading} {...fade}>
              Dashboards
            </motion.p>
          )}
        </AnimatePresence>
        {NAV.map((item, index) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * index, type: "spring", stiffness: 380, damping: 30 }}
            >
              <Link
                href={item.href}
                className={styles.navItem}
                data-active={active}
                aria-current={active ? "page" : undefined}
                title={collapsed ? item.label : undefined}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className={styles.navActive}
                    transition={{ type: "spring", stiffness: 520, damping: 40 }}
                  />
                )}
                <motion.span className={styles.navIcon} whileHover={{ rotate: [0, -12, 10, 0], scale: 1.1 }}>
                  <Icon size={18} strokeWidth={1.8} />
                </motion.span>
                <AnimatePresence initial={false}>
                  {!collapsed && (
                    <motion.span className={styles.navLabel} {...fade}>
                      {item.label}
                      <kbd className={styles.kbd}>G {item.jumpKey.toUpperCase()}</kbd>
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      <div className={styles.sidebarFooter}>
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div className={styles.shortcutCard} {...fade}>
              <span>
                <kbd className={styles.kbd}>⌘K</kbd> command
              </span>
              <span>
                <kbd className={styles.kbd}>T</kbd> theme
              </span>
              <span>
                <kbd className={styles.kbd}>[</kbd> sidebar
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          type="button"
          className={styles.collapseButton}
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>
    </aside>
  );
}
