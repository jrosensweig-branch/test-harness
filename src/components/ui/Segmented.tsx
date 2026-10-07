"use client";

import { motion } from "motion/react";
import styles from "./ui.module.css";

type Option<T extends string> = { id: T; label: string };

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  layoutId,
}: {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  layoutId: string;
}) {
  return (
    <div className={styles.segmented} role="radiogroup" aria-label={label}>
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={active}
            className={styles.segment}
            data-active={active}
            onClick={() => onChange(option.id)}
          >
            {active && (
              <motion.span layoutId={layoutId} className={styles.segmentActive} transition={{ type: "spring", stiffness: 520, damping: 38 }} />
            )}
            <span className={styles.segmentLabel}>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
