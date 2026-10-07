"use client";

import { CircleCheck, CircleX, LoaderCircle, Workflow } from "lucide-react";
import { motion } from "motion/react";
import { formatDuration } from "@/lib/format";
import { PIPELINE } from "@/lib/mock";
import { Card } from "../ui/Card";
import styles from "./widgets.module.css";

const STATUS = {
  passed: { icon: CircleCheck, label: "Passed" },
  failed: { icon: CircleX, label: "Failed" },
  running: { icon: LoaderCircle, label: "Running" },
};

const TOTAL = Math.max(...PIPELINE.map((stage) => stage.start + stage.duration));
const MARKS = [0, 60, 120, 180, 240, 300];
const MIN_INSIDE_LABEL_PCT = 12;

export function PipelineGantt({ index }: { index: number }) {
  return (
    <Card
      span={12}
      index={index}
      icon={Workflow}
      title="Latest pipeline · #4821"
      subtitle="feat/retro-theme · stages overlap where the runner parallelizes"
      table={{
        caption: "Pipeline stages",
        columns: ["Stage", "Starts at", "Duration", "Status"],
        rows: PIPELINE.map((stage) => [stage.name, formatDuration(stage.start), formatDuration(stage.duration), STATUS[stage.status].label]),
      }}
    >
      <div className={styles.gantt}>
        <div className={styles.ganttAxis} aria-hidden>
          <span />
          <div className={styles.ganttMarks}>
            {MARKS.map((mark) => (
              <span key={mark} style={{ left: `${(mark / TOTAL) * 100}%` }}>
                {formatDuration(mark)}
              </span>
            ))}
          </div>
        </div>
        {PIPELINE.map((stage, row) => {
          const status = STATUS[stage.status];
          const Icon = status.icon;
          const startPct = (stage.start / TOTAL) * 100;
          const widthPct = (stage.duration / TOTAL) * 100;
          // Labels that would be clipped by a short bar sit just outside its end instead.
          const labelInside = widthPct >= MIN_INSIDE_LABEL_PCT;
          return (
            <div key={stage.name} className={styles.ganttRow}>
              <span className={styles.ganttLabel}>
                <Icon size={14} data-status={stage.status} className={stage.status === "running" ? styles.spin : undefined} />
                {stage.name}
              </span>
              <div className={styles.ganttTrack}>
                {MARKS.map((mark) => (
                  <span key={mark} className={styles.ganttGrid} style={{ left: `${(mark / TOTAL) * 100}%` }} />
                ))}
                <motion.div
                  className={styles.ganttBar}
                  data-status={stage.status}
                  style={{ left: `${startPct}%`, width: `${widthPct}%`, originX: 0 }}
                  initial={{ scaleX: 0, opacity: 0 }}
                  whileInView={{ scaleX: 1, opacity: 1 }}
                  viewport={{ once: true, amount: 0.6 }}
                  transition={{ duration: 0.8, delay: 0.1 + row * 0.09, ease: [0.22, 1, 0.36, 1] }}
                  title={`${stage.name}: ${formatDuration(stage.duration)} · ${status.label}`}
                >
                  {labelInside && <span className={styles.ganttDuration}>{formatDuration(stage.duration)}</span>}
                </motion.div>
                {!labelInside && (
                  <span
                    className={styles.ganttOutside}
                    style={
                      startPct + widthPct > 85
                        ? { right: `calc(${100 - startPct}% + 6px)` }
                        : { left: `calc(${startPct + widthPct}% + 6px)` }
                    }
                  >
                    {formatDuration(stage.duration)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
