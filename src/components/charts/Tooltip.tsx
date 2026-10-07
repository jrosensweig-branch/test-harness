"use client";

import { AnimatePresence, motion } from "motion/react";
import styles from "./charts.module.css";

export type TooltipRow = { key: string; label: string; value: string; color?: string; keyShape?: "line" | "rect" };

type Props = {
  visible: boolean;
  x: number;
  y: number;
  /** Width of the chart container, used to flip the tooltip before it overflows. */
  containerWidth: number;
  title: string;
  rows: TooltipRow[];
};

/** Values lead (strong), labels follow (secondary); series are keyed with a short stroke, not a box. */
export function ChartTooltip({ visible, x, y, containerWidth, title, rows }: Props) {
  const flip = x > containerWidth * 0.62;
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={styles.tooltip}
          role="status"
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1, x: flip ? x - 14 : x + 14, y }}
          exit={{ opacity: 0, scale: 0.94 }}
          transition={{ type: "spring", stiffness: 700, damping: 40, opacity: { duration: 0.12 } }}
          style={{ translate: flip ? "-100% -50%" : "0 -50%" }}
        >
          <p className={styles.tooltipTitle}>{title}</p>
          {rows.map((row) => (
            <p key={row.key} className={styles.tooltipRow}>
              {row.color && <span className={styles.tooltipKey} data-shape={row.keyShape ?? "line"} style={{ background: row.color }} />}
              <span className={styles.tooltipValue}>{row.value}</span>
              <span className={styles.tooltipLabel}>{row.label}</span>
            </p>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
