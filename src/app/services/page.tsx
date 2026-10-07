"use client";

import { Activity, Network } from "lucide-react";
import { useState } from "react";
import { Gauge } from "@/components/charts/Gauge";
import { LineChart, type Series } from "@/components/charts/LineChart";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import ui from "@/components/ui/ui.module.css";
import { ServiceDetail } from "@/components/widgets/ServiceDetail";
import { Topology } from "@/components/widgets/Topology";
import { UptimeBars } from "@/components/widgets/UptimeBars";
import { useInterval } from "@/lib/live";
import { SERVICES, SUITES, THROUGHPUT_WINDOW, initialThroughput, seededRandom, seriesColor } from "@/lib/mock";

const TICK_SECONDS = 1.5;
const GAUGE_SERVICES = ["pay", "ach", "transfers", "ledger"];
const THROUGHPUT_SERVICES = SUITES.slice(0, 3);
const throughputLabels = Array.from({ length: THROUGHPUT_WINDOW }, (_, index) => {
  const secondsAgo = (THROUGHPUT_WINDOW - 1 - index) * TICK_SECONDS;
  return secondsAgo === 0 ? "now" : `−${secondsAgo}s`;
});

function initialSeries(): Series[] {
  return THROUGHPUT_SERVICES.map((suite, index) => {
    const base = SERVICES.find((service) => service.id === suite.id)!.rps;
    return { id: suite.id, label: suite.label, color: seriesColor(suite.slot), values: initialThroughput(900 + index, base) };
  });
}

const random = seededRandom(31337);

export default function ServiceHealthPage() {
  const [selected, setSelected] = useState("ledger");
  const [throughput, setThroughput] = useState<Series[]>(initialSeries);

  useInterval(() => {
    setThroughput((current) =>
      current.map((series) => {
        const last = series.values[series.values.length - 1];
        const base = SERVICES.find((service) => service.id === series.id)!.rps;
        // Mean-reverting jitter keeps each line near its service's typical load.
        const next = Math.max(0, last + (base - last) * 0.2 + (random() - 0.5) * base * 0.18);
        return { ...series, values: [...series.values.slice(1), next] };
      }),
    );
  }, TICK_SECONDS * 1000);

  return (
    <>
      <PageHeader
        eyebrow="Service health"
        icon={Network}
        title="Who is slow, and who is to blame"
        description="Dependencies, latency against SLOs and daily uptime for every service the harness exercises."
      >
        <StatusBadge status="serious" label="Transfers near SLO" pulse />
        <StatusBadge status="warning" label="ACH degraded" />
      </PageHeader>

      <div className={ui.grid}>
        <Topology index={0} selected={selected} onSelect={setSelected} />
        <ServiceDetail index={1} selected={selected} onSelect={setSelected} />

        <p className={ui.sectionTitle}>Latency vs SLO</p>
        {GAUGE_SERVICES.map((id, index) => {
          const service = SERVICES.find((entry) => entry.id === id)!;
          return (
            <Card key={id} span={3} index={index}>
              <Gauge label={service.label} value={service.p95} slo={service.slo} />
            </Card>
          );
        })}

        <Card
          span={7}
          index={0}
          icon={Activity}
          title="Live throughput"
          subtitle={`Requests per second, sampled every ${TICK_SECONDS}s`}
          table={{
            caption: "Live throughput",
            columns: ["Sample", ...throughput.map((series) => series.label)],
            rows: throughputLabels.map((label, index) => [label, ...throughput.map((series) => Math.round(series.values[index]))]),
          }}
        >
          <LineChart series={throughput} labels={throughputLabels} format="rps" live endLabels height={250} ariaLabel="Live requests per second by service" />
        </Card>
        <UptimeBars index={1} />
      </div>
    </>
  );
}
