"use client";

import { ShieldCheck } from "lucide-react";
import { motion, useInView } from "motion/react";
import { useId, useRef } from "react";
import { useMounted } from "@/lib/live";
import { Card } from "../ui/Card";
import { CountUp } from "../ui/CountUp";
import styles from "./widgets.module.css";

const PASS_RATE = 98.7;
const RING_RADIUS = 84;

function greeting(hour: number) {
  if (hour < 5) return "Burning the midnight oil";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/** The one hero figure on Mission Control. */
export function PassRateHero() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const mounted = useMounted();
  const gradientId = useId().replace(/[^a-zA-Z0-9]/g, "");

  return (
    <Card span={4} tall index={0} className={styles.heroCard}>
      <div ref={ref} className={styles.hero}>
        <p className={styles.heroGreeting}>{mounted ? greeting(new Date().getHours()) : "Welcome back"}, operator.</p>

        <div className={styles.heroRing}>
          <svg viewBox="0 0 200 200" aria-hidden>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="var(--accent)" />
                <stop offset="100%" stopColor="var(--accent-2)" />
              </linearGradient>
            </defs>
            <circle cx="100" cy="100" r={RING_RADIUS} className={styles.heroTrack} />
            <motion.circle
              cx="100"
              cy="100"
              r={RING_RADIUS}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth="10"
              strokeLinecap="round"
              transform="rotate(-90 100 100)"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: inView ? PASS_RATE / 100 : 0 }}
              transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              className={styles.heroArc}
            />
            <g className={styles.heroOrbit}>
              <circle cx="100" cy={100 - RING_RADIUS - 14} r="3" className={styles.heroSatellite} />
            </g>
          </svg>
          <div className={styles.heroFigure}>
            <CountUp value={PASS_RATE} format="percent" className={styles.heroValue} />
            <span className={styles.heroCaption}>overall pass rate · 7 days</span>
          </div>
        </div>

        <p className={styles.heroDelta}>
          <ShieldCheck size={15} />
          +0.4 pts vs the prior week. Ledger is carrying the team again.
        </p>

        <dl className={styles.heroStats}>
          <div>
            <dt>Suites</dt>
            <dd>312</dd>
          </div>
          <div>
            <dt>Tests</dt>
            <dd>4,812</dd>
          </div>
          <div>
            <dt>Blocked deploys</dt>
            <dd>0</dd>
          </div>
        </dl>
      </div>
    </Card>
  );
}
