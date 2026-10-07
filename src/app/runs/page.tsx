"use client";

import { CalendarRange, ChartColumnStacked, FlaskConical, Grid3x3, Hourglass, ListChecks } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { ColumnChart } from "@/components/charts/ColumnChart";
import { Heatmap } from "@/components/charts/Heatmap";
import { Card } from "@/components/ui/Card";
import { CountUp } from "@/components/ui/CountUp";
import { PageHeader } from "@/components/ui/PageHeader";
import { Segmented } from "@/components/ui/Segmented";
import ui from "@/components/ui/ui.module.css";
import { PipelineGantt } from "@/components/widgets/PipelineGantt";
import { SlowestTests } from "@/components/widgets/SlowestTests";
import widgets from "@/components/widgets/widgets.module.css";
import {
  RANGES,
  SUITES,
  WEEKDAYS,
  durationHistogram,
  failureHeatmap,
  hourLabel,
  runsByBucket,
  seriesColor,
  type RangeKey,
  type SuiteId,
} from "@/lib/mock";

type Filters = { range: RangeKey; suites: SuiteId[] };

const REFETCH_MS = 420;
const HOURS = Array.from({ length: 24 }, (_, hour) => hourLabel(hour));

export default function TestRunsPage() {
  // `pending` drives the controls immediately; `applied` drives the charts after a simulated refetch.
  const [pending, setPending] = useState<Filters>({ range: "7d", suites: SUITES.map((suite) => suite.id) });
  const [applied, setApplied] = useState<Filters>(pending);
  const refetching = pending !== applied;

  useEffect(() => {
    if (pending === applied) return;
    const timer = window.setTimeout(() => setApplied(pending), REFETCH_MS);
    return () => window.clearTimeout(timer);
  }, [pending, applied]);

  const toggleSuite = (id: SuiteId) => {
    setPending((current) => {
      const has = current.suites.includes(id);
      if (has && current.suites.length === 1) return current; // keep at least one suite selected
      return { ...current, suites: has ? current.suites.filter((suite) => suite !== id) : [...current.suites, id] };
    });
  };

  const volume = useMemo(() => runsByBucket(applied.range), [applied.range]);
  // Filtered-out suites keep their slot but drop to zero, so survivors never repaint.
  const volumeSeries = volume.perSuite.map((series) =>
    applied.suites.includes(series.id as SuiteId) ? series : { ...series, values: series.values.map(() => 0) },
  );
  const heatmap = useMemo(() => failureHeatmap(applied.range, applied.suites), [applied]);
  const histogram = useMemo(() => durationHistogram(applied.range, applied.suites), [applied]);

  const totalRuns = volumeSeries.reduce((sum, series) => sum + series.values.reduce((a, b) => a + b, 0), 0);
  const totalFailures = heatmap.flat().reduce((sum, value) => sum + value, 0);
  const passRate = 100 - (totalFailures / Math.max(totalRuns * 9, 1)) * 100;
  const rangeLabel = RANGES.find((range) => range.id === applied.range)!.label.toLowerCase();

  return (
    <>
      <PageHeader
        eyebrow="Test runs"
        icon={FlaskConical}
        title="Every run, every suite, no mercy"
        description="Volume, failure hot spots, durations and the slowest offenders. Filters scope every widget on the page."
      />

      <motion.div
        className={widgets.filterRow}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <span className={widgets.filterLabel}>
          <CalendarRange size={14} /> Range
        </span>
        <Segmented
          label="Date range"
          layoutId="runs-range"
          options={RANGES}
          value={pending.range}
          onChange={(range) => setPending((current) => ({ ...current, range }))}
        />
        <span className={widgets.filterLabel}>Suites</span>
        {SUITES.map((suite) => (
          <motion.button
            key={suite.id}
            type="button"
            className={ui.chip}
            aria-pressed={pending.suites.includes(suite.id)}
            onClick={() => toggleSuite(suite.id)}
            whileTap={{ scale: 0.92 }}
          >
            <span className={ui.chipSwatch} style={{ background: seriesColor(suite.slot) }} />
            {suite.label}
          </motion.button>
        ))}
      </motion.div>

      <motion.div className={ui.grid} animate={{ opacity: refetching ? 0.55 : 1 }} transition={{ duration: 0.2 }} aria-busy={refetching}>
        <Card
          span={8}
          index={0}
          icon={ChartColumnStacked}
          title="Run volume"
          subtitle={`Runs per ${applied.range === "24h" ? "hour" : "day"} by suite, ${rangeLabel}`}
          table={{
            caption: "Run volume by suite",
            columns: ["Bucket", ...volumeSeries.map((series) => series.label)],
            rows: volume.labels.map((label, index) => [label, ...volumeSeries.map((series) => series.values[index])]),
          }}
        >
          <ColumnChart
            labels={volume.labels}
            series={volumeSeries}
            legendIds={applied.suites}
            format="int"
            height={280}
            ariaLabel={`Run volume by suite, ${rangeLabel}`}
          />
        </Card>

        <Card span={4} index={1} icon={ListChecks} title="At a glance" subtitle={`Selected suites, ${rangeLabel}`}>
          <dl className={widgets.summary}>
            <div className={widgets.summaryItem}>
              <dt>Runs</dt>
              <dd>
                <CountUp value={totalRuns} format="int" />
              </dd>
            </div>
            <div className={widgets.summaryItem}>
              <dt>Failed tests</dt>
              <dd>
                <CountUp value={totalFailures} format="int" />
              </dd>
            </div>
            <div className={widgets.summaryItem}>
              <dt>Pass rate</dt>
              <dd>
                <CountUp value={passRate} format="percent" />
              </dd>
            </div>
            <div className={widgets.summaryItem}>
              <dt>Suites in view</dt>
              <dd>
                {applied.suites.length} / {SUITES.length}
              </dd>
            </div>
          </dl>
        </Card>

        <Card
          span={7}
          index={0}
          icon={Grid3x3}
          title="When things break"
          subtitle="Failed tests by weekday and hour (UTC)"
          table={{
            caption: "Failed tests by weekday and hour",
            columns: ["Day", ...HOURS],
            rows: heatmap.map((row, day) => [WEEKDAYS[day], ...row]),
          }}
        >
          <Heatmap
            rowLabels={WEEKDAYS}
            columnLabels={HOURS}
            values={heatmap}
            valueLabel="failed tests"
            ariaLabel="Heatmap of failed tests by weekday and hour"
          />
        </Card>

        <Card
          span={5}
          index={1}
          icon={Hourglass}
          title="Suite duration"
          subtitle="How long runs take, distribution"
          table={{
            caption: "Run duration distribution",
            columns: ["Duration", "Runs"],
            rows: histogram.map((bucket) => [bucket.label, bucket.value]),
          }}
        >
          <ColumnChart
            labels={histogram.map((bucket) => bucket.label)}
            series={[{ id: "runs", label: "Runs", color: "var(--series-1)", values: histogram.map((bucket) => bucket.value) }]}
            format="int"
            adjacent
            height={250}
            ariaLabel="Distribution of run durations"
          />
        </Card>

        <PipelineGantt index={0} />
        <SlowestTests index={0} suites={applied.suites} />
      </motion.div>
    </>
  );
}
