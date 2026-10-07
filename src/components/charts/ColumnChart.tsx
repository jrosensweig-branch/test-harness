"use client";

import { motion, useInView } from "motion/react";
import { useState } from "react";
import { formatAxis, formatValue, type ValueFormat } from "@/lib/format";
import { useElementWidth } from "@/lib/live";
import { Legend } from "./Legend";
import { columnPath, linearScale, niceTicks } from "./scale";
import type { Series } from "./LineChart";
import { ChartTooltip } from "./Tooltip";
import styles from "./charts.module.css";

type Props = {
  labels: string[];
  /** Stacked bottom-up in array order. Pass zeros for a filtered-out series so its segments collapse in place. */
  series: Series[];
  format: ValueFormat;
  ariaLabel: string;
  height?: number;
  /** Series ids to list in the legend (defaults to all). */
  legendIds?: string[];
  /** Histogram mode: bars sit 2px apart instead of floating in their band. */
  adjacent?: boolean;
};

const MARGIN = { top: 22, right: 8, bottom: 28, left: 46 };
const MAX_BAR = 24;
const SURFACE_GAP = 2;

export function ColumnChart({ labels, series, format, ariaLabel, height = 260, legendIds, adjacent = false }: Props) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const innerWidth = Math.max(0, width - MARGIN.left - MARGIN.right);
  const innerHeight = height - MARGIN.top - MARGIN.bottom;
  const count = labels.length;
  const band = innerWidth / count;
  const barWidth = adjacent ? Math.max(2, band - SURFACE_GAP) : Math.min(MAX_BAR, band * 0.62);

  const totals = labels.map((_, index) => series.reduce((sum, entry) => sum + entry.values[index], 0));
  const maxTotal = Math.max(...totals, 1);
  const ticks = niceTicks(0, maxTotal, 4);
  const yScale = linearScale([0, ticks[ticks.length - 1]], [innerHeight, 0]);
  const maxIndex = totals.indexOf(Math.max(...totals));

  const maxXLabels = Math.max(2, Math.floor(innerWidth / 56));
  const labelStep = Math.ceil(count / maxXLabels);
  const legendSeries = series.filter((entry) => !legendIds || legendIds.includes(entry.id));

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const step = event.key === "ArrowRight" ? 1 : -1;
    setHoverIndex((index) => Math.max(0, Math.min(count - 1, (index ?? 0) + step)));
  };

  const tooltipIndex = hoverIndex ?? 0;

  return (
    <div className={styles.chart}>
      {legendSeries.length > 1 && (
        <Legend shape="rect" items={legendSeries.map(({ id, label, color }) => ({ id, label, color }))} />
      )}
      <div
        ref={ref}
        className={styles.plot}
        style={{ height }}
        tabIndex={0}
        role="group"
        aria-label={`${ariaLabel}. Use left and right arrow keys to read values.`}
        onKeyDown={onKeyDown}
        onFocus={() => setHoverIndex((index) => index ?? 0)}
        onBlur={() => setHoverIndex(null)}
      >
        {innerWidth > 0 && (
          <svg width={width} height={height} className={styles.svg} role="img" aria-label={ariaLabel}>
            <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
              {ticks.map((tick) => (
                <g key={tick} transform={`translate(0,${yScale(tick)})`}>
                  <line x2={innerWidth} className={tick === 0 ? styles.baseline : styles.gridline} />
                  <text x={-10} dy="0.32em" className={styles.axisLabel} textAnchor="end">
                    {formatAxis(tick, format)}
                  </text>
                </g>
              ))}

              {labels.map((label, index) => {
                const x = index * band + (band - barWidth) / 2;
                let cursor = innerHeight;
                const visibleSegments = series.filter((entry) => entry.values[index] > 0);
                const topId = visibleSegments[visibleSegments.length - 1]?.id;
                const dimmed = hoverIndex !== null && hoverIndex !== index;

                return (
                  <g key={label + index}>
                    <motion.g
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: inView ? 1 : 0, opacity: dimmed ? 0.4 : 1 }}
                      transition={{
                        scaleY: { duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: index * (0.6 / count) },
                        opacity: { duration: 0.15 },
                      }}
                      style={{ originY: 1 }}
                    >
                      {series.map((entry, seriesIndex) => {
                        const value = entry.values[index];
                        const segmentHeight = innerHeight - yScale(value);
                        const top = cursor - segmentHeight;
                        // 2px surface gap above every segment that has another stacked on it.
                        const gap = seriesIndex > 0 && segmentHeight > 0 && cursor < innerHeight ? SURFACE_GAP : 0;
                        const path = columnPath(x, top, barWidth, segmentHeight - gap, entry.id === topId ? 4 : 0);
                        cursor = top;
                        return (
                          <motion.path
                            key={entry.id}
                            initial={false}
                            animate={{ d: path }}
                            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                            fill={entry.color}
                          />
                        );
                      })}
                    </motion.g>

                    {index === maxIndex && (
                      <motion.text
                        x={x + barWidth / 2}
                        y={yScale(totals[index]) - 8}
                        textAnchor="middle"
                        className={styles.valueLabel}
                        initial={{ opacity: 0, y: 6 }}
                        animate={inView ? { opacity: 1, y: 0 } : {}}
                        transition={{ delay: 0.9 }}
                      >
                        {formatValue(totals[index], format)}
                      </motion.text>
                    )}

                    {(index % labelStep === 0 || index === count - 1) && !(index !== count - 1 && count - 1 - index < labelStep) && (
                      <text x={x + barWidth / 2} y={innerHeight + 20} textAnchor="middle" className={styles.axisLabel}>
                        {label}
                      </text>
                    )}

                    <rect
                      x={index * band}
                      y={0}
                      width={band}
                      height={innerHeight}
                      fill="transparent"
                      onPointerEnter={() => setHoverIndex(index)}
                      onPointerLeave={() => setHoverIndex(null)}
                    />
                  </g>
                );
              })}
            </g>
          </svg>
        )}
        <ChartTooltip
          visible={hoverIndex !== null}
          x={MARGIN.left + tooltipIndex * band + band / 2}
          y={MARGIN.top + yScale(totals[tooltipIndex] ?? 0) + 10}
          containerWidth={width}
          title={hoverIndex !== null ? labels[hoverIndex] : ""}
          rows={
            hoverIndex === null
              ? []
              : [
                  ...(legendSeries.length > 1
                    ? [{ key: "total", label: "Total", value: formatValue(totals[hoverIndex], format) }]
                    : []),
                  ...legendSeries.map((entry) => ({
                    key: entry.id,
                    label: entry.label,
                    value: formatValue(entry.values[hoverIndex], format),
                    color: entry.color,
                    keyShape: "rect" as const,
                  })),
                ]
          }
        />
      </div>
    </div>
  );
}
