"use client";

import { AnimatePresence, motion, useInView } from "motion/react";
import { useRef, useState } from "react";
import { formatValue, type ValueFormat } from "@/lib/format";
import { arcPath } from "./scale";
import styles from "./charts.module.css";

type Slice = { id: string; label: string; value: number; color: string };

const SIZE = 200;
const RADIUS = 78;
const THICKNESS = 22;
const SURFACE_GAP_PX = 3;

/** Part-to-whole for ≤6 slices. Hovering a slice (or its legend row) swaps the center readout. */
export function Donut({ data, format, centerLabel }: { data: Slice[]; format: ValueFormat; centerLabel: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const [active, setActive] = useState<string | null>(null);

  const total = data.reduce((sum, slice) => sum + slice.value, 0);
  const gapAngle = SURFACE_GAP_PX / RADIUS;
  const arcs = data.map((slice, index) => {
    const before = data.slice(0, index).reduce((sum, previous) => sum + previous.value, 0);
    const angle = (before / total) * Math.PI * 2;
    const sweep = (slice.value / total) * Math.PI * 2;
    return { ...slice, start: angle + gapAngle / 2, end: angle + sweep - gapAngle / 2, fraction: before / total };
  });

  const focused = data.find((slice) => slice.id === active);

  return (
    <div ref={ref} className={styles.donutLayout}>
      <div className={styles.donutFigure}>
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className={styles.donutSvg} role="img" aria-label={`${centerLabel}: ${data.map((slice) => `${slice.label} ${slice.value}`).join(", ")}`}>
          <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} className={styles.donutTrack} strokeWidth={THICKNESS} fill="none" />
          {arcs.map((arc) => (
            <motion.path
              key={arc.id}
              d={arcPath(SIZE / 2, SIZE / 2, RADIUS, arc.start, arc.end)}
              fill="none"
              stroke={arc.color}
              strokeLinecap="butt"
              initial={{ pathLength: 0, strokeWidth: THICKNESS }}
              animate={{
                pathLength: inView ? 1 : 0,
                strokeWidth: active === arc.id ? THICKNESS + 8 : THICKNESS,
                opacity: active && active !== arc.id ? 0.35 : 1,
              }}
              transition={{
                pathLength: { duration: 0.6, ease: [0.65, 0, 0.35, 1], delay: 0.2 + arc.fraction * 0.9 },
                strokeWidth: { type: "spring", stiffness: 400, damping: 22 },
                opacity: { duration: 0.15 },
              }}
              onPointerEnter={() => setActive(arc.id)}
              onPointerLeave={() => setActive(null)}
              className={styles.donutArc}
            />
          ))}
        </svg>
        <div className={styles.donutCenter} aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={focused?.id ?? "total"}
              initial={{ opacity: 0, y: 6, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.9 }}
              transition={{ duration: 0.16 }}
            >
              <p className={styles.donutValue}>{formatValue(focused?.value ?? total, format)}</p>
              <p className={styles.donutLabel}>
                {focused ? `${focused.label} · ${Math.round((focused.value / total) * 100)}%` : centerLabel}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <ul className={styles.donutLegend}>
        {data.map((slice) => (
          <li
            key={slice.id}
            className={styles.donutLegendRow}
            data-active={active === slice.id}
            onPointerEnter={() => setActive(slice.id)}
            onPointerLeave={() => setActive(null)}
          >
            <span className={styles.legendKey} data-shape="rect" style={{ background: slice.color }} />
            <span className={styles.legendLabel}>{slice.label}</span>
            <span className={styles.donutLegendValue}>{formatValue(slice.value, format)}</span>
            <span className={styles.donutLegendShare}>{Math.round((slice.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
