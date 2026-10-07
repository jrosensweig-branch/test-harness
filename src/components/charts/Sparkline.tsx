"use client";

import { motion, useInView } from "motion/react";
import { useElementWidth } from "@/lib/live";
import { linearScale, monotonePath } from "./scale";
import styles from "./charts.module.css";

/** 12-point trend in the de-emphasis ink, with the current period called out in the accent. */
export function Sparkline({ values, height = 40 }: { values: number[]; height?: number }) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = 5;
  const x = linearScale([0, values.length - 1], [pad, Math.max(pad, width - pad)]);
  const y = linearScale([min, max], [height - pad, pad]);
  const points = values.map((value, index) => [x(index), y(value)] as [number, number]);
  const line = monotonePath(points);
  const last = points[points.length - 1];

  return (
    <div ref={ref} className={styles.sparkline} style={{ height }} aria-hidden>
      {width > 20 && (
        <svg width={width} height={height}>
          <motion.path
            d={`${line}L${last[0]},${height}L${points[0][0]},${height}Z`}
            className={styles.sparkArea}
            initial={{ opacity: 0 }}
            animate={{ opacity: inView ? 1 : 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          />
          <motion.path
            d={line}
            fill="none"
            className={styles.sparkLine}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: inView ? 1 : 0 }}
            transition={{ duration: 1.1, ease: [0.65, 0, 0.35, 1] }}
          />
          <motion.circle
            cx={last[0]}
            cy={last[1]}
            r={4}
            className={styles.sparkDot}
            initial={{ scale: 0 }}
            animate={{ scale: inView ? 1 : 0 }}
            transition={{ delay: 1, type: "spring", stiffness: 500, damping: 15 }}
          />
        </svg>
      )}
    </div>
  );
}
