"use client";

import { Gauge as GaugeIcon, Pause, Play, Radio } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { LineChart } from "@/components/charts/LineChart";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import ui from "@/components/ui/ui.module.css";
import { RunProgress } from "@/components/widgets/RunProgress";
import { Terminal } from "@/components/widgets/Terminal";
import { WorkerPool } from "@/components/widgets/WorkerPool";
import widgets from "@/components/widgets/widgets.module.css";
import { useInterval } from "@/lib/live";
import { THROUGHPUT_WINDOW, initialThroughput, seededRandom } from "@/lib/mock";

const TICK_SECONDS = 1;
const labels = Array.from({ length: THROUGHPUT_WINDOW }, (_, index) => {
  const secondsAgo = THROUGHPUT_WINDOW - 1 - index;
  return secondsAgo === 0 ? "now" : `−${secondsAgo}s`;
});
const random = seededRandom(5150);

export default function LiveOpsPage() {
  const [paused, setPaused] = useState(false);
  const [testsPerSecond, setTestsPerSecond] = useState(() => initialThroughput(42, 78));

  useInterval(
    () => {
      setTestsPerSecond((values) => {
        const last = values[values.length - 1];
        return [...values.slice(1), Math.max(10, last + (78 - last) * 0.25 + (random() - 0.5) * 26)];
      });
    },
    paused ? null : TICK_SECONDS * 1000,
  );

  return (
    <>
      <PageHeader
        eyebrow="Live ops"
        icon={Radio}
        title="Watch it run, in real time"
        description="Streaming output, the worker pool and run progress. Mock data, but the adrenaline is real."
      >
        <motion.button
          type="button"
          className={widgets.streamToggle}
          data-paused={paused}
          onClick={() => setPaused((value) => !value)}
          whileTap={{ scale: 0.94 }}
          aria-pressed={paused}
        >
          {paused ? <Play size={15} /> : <Pause size={15} />}
          {paused ? "Resume stream" : "Pause stream"}
        </motion.button>
      </PageHeader>

      <div className={ui.grid}>
        <Terminal index={0} paused={paused} />
        <RunProgress index={1} paused={paused} />
        <Card
          span={5}
          index={2}
          icon={GaugeIcon}
          title="Tests per second"
          subtitle="Across all workers, last 40 seconds"
          table={{
            caption: "Tests per second",
            columns: ["Sample", "Tests/s"],
            rows: labels.map((label, index) => [label, Math.round(testsPerSecond[index])]),
          }}
        >
          <LineChart
            series={[{ id: "tps", label: "Tests per second", color: "var(--series-1)", values: testsPerSecond }]}
            labels={labels}
            format="int"
            area
            live
            endLabels
            height={190}
            ariaLabel="Tests executed per second over the last 40 seconds"
          />
        </Card>
        <WorkerPool index={0} paused={paused} />
      </div>
    </>
  );
}
