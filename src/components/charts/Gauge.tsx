"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { latencyStatus } from "@/lib/mock";
import { StatusBadge } from "../ui/StatusBadge";
import { CountUp } from "../ui/CountUp";
import { arcPath } from "./scale";
import styles from "./charts.module.css";

const SIZE = 160;
const RADIUS = 62;
const SWEEP = (Math.PI * 4) / 3; // 240°
const START = -SWEEP / 2;

const STATUS_COLOR = { good: "var(--good)", warning: "var(--warning)", serious: "var(--serious)", critical: "var(--critical)" };

/**
 * Meter: the fill carries severity, the track is a lighter step of the same hue,
 * and the SLO is marked with a tick. The gauge spans 0 → 1.25×SLO.
 */
export function Gauge({ label, value, slo }: { label: string; value: number; slo: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const status = latencyStatus(value, slo);
  const color = STATUS_COLOR[status];
  const max = slo * 1.25;
  const fraction = Math.min(1, value / max);
  const sloAngle = START + SWEEP * (slo / max);
  const center = SIZE / 2;

  const tick = (angle: number, inner: number, outer: number) => ({
    x1: center + inner * Math.sin(angle),
    y1: center - inner * Math.cos(angle),
    x2: center + outer * Math.sin(angle),
    y2: center - outer * Math.cos(angle),
  });

  return (
    <div ref={ref} className={styles.gauge}>
      <div className={styles.gaugeFigure}>
        <svg viewBox={`0 0 ${SIZE} ${SIZE * 0.82}`} className={styles.gaugeSvg} role="img" aria-label={`${label} p95 latency ${value} ms against an SLO of ${slo} ms`}>
          <path
            d={arcPath(center, center, RADIUS, START, START + SWEEP)}
            fill="none"
            strokeWidth={10}
            strokeLinecap="round"
            style={{ stroke: `color-mix(in srgb, ${color} 18%, var(--surface-solid))` }}
          />
          <motion.path
            d={arcPath(center, center, RADIUS, START, START + SWEEP)}
            fill="none"
            stroke={color}
            strokeWidth={10}
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: inView ? fraction : 0 }}
            transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
          {Array.from({ length: 13 }, (_, index) => {
            const angle = START + (SWEEP * index) / 12;
            return <line key={index} {...tick(angle, RADIUS + 10, RADIUS + (index % 3 === 0 ? 15 : 13))} className={styles.gaugeTick} />;
          })}
          <line {...tick(sloAngle, RADIUS - 9, RADIUS + 16)} className={styles.gaugeSlo} />
        </svg>
        <div className={styles.gaugeReadout}>
          <p className={styles.gaugeValue}>
            <CountUp value={value} format="int" />
            <span className={styles.gaugeUnit}>ms</span>
          </p>
          <p className={styles.gaugeCaption}>p95 · SLO {slo} ms</p>
        </div>
      </div>
      <div className={styles.gaugeFooter}>
        <span className={styles.gaugeLabel}>{label}</span>
        <StatusBadge status={status} pulse={status === "critical" || status === "serious"} />
      </div>
    </div>
  );
}
