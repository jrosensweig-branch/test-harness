"use client";

import { CircleCheck, CircleX, GitBranch, LoaderCircle, Rows3 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { formatDuration } from "@/lib/format";
import { useInterval } from "@/lib/live";
import { INITIAL_FEED, SUITES, makeFeedRun, seededRandom, seriesColor, type FeedRun } from "@/lib/mock";
import { Card } from "../ui/Card";
import styles from "./widgets.module.css";

const VISIBLE = 6;
const TICK_MS = 2800;

const STATUS = {
  passed: { icon: CircleCheck, label: "Passed" },
  failed: { icon: CircleX, label: "Failed" },
  running: { icon: LoaderCircle, label: "Running" },
};

export function RunFeed({ index }: { index: number }) {
  const [runs, setRuns] = useState<FeedRun[]>(INITIAL_FEED);
  const random = useRef(seededRandom(4242));
  const nextId = useRef(INITIAL_FEED.length);

  useInterval(() => {
    setRuns((previous) => {
      // Whatever was running resolves, then a fresh run lands on top.
      const resolved = previous.map((run) =>
        run.status === "running" ? { ...run, status: random.current() < 0.85 ? ("passed" as const) : ("failed" as const) } : run,
      );
      return [makeFeedRun(nextId.current++, random.current), ...resolved].slice(0, VISIBLE);
    });
  }, TICK_MS);

  return (
    <Card
      span={7}
      index={index}
      icon={Rows3}
      title="Live run feed"
      subtitle="New runs land every few seconds"
      table={{
        caption: "Most recent runs",
        columns: ["Suite", "Branch", "Status", "Tests", "Duration"],
        rows: runs.map((run) => [
          SUITES.find((suite) => suite.id === run.suite)?.label ?? run.suite,
          run.branch,
          STATUS[run.status].label,
          run.tests,
          formatDuration(run.durationSeconds),
        ]),
      }}
    >
      <ul className={styles.feed}>
        <AnimatePresence initial={false}>
          {runs.map((run) => {
            const suite = SUITES.find((entry) => entry.id === run.suite)!;
            const status = STATUS[run.status];
            const Icon = status.icon;
            return (
              <motion.li
                key={run.id}
                layout
                className={styles.feedRow}
                initial={{ opacity: 0, y: -24, scale: 0.96, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              >
                <span className={styles.feedSuite}>
                  <span className={styles.feedSwatch} style={{ background: seriesColor(suite.slot) }} />
                  {suite.label}
                </span>
                <span className={styles.feedBranch}>
                  <GitBranch size={13} />
                  {run.branch}
                </span>
                <span className={styles.feedStatus} data-status={run.status}>
                  <Icon size={14} className={run.status === "running" ? styles.spin : undefined} />
                  {status.label}
                </span>
                <span className={styles.feedMeta}>{run.tests.toLocaleString("en-US")} tests</span>
                <span className={styles.feedMeta}>{formatDuration(run.durationSeconds)}</span>
                {run.status === "running" && <span className={styles.feedProgress} />}
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </Card>
  );
}
