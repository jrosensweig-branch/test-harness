"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { formatDelta } from "@/lib/format";
import type { Kpi } from "@/lib/mock";
import { Sparkline } from "../charts/Sparkline";
import { Card } from "../ui/Card";
import { CountUp } from "../ui/CountUp";
import styles from "./widgets.module.css";

/** Stat tile contract: label · value · delta vs a named period · 12-point trend. */
export function StatTile({ kpi, index }: { kpi: Kpi; index: number }) {
  const improving = kpi.delta === 0 ? null : kpi.delta > 0 === kpi.upIsGood;
  const Arrow = kpi.delta >= 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <Card span={4} tile tilt index={index}>
      <div className={styles.statTile}>
        <p className={styles.statLabel}>{kpi.label}</p>
        <CountUp value={kpi.value} format={kpi.format} className={styles.statValue} />
        <p className={styles.statDelta} data-tone={improving === null ? "neutral" : improving ? "good" : "bad"}>
          <Arrow size={14} strokeWidth={2.4} />
          {formatDelta(kpi.delta, kpi.deltaKind)}
          <span className={styles.statPeriod}>vs yesterday</span>
        </p>
        <Sparkline values={kpi.trend} />
      </div>
    </Card>
  );
}
