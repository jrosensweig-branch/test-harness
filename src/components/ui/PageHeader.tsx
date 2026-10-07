"use client";

import type { LucideIcon } from "lucide-react";
import { motion, useScroll, useTransform } from "motion/react";
import styles from "./ui.module.css";

type Props = {
  eyebrow: string;
  icon: LucideIcon;
  title: string;
  description: string;
  children?: React.ReactNode;
};

/** Page title with a word-by-word mask reveal and a gentle parallax fade as the page scrolls. */
export function PageHeader({ eyebrow, icon: Icon, title, description, children }: Props) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 320], [0, 70]);
  const opacity = useTransform(scrollY, [0, 260], [1, 0.15]);
  const words = title.split(" ");

  return (
    <motion.header className={styles.pageHeader} style={{ y, opacity }}>
      <div className={styles.pageHeaderText}>
        <motion.p
          className={styles.eyebrow}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Icon size={14} strokeWidth={2.2} />
          {eyebrow}
        </motion.p>
        <h1 className={styles.pageTitle} aria-label={title}>
          {words.map((word, index) => (
            <span key={`${word}-${index}`} className={styles.wordMask} aria-hidden>
              <motion.span
                className={styles.word}
                initial={{ y: "110%", rotate: 4 }}
                animate={{ y: "0%", rotate: 0 }}
                transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1], delay: 0.08 + index * 0.08 }}
              >
                {word}
              </motion.span>
            </span>
          ))}
          <span className={styles.caret} aria-hidden />
        </h1>
        <motion.p
          className={styles.pageDescription}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          {description}
        </motion.p>
      </div>
      {children && (
        <motion.div
          className={styles.pageHeaderSlot}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          {children}
        </motion.div>
      )}
    </motion.header>
  );
}
