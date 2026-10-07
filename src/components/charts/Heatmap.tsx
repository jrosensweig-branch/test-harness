"use client";

import { motion, useInView } from "motion/react";
import { useRef, useState } from "react";
import { formatValue } from "@/lib/format";
import { ChartTooltip } from "./Tooltip";
import styles from "./charts.module.css";

const STEPS = 7;

type Props = {
  rowLabels: string[];
  columnLabels: string[];
  values: number[][];
  valueLabel: string;
  ariaLabel: string;
};

/** Sequential single-hue ramp (seq-0 → seq-6), quantized to 7 steps with a scale legend. */
export function Heatmap({ rowLabels, columnLabels, values, valueLabel, ariaLabel }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const [hover, setHover] = useState<{ row: number; column: number; x: number; y: number } | null>(null);
  const [width, setWidth] = useState(0);

  const flat = values.flat();
  const max = Math.max(...flat, 1);
  const step = (value: number) => Math.min(STEPS - 1, Math.floor((value / max) * STEPS));

  const onCellEnter = (row: number, column: number, event: React.PointerEvent<HTMLDivElement>) => {
    const container = ref.current?.getBoundingClientRect();
    const cell = event.currentTarget.getBoundingClientRect();
    if (!container) return;
    setWidth(container.width);
    setHover({ row, column, x: cell.left - container.left + cell.width / 2, y: cell.top - container.top + cell.height / 2 });
  };

  return (
    <div className={styles.chart}>
      <div
        ref={ref}
        className={styles.heatmap}
        role="img"
        aria-label={ariaLabel}
        style={{ gridTemplateColumns: `auto repeat(${columnLabels.length}, minmax(0, 1fr))` }}
        onPointerLeave={() => setHover(null)}
      >
        {values.map((row, rowIndex) => (
          <div key={rowLabels[rowIndex]} className={styles.heatmapRow}>
            <span className={styles.heatmapRowLabel}>{rowLabels[rowIndex]}</span>
            {row.map((value, columnIndex) => (
              <motion.div
                key={columnIndex}
                className={styles.heatmapCell}
                data-active={hover?.row === rowIndex && hover.column === columnIndex}
                style={{ background: `var(--seq-${step(value)})` }}
                initial={{ opacity: 0, scale: 0.2 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.35, delay: (rowIndex + columnIndex) * 0.018, ease: [0.22, 1, 0.36, 1] }}
                onPointerEnter={(event) => onCellEnter(rowIndex, columnIndex, event)}
              />
            ))}
          </div>
        ))}
        <div className={styles.heatmapRow}>
          <span />
          {columnLabels.map((label, index) => (
            <span key={label} className={styles.heatmapColumnLabel}>
              {index % 3 === 0 ? label.slice(0, 2) : ""}
            </span>
          ))}
        </div>
        <ChartTooltip
          visible={hover !== null}
          x={hover?.x ?? 0}
          y={hover?.y ?? 0}
          containerWidth={width}
          title={hover ? `${rowLabels[hover.row]} · ${columnLabels[hover.column]}` : ""}
          rows={hover ? [{ key: "value", label: valueLabel, value: formatValue(values[hover.row][hover.column], "int") }] : []}
        />
      </div>

      <div className={styles.scaleLegend} aria-hidden>
        <span>0</span>
        {Array.from({ length: STEPS }, (_, index) => (
          <span key={index} className={styles.scaleSwatch} style={{ background: `var(--seq-${index})` }} />
        ))}
        <span>{formatValue(max, "int")}</span>
        <span className={styles.scaleCaption}>{valueLabel}</span>
      </div>
    </div>
  );
}
