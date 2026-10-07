"use client";

import { Database, Globe, Network, Server, type LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { SERVICES, SERVICE_EDGES, latencyStatus, type ServiceNode } from "@/lib/mock";
import { Card } from "../ui/Card";
import styles from "./widgets.module.css";

const WIDTH = 820;
const HEIGHT = 420;
const PAD_X = 56;
const PAD_Y = 60;
const NODE_RADIUS = 30;

const KIND_ICON: Record<ServiceNode["kind"], LucideIcon> = { edge: Globe, service: Server, data: Database };
const STATUS_COLOR = { good: "var(--good)", warning: "var(--warning)", serious: "var(--serious)", critical: "var(--critical)" };

const position = (node: ServiceNode) => ({
  x: PAD_X + node.x * (WIDTH - PAD_X * 2),
  y: PAD_Y + node.y * (HEIGHT - PAD_Y * 2),
});

function edgePath(from: ServiceNode, to: ServiceNode) {
  const a = position(from);
  const b = position(to);
  const bend = (b.x - a.x) * 0.5;
  return `M${a.x},${a.y} C${a.x + bend},${a.y} ${b.x - bend},${b.y} ${b.x},${b.y}`;
}

type Props = { index: number; selected: string; onSelect: (id: string) => void };

/** Service map. Packets ride each edge at a speed proportional to the caller's throughput. */
export function Topology({ index, selected, onSelect }: Props) {
  const reduceMotion = useReducedMotion();
  const byId = Object.fromEntries(SERVICES.map((service) => [service.id, service]));

  return (
    <Card
      span={8}
      index={index}
      icon={Network}
      title="Service topology"
      subtitle="Click a node to inspect it · packet speed tracks requests per second"
      table={{
        caption: "Service dependencies",
        columns: ["Caller", "Callee", "Caller req/s"],
        rows: SERVICE_EDGES.map(([from, to]) => [byId[from].label, byId[to].label, byId[from].rps]),
      }}
    >
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={styles.topology} role="group" aria-label="Service topology map">
        <defs>
          <radialGradient id="packet-glow">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {SERVICE_EDGES.map(([from, to], edgeIndex) => {
          const id = `edge-${from}-${to}`;
          const touchesSelection = from === selected || to === selected;
          const duration = Math.max(1.2, 4200 / byId[from].rps);
          return (
            <g key={id}>
              <motion.path
                id={id}
                d={edgePath(byId[from], byId[to])}
                className={styles.edge}
                data-active={touchesSelection}
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.2 + edgeIndex * 0.07, ease: "easeInOut" }}
              />
              {!reduceMotion &&
                [0, 1, 2].map((packet) => (
                  <circle key={packet} r={touchesSelection ? 4.5 : 3} className={styles.packet} data-active={touchesSelection}>
                    <animateMotion dur={`${duration}s`} begin={`-${(packet * duration) / 3}s`} repeatCount="indefinite" rotate="auto">
                      <mpath href={`#${id}`} />
                    </animateMotion>
                  </circle>
                ))}
            </g>
          );
        })}

        {SERVICES.map((service, nodeIndex) => {
          const { x, y } = position(service);
          const status = latencyStatus(service.p95, service.slo);
          const Icon = KIND_ICON[service.kind];
          const isSelected = service.id === selected;
          return (
            <motion.g
              key={service.id}
              className={styles.node}
              data-selected={isSelected}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              aria-label={`${service.label}, p95 ${service.p95} ms`}
              onClick={() => onSelect(service.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(service.id);
                }
              }}
              initial={{ opacity: 0, scale: 0.4 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 320, damping: 20, delay: 0.1 + nodeIndex * 0.06 }}
            >
              {isSelected && <circle cx={x} cy={y} r={NODE_RADIUS + 12} className={styles.nodeHalo} />}
              <circle cx={x} cy={y} r={NODE_RADIUS} className={styles.nodeBody} />
              <circle cx={x} cy={y} r={NODE_RADIUS} fill="none" stroke={STATUS_COLOR[status]} strokeWidth={3} style={{ color: STATUS_COLOR[status] }} className={styles.nodeRing} />
              <Icon x={x - 11} y={y - 11} width={22} height={22} className={styles.nodeIcon} />
              <text x={x} y={y + NODE_RADIUS + 22} textAnchor="middle" className={styles.nodeLabel}>
                {service.label}
              </text>
              <text x={x} y={y + NODE_RADIUS + 40} textAnchor="middle" className={styles.nodeMeta}>
                {service.rps.toLocaleString("en-US")} req/s
              </text>
            </motion.g>
          );
        })}
      </svg>
    </Card>
  );
}
