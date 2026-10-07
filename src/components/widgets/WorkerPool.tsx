"use client";

import { Check, Cpu, X } from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { useInterval } from "@/lib/live";
import { WORKER_COUNT, initialWorkers, seededRandom, type WorkerState } from "@/lib/mock";
import { Card } from "../ui/Card";
import styles from "./widgets.module.css";

const TICK_MS = 700;
const CHANGES_PER_TICK = 7;

const LABEL: Record<WorkerState, string> = { idle: "Idle", running: "Running", passed: "Passed", failed: "Failed" };

function nextState(state: WorkerState, roll: number): WorkerState {
  if (state === "running") return roll < 0.92 ? "passed" : "failed";
  return roll < 0.85 ? "running" : "idle";
}

export function WorkerPool({ index, paused }: { index: number; paused: boolean }) {
  const [workers, setWorkers] = useState<WorkerState[]>(initialWorkers);
  const random = useRef(seededRandom(77));

  useInterval(
    () => {
      setWorkers((current) => {
        const next = [...current];
        for (let change = 0; change < CHANGES_PER_TICK; change++) {
          const worker = Math.floor(random.current() * WORKER_COUNT);
          next[worker] = nextState(next[worker], random.current());
        }
        return next;
      });
    },
    paused ? null : TICK_MS,
  );

  const counts = workers.reduce(
    (tally, state) => ({ ...tally, [state]: tally[state] + 1 }),
    { idle: 0, running: 0, passed: 0, failed: 0 } as Record<WorkerState, number>,
  );

  return (
    <Card
      span={12}
      index={index}
      icon={Cpu}
      title="Worker pool"
      subtitle={`${counts.running} of ${WORKER_COUNT} workers busy`}
      table={{
        caption: "Worker states",
        columns: ["Worker", "State"],
        rows: workers.map((state, worker) => [`worker-${String(worker + 1).padStart(2, "0")}`, LABEL[state]]),
      }}
    >
      <div className={styles.pool}>
        <div className={styles.poolGrid}>
          {workers.map((state, worker) => (
            <motion.div
              key={worker}
              className={styles.workerCell}
              data-state={state}
              title={`worker-${String(worker + 1).padStart(2, "0")} · ${LABEL[state]}`}
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: (worker % 32) * 0.012 + Math.floor(worker / 32) * 0.08, type: "spring", stiffness: 400, damping: 22 }}
            >
              <motion.span
                key={state}
                className={styles.workerGlyph}
                initial={{ scale: 0.3, rotate: -40 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 18 }}
              >
                {state === "passed" && <Check size={12} strokeWidth={3} />}
                {state === "failed" && <X size={12} strokeWidth={3} />}
              </motion.span>
            </motion.div>
          ))}
        </div>
        <ul className={styles.poolLegend}>
          {(Object.keys(LABEL) as WorkerState[]).map((state) => (
            <li key={state}>
              <span className={styles.workerCell} data-state={state} data-mini />
              {LABEL[state]}
              <strong>{counts[state]}</strong>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
