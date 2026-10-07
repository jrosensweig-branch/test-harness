"use client";

import { CircleCheck, CircleX, CircleSlash, Rocket } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useId, useState } from "react";
import { formatDuration } from "@/lib/format";
import { useInterval } from "@/lib/live";
import { LIVE_TOTAL_TESTS } from "@/lib/mock";
import { Card } from "../ui/Card";
import styles from "./widgets.module.css";

const TICK_MS = 400;
const PER_TICK = 31;
const RADIUS = 80;
const CONFETTI = Array.from({ length: 28 }, (_, index) => {
  const angle = (index / 28) * Math.PI * 2;
  const distance = 90 + (index % 5) * 18;
  return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance, rotate: index * 47, slot: (index % 4) + 1 };
});

type RunState = { run: number; done: number; finishedAt: number | null };

export function RunProgress({ index, paused }: { index: number; paused: boolean }) {
  const [state, setState] = useState<RunState>({ run: 4822, done: 2988, finishedAt: null });
  const gradientId = useId().replace(/[^a-zA-Z0-9]/g, "");

  useInterval(
    () => {
      setState((current) => {
        if (current.finishedAt !== null) {
          // Hold the celebration for a few ticks, then kick off the next run.
          return current.finishedAt >= 6 ? { run: current.run + 1, done: 0, finishedAt: null } : { ...current, finishedAt: current.finishedAt + 1 };
        }
        const done = Math.min(LIVE_TOTAL_TESTS, current.done + PER_TICK);
        return { ...current, done, finishedAt: done === LIVE_TOTAL_TESTS ? 0 : null };
      });
    },
    paused ? null : TICK_MS,
  );

  const fraction = state.done / LIVE_TOTAL_TESTS;
  const failed = Math.floor(state.done * 0.004);
  const skipped = Math.floor(state.done * 0.012);
  const passed = state.done - failed - skipped;
  const remainingSeconds = ((LIVE_TOTAL_TESTS - state.done) / PER_TICK) * (TICK_MS / 1000);
  const complete = state.finishedAt !== null;

  return (
    <Card span={5} index={index} icon={Rocket} title={`Run #${state.run}`} subtitle="Full regression · 4 suites · 64 workers">
      <div className={styles.progress}>
        <div className={styles.progressRing}>
          <svg viewBox="0 0 200 200" aria-hidden>
            <defs>
              <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" />
                <stop offset="100%" stopColor="var(--accent-2)" />
              </linearGradient>
            </defs>
            <circle cx="100" cy="100" r={RADIUS} className={styles.heroTrack} />
            <motion.circle
              cx="100"
              cy="100"
              r={RADIUS}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth="10"
              strokeLinecap="round"
              transform="rotate(-90 100 100)"
              animate={{ pathLength: fraction }}
              transition={{ duration: state.done === 0 ? 0.6 : TICK_MS / 1000, ease: "linear" }}
              className={styles.heroArc}
            />
          </svg>
          <div className={styles.progressCenter} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(fraction * 100)}>
            <AnimatePresence mode="wait">
              {complete ? (
                <motion.p key="done" className={styles.progressDone} initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}>
                  Done!
                </motion.p>
              ) : (
                <motion.p key="pct" className={styles.progressPct} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {Math.round(fraction * 100)}%
                </motion.p>
              )}
            </AnimatePresence>
            <p className={styles.progressEta}>{complete ? "next run starting…" : `ETA ${formatDuration(remainingSeconds)}`}</p>
          </div>

          <AnimatePresence>
            {complete && state.finishedAt !== null && state.finishedAt < 4 && (
              <div className={styles.confetti} aria-hidden>
                {CONFETTI.map((piece, pieceIndex) => (
                  <motion.span
                    key={pieceIndex}
                    style={{ background: `var(--series-${piece.slot})` }}
                    initial={{ x: 0, y: 0, scale: 0, rotate: 0, opacity: 1 }}
                    animate={{ x: piece.x, y: piece.y, scale: 1, rotate: piece.rotate, opacity: 0 }}
                    transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        <dl className={styles.progressCounts}>
          <div>
            <dt>
              <CircleCheck size={14} className={styles.good} /> Passed
            </dt>
            <dd>{passed.toLocaleString("en-US")}</dd>
          </div>
          <div>
            <dt>
              <CircleX size={14} className={styles.bad} /> Failed
            </dt>
            <dd>{failed.toLocaleString("en-US")}</dd>
          </div>
          <div>
            <dt>
              <CircleSlash size={14} className={styles.skip} /> Skipped
            </dt>
            <dd>{skipped.toLocaleString("en-US")}</dd>
          </div>
        </dl>
      </div>
    </Card>
  );
}
