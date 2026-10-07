"use client";

import { CalendarCheck } from "lucide-react";
import { useInView } from "motion/react";
import { useRef } from "react";
import { SERVICES, UPTIME_DAYS, dayLabel, uptimeHistory, type Status } from "@/lib/mock";
import { Card } from "../ui/Card";
import { StatusBadge } from "../ui/StatusBadge";
import styles from "./widgets.module.css";

const ROWS = SERVICES.filter((service) => service.kind !== "data").map((service, index) => {
  const history = uptimeHistory(index);
  const healthy = history.filter((status) => status === "good").length;
  return { service, history, uptime: 99 + (healthy / UPTIME_DAYS) * 0.99 };
});

const STATUS_LABEL: Record<Status, string> = { good: "Healthy", warning: "Degraded", serious: "At risk", critical: "Outage" };

export function UptimeBars({ index }: { index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <Card
      span={5}
      index={index}
      icon={CalendarCheck}
      title="Uptime"
      subtitle={`Daily status, last ${UPTIME_DAYS} days`}
      table={{
        caption: "Uptime by service",
        columns: ["Service", "Uptime", "Degraded days", "Outage days"],
        rows: ROWS.map((row) => [
          row.service.label,
          `${row.uptime.toFixed(2)}%`,
          row.history.filter((status) => status === "warning").length,
          row.history.filter((status) => status === "critical").length,
        ]),
      }}
    >
      <div ref={ref} className={styles.uptime} data-inview={inView}>
        {ROWS.map((row, rowIndex) => (
          <div key={row.service.id} className={styles.uptimeRow}>
            <div className={styles.uptimeHead}>
              <span>{row.service.label}</span>
              <span className={styles.uptimePct}>{row.uptime.toFixed(2)}%</span>
            </div>
            <div className={styles.uptimeBars}>
              {row.history.map((status, day) => (
                <span
                  key={day}
                  className={styles.uptimeBar}
                  data-status={status}
                  style={{ animationDelay: `${rowIndex * 60 + day * 8}ms` }}
                  title={`${dayLabel(UPTIME_DAYS - 1 - day)} · ${STATUS_LABEL[status]}`}
                />
              ))}
            </div>
          </div>
        ))}
        <div className={styles.uptimeLegend}>
          <StatusBadge status="good" />
          <StatusBadge status="warning" />
          <StatusBadge status="critical" label="Outage" />
        </div>
      </div>
    </Card>
  );
}
