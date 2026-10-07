"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "./nav";
import styles from "./shell.module.css";

export function MobileDock() {
  const pathname = usePathname();
  return (
    <nav className={styles.dock} aria-label="Primary (mobile)">
      {NAV.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={styles.dockItem}
            data-active={active}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
          >
            {active && (
              <motion.span layoutId="dock-active" className={styles.dockActive} transition={{ type: "spring", stiffness: 500, damping: 34 }} />
            )}
            <motion.span whileTap={{ scale: 0.82 }} className={styles.dockIcon}>
              <Icon size={20} />
            </motion.span>
          </Link>
        );
      })}
    </nav>
  );
}
