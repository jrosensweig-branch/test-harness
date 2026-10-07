"use client";

import { Check } from "lucide-react";
import { motion } from "motion/react";
import { THEMES, type ThemeId } from "@/lib/themes";
import { Scenery } from "../shell/Scenery";
import { THEME_ICONS } from "../shell/ThemeSwitcher";
import { useTheme } from "../shell/useTheme";
import { revealVariants } from "../ui/Card";
import { StatusBadge } from "../ui/StatusBadge";
import styles from "./themes.module.css";

const BARS = [
  [38, 52, 46, 70, 64, 82, 76],
  [22, 30, 28, 34, 40, 36, 44],
  [14, 18, 20, 16, 24, 22, 26],
  [8, 10, 9, 12, 11, 14, 13],
];

/**
 * A miniature dashboard rendered *inside* a data-theme scope, so it wears that
 * theme's tokens regardless of the page theme. Applying it uses the same reveal
 * transition as the top-bar switcher.
 */
export function ThemePreview({ id, index }: { id: ThemeId; index: number }) {
  const { theme, setTheme } = useTheme();
  const meta = THEMES.find((entry) => entry.id === id)!;
  const Icon = THEME_ICONS[id];
  const active = theme === id;

  return (
    <motion.article
      className={styles.previewCard}
      data-active={active}
      variants={revealVariants}
      custom={index}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, amount: 0.2 }}
      whileHover={{ y: -6 }}
    >
      <MiniDashboard id={id} />

      <footer className={styles.previewFooter}>
        <div>
          <h2 className={styles.previewName}>
            <Icon size={16} /> {meta.label}
          </h2>
          <p className={styles.previewTagline}>{meta.tagline}</p>
        </div>
        <motion.button
          type="button"
          className={styles.applyButton}
          data-active={active}
          disabled={active}
          onClick={(event) => setTheme(id, { x: event.clientX, y: event.clientY })}
          whileTap={{ scale: 0.92 }}
        >
          {active ? (
            <>
              <Check size={15} /> Active
            </>
          ) : (
            "Apply"
          )}
        </motion.button>
      </footer>
    </motion.article>
  );
}

/** The themed miniature itself, rendered inside its own data-theme scope. Also used by the explainer video. */
export function MiniDashboard({ id, className }: { id: ThemeId; className?: string }) {
  return (
    <div className={`${styles.preview} ${className ?? ""}`} data-theme={id}>
      <Scenery variant={id} />

      <div className={styles.miniShell}>
        <div className={styles.miniTopbar}>
          <span className={styles.miniBrand}>{id === "crt" ? ">_ harness" : "Test Harness"}</span>
          <span className={styles.miniPill}>Live</span>
        </div>

        <div className={styles.miniGrid}>
          <div className={styles.miniCard}>
            <p className={styles.miniLabel}>Pass rate</p>
            <p className={styles.miniValue}>98.7%</p>
            <StatusBadge status="good" label="Healthy" />
          </div>
          <div className={styles.miniCard}>
            <p className={styles.miniLabel}>Runs by suite</p>
            <div className={styles.miniBars}>
              {BARS[0].map((_, column) => (
                <div key={column} className={styles.miniColumn}>
                  {BARS.map((series, slot) => (
                    <motion.span
                      key={slot}
                      style={{ background: `var(--series-${slot + 1})`, height: `${series[column] * 0.5}%` }}
                      initial={{ scaleY: 0 }}
                      whileInView={{ scaleY: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + column * 0.05 + slot * 0.03, duration: 0.5 }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.miniSwatches}>
          {[1, 2, 3, 4].map((slot) => (
            <span key={slot} style={{ background: `var(--series-${slot})` }} title={`Series ${slot}`} />
          ))}
          <span className={styles.miniType}>Aa</span>
        </div>
      </div>
    </div>
  );
}
