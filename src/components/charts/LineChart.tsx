"use client";

import { motion, useInView } from "motion/react";
import { useId, useState } from "react";
import { formatAxis, formatValue, type ValueFormat } from "@/lib/format";
import { useElementWidth } from "@/lib/live";
import { Legend } from "./Legend";
import { linearScale, monotonePath, niceTicks } from "./scale";
import { ChartTooltip } from "./Tooltip";
import styles from "./charts.module.css";

export type Series = { id: string; label: string; color: string; values: number[] };

type Props = {
  series: Series[];
  labels: string[];
  format: ValueFormat;
  ariaLabel: string;
  height?: number;
  area?: boolean;
  /** Start the y-axis at zero (magnitudes) or fit to the data (rates that live in a narrow band). */
  zeroBaseline?: boolean;
  endLabels?: boolean;
  /** Marks the newest point as live with a pulsing ring. */
  live?: boolean;
};

const MARGIN = { top: 14, bottom: 28, left: 46 };
const MIN_LABEL_GAP = 16;

export function LineChart({
  series,
  labels,
  format,
  ariaLabel,
  height = 260,
  area = false,
  zeroBaseline = true,
  endLabels = false,
  live = false,
}: Props) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const gradientPrefix = useId().replace(/[^a-zA-Z0-9]/g, "");

  const marginRight = endLabels ? 70 : 14;
  const innerWidth = Math.max(0, width - MARGIN.left - marginRight);
  const innerHeight = height - MARGIN.top - MARGIN.bottom;
  const count = labels.length;

  const allValues = series.flatMap((entry) => entry.values);
  const dataMin = Math.min(...allValues);
  const dataMax = Math.max(...allValues);
  const padding = (dataMax - dataMin) * 0.12 || 1;
  // Percentages never get an axis above 100%.
  const ceiling = format === "percent" ? Math.min(100, dataMax + padding * 0.3) : dataMax + padding * 0.3;
  const ticks = zeroBaseline ? niceTicks(0, dataMax, 4) : niceTicks(dataMin - padding, ceiling, 4);
  const yScale = linearScale([ticks[0], ticks[ticks.length - 1]], [innerHeight, 0]);
  const xScale = (index: number) => (count <= 1 ? innerWidth / 2 : (index / (count - 1)) * innerWidth);

  const maxXLabels = Math.max(2, Math.floor(innerWidth / 64));
  const labelStep = Math.ceil(count / maxXLabels);

  // End labels only when they separate cleanly; otherwise the legend + tooltip carry identity.
  const ends = series
    .map((entry) => ({ entry, y: yScale(entry.values[entry.values.length - 1]) }))
    .sort((a, b) => a.y - b.y);
  const endLabelsFit = endLabels && ends.every((end, index) => index === 0 || end.y - ends[index - 1].y >= MIN_LABEL_GAP);

  const onPointerMove = (event: React.PointerEvent<SVGRectElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - bounds.left) / bounds.width;
    setHoverIndex(Math.max(0, Math.min(count - 1, Math.round(ratio * (count - 1)))));
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const step = event.key === "ArrowRight" ? 1 : -1;
    setHoverIndex((index) => Math.max(0, Math.min(count - 1, (index ?? count - 1) + step)));
  };

  return (
    <div className={styles.chart}>
      {series.length > 1 && (
        <Legend shape={area ? "rect" : "line"} items={series.map(({ id, label, color }) => ({ id, label, color }))} />
      )}
      <div
        ref={ref}
        className={styles.plot}
        style={{ height }}
        tabIndex={0}
        role="group"
        aria-label={`${ariaLabel}. Use left and right arrow keys to read values.`}
        onKeyDown={onKeyDown}
        onFocus={() => setHoverIndex((index) => index ?? count - 1)}
        onBlur={() => setHoverIndex(null)}
      >
        {innerWidth > 0 && (
          <svg width={width} height={height} className={styles.svg} role="img" aria-label={ariaLabel}>
            <defs>
              {area &&
                series.map((entry) => (
                  <linearGradient key={entry.id} id={`${gradientPrefix}-${entry.id}`} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={entry.color} stopOpacity={0.28} />
                    <stop offset="100%" stopColor={entry.color} stopOpacity={0} />
                  </linearGradient>
                ))}
            </defs>
            <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
              {ticks.map((tick) => (
                <g key={tick} transform={`translate(0,${yScale(tick)})`}>
                  <line x2={innerWidth} className={tick === ticks[0] ? styles.baseline : styles.gridline} />
                  <text x={-10} dy="0.32em" className={styles.axisLabel} textAnchor="end">
                    {formatAxis(tick, format)}
                  </text>
                </g>
              ))}

              {labels.map((label, index) =>
                index % labelStep === 0 || index === count - 1 ? (
                  <text
                    key={label + index}
                    x={xScale(index)}
                    y={innerHeight + 20}
                    className={styles.axisLabel}
                    textAnchor={index === 0 ? "start" : index === count - 1 ? "end" : "middle"}
                  >
                    {index !== count - 1 && count - 1 - index < labelStep ? "" : label}
                  </text>
                ) : null,
              )}

              {series.map((entry, seriesIndex) => {
                const points = entry.values.map((value, index) => [xScale(index), yScale(value)] as [number, number]);
                const line = monotonePath(points);
                return (
                  <g key={entry.id}>
                    {area && (
                      <motion.path
                        d={`${line}L${xScale(count - 1)},${innerHeight}L${xScale(0)},${innerHeight}Z`}
                        fill={`url(#${gradientPrefix}-${entry.id})`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: inView ? 1 : 0 }}
                        transition={{ duration: 0.9, delay: 0.5 + seriesIndex * 0.15 }}
                      />
                    )}
                    <motion.path
                      d={line}
                      fill="none"
                      stroke={entry.color}
                      style={{ color: entry.color }}
                      className={styles.line}
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: inView ? 1 : 0 }}
                      transition={{ duration: 1.4, ease: [0.65, 0, 0.35, 1], delay: seriesIndex * 0.15 }}
                    />
                  </g>
                );
              })}

              {ends.map(({ entry, y }, index) => (
                <motion.g
                  key={entry.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={inView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: 1.3 + index * 0.1, type: "spring", stiffness: 400, damping: 18 }}
                >
                  {live && <circle cx={xScale(count - 1)} cy={y} r={4} fill={entry.color} className={styles.livePing} />}
                  <circle cx={xScale(count - 1)} cy={y} r={4} fill={entry.color} className={styles.dot} />
                  {endLabelsFit && (
                    <text x={xScale(count - 1) + 10} y={y} dy="0.32em" className={styles.endLabel}>
                      {formatValue(entry.values[entry.values.length - 1], format)}
                    </text>
                  )}
                </motion.g>
              ))}

              {hoverIndex !== null && (
                <g pointerEvents="none">
                  <line x1={xScale(hoverIndex)} x2={xScale(hoverIndex)} y1={0} y2={innerHeight} className={styles.crosshair} />
                  {series.map((entry) => (
                    <circle
                      key={entry.id}
                      cx={xScale(hoverIndex)}
                      cy={yScale(entry.values[hoverIndex])}
                      r={4.5}
                      fill={entry.color}
                      className={styles.dot}
                    />
                  ))}
                </g>
              )}

              <rect
                width={innerWidth}
                height={innerHeight}
                fill="transparent"
                onPointerMove={onPointerMove}
                onPointerLeave={() => setHoverIndex(null)}
              />
            </g>
          </svg>
        )}
        <ChartTooltip
          visible={hoverIndex !== null}
          x={MARGIN.left + xScale(hoverIndex ?? 0)}
          y={MARGIN.top + Math.min(...series.map((entry) => yScale(entry.values[hoverIndex ?? 0])))}
          containerWidth={width}
          title={hoverIndex !== null ? labels[hoverIndex] : ""}
          rows={
            hoverIndex !== null
              ? series.map((entry) => ({
                  key: entry.id,
                  label: entry.label,
                  value: formatValue(entry.values[hoverIndex], format),
                  color: entry.color,
                }))
              : []
          }
        />
      </div>
    </div>
  );
}
