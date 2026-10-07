"use client";

import { Activity, ChartSpline, Gauge, PieChart } from "lucide-react";
import { Donut } from "@/components/charts/Donut";
import { LineChart } from "@/components/charts/LineChart";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EnvironmentList } from "@/components/widgets/EnvironmentList";
import { PassRateHero } from "@/components/widgets/PassRateHero";
import { RunFeed } from "@/components/widgets/RunFeed";
import { StatTile } from "@/components/widgets/StatTile";
import { Ticker } from "@/components/widgets/Ticker";
import ui from "@/components/ui/ui.module.css";
import { formatValue } from "@/lib/format";
import {
  EXECUTIONS_PER_HOUR,
  FAILURE_CAUSES,
  KPIS,
  PASS_RATE_LABELS,
  PASS_RATE_SERIES,
  TICKER_ITEMS,
  hourLabel,
  seriesColor,
} from "@/lib/mock";

const hourLabels = EXECUTIONS_PER_HOUR.map((_, hour) => hourLabel(hour));

export default function MissionControlPage() {
  return (
    <>
      <PageHeader
        eyebrow="Mission control"
        icon={Gauge}
        title="Mostly green, suspiciously calm"
        description="Pass rates, volume and the live run feed across every suite the harness drives."
      >
        <StatusBadge status="good" label="312 suites reporting" />
        <StatusBadge status="critical" label="perf-lab failing" pulse />
      </PageHeader>

      <div className={ui.grid}>
        <PassRateHero />
        {KPIS.map((kpi, index) => (
          <StatTile key={kpi.id} kpi={kpi} index={index + 1} />
        ))}

        <Ticker items={TICKER_ITEMS} />

        <Card
          span={8}
          index={0}
          icon={ChartSpline}
          title="Pass rate by suite"
          subtitle="Daily, last 14 days"
          table={{
            caption: "Pass rate by suite, last 14 days",
            columns: ["Day", ...PASS_RATE_SERIES.map((series) => series.label)],
            rows: PASS_RATE_LABELS.map((label, day) => [
              label,
              ...PASS_RATE_SERIES.map((series) => formatValue(series.values[day], "percent")),
            ]),
          }}
        >
          <LineChart
            series={PASS_RATE_SERIES}
            labels={PASS_RATE_LABELS}
            format="percent"
            zeroBaseline={false}
            endLabels
            ariaLabel="Pass rate by suite over the last 14 days"
          />
        </Card>

        <Card
          span={4}
          index={1}
          icon={PieChart}
          title="Why tests fail"
          subtitle="Root cause of 92 failures this week"
          table={{
            caption: "Failure causes",
            columns: ["Cause", "Failures"],
            rows: FAILURE_CAUSES.map((cause) => [cause.label, cause.value]),
          }}
        >
          <Donut
            data={FAILURE_CAUSES.map((cause, index) => ({ ...cause, color: seriesColor(index + 1) }))}
            format="int"
            centerLabel="failures"
          />
        </Card>

        <Card
          span={12}
          index={0}
          icon={Activity}
          title="Test executions"
          subtitle="Per hour, last 24 hours"
          table={{
            caption: "Test executions per hour",
            columns: ["Hour", "Executions"],
            rows: EXECUTIONS_PER_HOUR.map((value, hour) => [hourLabel(hour), value]),
          }}
        >
          <LineChart
            series={[{ id: "executions", label: "Executions", color: "var(--series-1)", values: EXECUTIONS_PER_HOUR }]}
            labels={hourLabels}
            format="int"
            area
            endLabels
            height={220}
            ariaLabel="Test executions per hour over the last 24 hours"
          />
        </Card>

        <RunFeed index={0} />
        <EnvironmentList index={1} />
      </div>
    </>
  );
}
