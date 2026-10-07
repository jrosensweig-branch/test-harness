"use client";

import { ArrowRight, ScanSearch } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { SERVICES, SERVICE_EDGES, latencyStatus } from "@/lib/mock";
import { Card } from "../ui/Card";
import { StatusBadge } from "../ui/StatusBadge";
import styles from "./widgets.module.css";

const STATUS_COLOR = { good: "var(--good)", warning: "var(--warning)", serious: "var(--serious)", critical: "var(--critical)" };

export function ServiceDetail({ index, selected, onSelect }: { index: number; selected: string; onSelect: (id: string) => void }) {
  const service = SERVICES.find((entry) => entry.id === selected) ?? SERVICES[0];
  const status = latencyStatus(service.p95, service.slo);
  const calls = SERVICE_EDGES.filter(([from]) => from === service.id).map(([, to]) => to);
  const calledBy = SERVICE_EDGES.filter(([, to]) => to === service.id).map(([from]) => from);
  const label = (id: string) => SERVICES.find((entry) => entry.id === id)?.label ?? id;
  const budget = Math.min(1, service.p95 / service.slo);

  return (
    <Card span={4} index={index} icon={ScanSearch} title="Inspector" subtitle="Selected node on the map">
      <AnimatePresence mode="wait">
        <motion.div
          key={service.id}
          className={styles.inspector}
          initial={{ opacity: 0, x: 24, filter: "blur(6px)" }}
          animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, x: -24, filter: "blur(6px)" }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className={styles.inspectorHead}>
            <div>
              <p className={styles.inspectorKind}>{service.kind === "data" ? "Data store" : service.kind === "edge" ? "Edge" : "Service"}</p>
              <h3 className={styles.inspectorName}>{service.label}</h3>
            </div>
            <StatusBadge status={status} pulse={status === "critical"} />
          </div>

          <div className={styles.inspectorBudget}>
            <div className={styles.inspectorBudgetLabels}>
              <span>Latency budget used</span>
              <strong>{Math.round(budget * 100)}%</strong>
            </div>
            <div className={styles.budgetTrack} style={{ background: `color-mix(in srgb, ${STATUS_COLOR[status]} 18%, var(--surface-solid))` }}>
              <motion.div
                className={styles.budgetFill}
                style={{ background: STATUS_COLOR[status], originX: 0 }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: budget }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
              />
            </div>
            <p className={styles.inspectorFoot}>
              p95 {service.p95} ms of a {service.slo} ms SLO
            </p>
          </div>

          <dl className={styles.inspectorStats}>
            <div>
              <dt>Throughput</dt>
              <dd>{service.rps.toLocaleString("en-US")}/s</dd>
            </div>
            <div>
              <dt>Error rate</dt>
              <dd>{(service.errorRate * 100).toFixed(2)}%</dd>
            </div>
          </dl>

          {[
            { title: "Calls", ids: calls },
            { title: "Called by", ids: calledBy },
          ].map((group) =>
            group.ids.length ? (
              <div key={group.title} className={styles.inspectorDeps}>
                <p>{group.title}</p>
                <div>
                  {group.ids.map((id) => (
                    <button key={id} type="button" className={styles.depChip} onClick={() => onSelect(id)}>
                      {label(id)} <ArrowRight size={12} />
                    </button>
                  ))}
                </div>
              </div>
            ) : null,
          )}
        </motion.div>
      </AnimatePresence>
    </Card>
  );
}
