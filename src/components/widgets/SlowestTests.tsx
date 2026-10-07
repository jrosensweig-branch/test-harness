"use client";

import { ArrowDownRight, ArrowUpRight, Snail } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { formatDuration } from "@/lib/format";
import { SLOWEST_TESTS, SUITES, seriesColor, type SuiteId } from "@/lib/mock";
import { Card } from "../ui/Card";
import styles from "./widgets.module.css";

export function SlowestTests({ index, suites }: { index: number; suites: SuiteId[] }) {
  const rows = SLOWEST_TESTS.filter((test) => suites.includes(test.suite));
  const max = Math.max(...SLOWEST_TESTS.map((test) => test.seconds));

  return (
    <Card
      span={12}
      index={index}
      icon={Snail}
      title="Slowest tests"
      subtitle="Median wall time · trend vs the previous period"
      table={{
        caption: "Slowest tests",
        columns: ["Test", "Suite", "Median", "Trend"],
        rows: rows.map((test) => [
          test.name,
          SUITES.find((suite) => suite.id === test.suite)?.label ?? test.suite,
          formatDuration(test.seconds),
          `${test.trend > 0 ? "+" : ""}${Math.round(test.trend * 100)}%`,
        ]),
      }}
    >
      <ol className={styles.leaderboard}>
        <AnimatePresence initial={false} mode="popLayout">
          {rows.map((test, rank) => {
            const suite = SUITES.find((entry) => entry.id === test.suite)!;
            const slower = test.trend > 0;
            return (
              <motion.li
                key={test.name}
                layout
                className={styles.leaderRow}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                viewport={{ once: true }}
                transition={{ delay: rank * 0.05, type: "spring", stiffness: 300, damping: 28 }}
              >
                <span className={styles.leaderRank}>{String(rank + 1).padStart(2, "0")}</span>
                <span className={styles.leaderName}>
                  <span className={styles.feedSwatch} style={{ background: seriesColor(suite.slot) }} />
                  <span className={styles.leaderTest} title={test.name}>
                    {test.name}
                  </span>
                  <span className={styles.leaderSuite}>{suite.label}</span>
                </span>
                <span className={styles.leaderBarTrack}>
                  <motion.span
                    className={styles.leaderBar}
                    style={{ background: seriesColor(suite.slot), originX: 0 }}
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: test.seconds / max }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, delay: 0.2 + rank * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  />
                </span>
                <span className={styles.leaderTime}>{formatDuration(test.seconds)}</span>
                <span className={styles.leaderTrend} data-tone={slower ? "bad" : "good"}>
                  {slower ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                  {Math.abs(Math.round(test.trend * 100))}%
                </span>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ol>
    </Card>
  );
}
