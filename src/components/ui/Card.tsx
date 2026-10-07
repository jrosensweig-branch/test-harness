"use client";

import { ChartNoAxesColumn, Table2, type LucideIcon } from "lucide-react";
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { useRef, useState } from "react";
import styles from "./ui.module.css";

export type TableData = { caption: string; columns: string[]; rows: (string | number)[][] };

type CardProps = {
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  /** Columns out of 12 on wide screens. */
  span?: 3 | 4 | 5 | 6 | 7 | 8 | 12;
  /** Position in the grid, used to stagger the scroll reveal. */
  index?: number;
  actions?: React.ReactNode;
  /** Every chart ships a table twin so no value is gated behind hover or color. */
  table?: TableData;
  /** Compact KPI tile: spans 3 columns on medium screens instead of going full width. */
  tile?: boolean;
  /** Occupy two grid rows on wide screens. */
  tall?: boolean;
  /** Subtle 3D tilt toward the pointer. */
  tilt?: boolean;
  className?: string;
  children: React.ReactNode;
};

const TILT_DEGREES = 5;

export const revealVariants = {
  hidden: { opacity: 0, y: 32, scale: 0.97, filter: "blur(8px)" },
  shown: (index: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const, delay: (index % 4) * 0.08 },
  }),
};

export function Card({
  title,
  subtitle,
  icon: Icon,
  span = 12,
  index = 0,
  actions,
  table,
  tile = false,
  tall = false,
  tilt = false,
  className,
  children,
}: CardProps) {
  const ref = useRef<HTMLElement>(null);
  const [showTable, setShowTable] = useState(false);
  const reduceMotion = useReducedMotion();
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const rotateX = useSpring(tiltX, { stiffness: 260, damping: 22 });
  const rotateY = useSpring(tiltY, { stiffness: 260, damping: 22 });

  // Spotlight follows the pointer via CSS vars, so hovering never re-renders the chart inside.
  const onPointerMove = (event: React.PointerEvent) => {
    const element = ref.current;
    if (!element) return;
    const bounds = element.getBoundingClientRect();
    element.style.setProperty("--mx", `${event.clientX - bounds.left}px`);
    element.style.setProperty("--my", `${event.clientY - bounds.top}px`);
    if (tilt && !reduceMotion) {
      tiltX.set(((event.clientY - bounds.top) / bounds.height - 0.5) * -TILT_DEGREES * 2);
      tiltY.set(((event.clientX - bounds.left) / bounds.width - 0.5) * TILT_DEGREES * 2);
    }
  };

  const onPointerLeave = () => {
    tiltX.set(0);
    tiltY.set(0);
  };

  return (
    <motion.section
      ref={ref}
      className={`${styles.card} ${className ?? ""}`}
      data-span={span}
      data-tile={tile || undefined}
      data-tall={tall || undefined}
      onPointerMove={onPointerMove}
      onPointerLeave={tilt ? onPointerLeave : undefined}
      style={tilt ? { rotateX, rotateY, transformPerspective: 900 } : undefined}
      variants={revealVariants}
      custom={index}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, amount: 0.12 }}
    >
      {(title || actions || table) && (
        <header className={styles.cardHeader}>
          {Icon && (
            <span className={styles.cardIcon}>
              <Icon size={16} strokeWidth={2} />
            </span>
          )}
          <div className={styles.cardHeading}>
            {title && <h2 className={styles.cardTitle}>{title}</h2>}
            {subtitle && <p className={styles.cardSubtitle}>{subtitle}</p>}
          </div>
          <div className={styles.cardActions}>
            {actions}
            {table && (
              <button
                type="button"
                className={styles.iconButton}
                aria-pressed={showTable}
                aria-label={showTable ? `Show ${title ?? "chart"} as chart` : `Show ${title ?? "chart"} as table`}
                title={showTable ? "Chart view" : "Table view"}
                onClick={() => setShowTable((value) => !value)}
              >
                {showTable ? <ChartNoAxesColumn size={15} /> : <Table2 size={15} />}
              </button>
            )}
          </div>
        </header>
      )}
      <div className={styles.cardBody}>
        <AnimatePresence mode="wait" initial={false}>
          {showTable && table ? (
            <motion.div
              key="table"
              initial={{ opacity: 0, rotateX: -12, y: 8 }}
              animate={{ opacity: 1, rotateX: 0, y: 0 }}
              exit={{ opacity: 0, rotateX: 12, y: -8 }}
              transition={{ duration: 0.25 }}
              className={styles.tableWrap}
            >
              <DataTable table={table} />
            </motion.div>
          ) : (
            <motion.div
              key="chart"
              initial={{ opacity: 0, rotateX: 12, y: -8 }}
              animate={{ opacity: 1, rotateX: 0, y: 0 }}
              exit={{ opacity: 0, rotateX: -12, y: 8 }}
              transition={{ duration: 0.25 }}
              className={styles.chartWrap}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}

function DataTable({ table }: { table: TableData }) {
  return (
    <table className={styles.dataTable}>
      <caption className="visually-hidden">{table.caption}</caption>
      <thead>
        <tr>
          {table.columns.map((column) => (
            <th key={column} scope="col">
              {column}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {table.rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell, cellIndex) =>
              cellIndex === 0 ? (
                <th key={cellIndex} scope="row">
                  {cell}
                </th>
              ) : (
                <td key={cellIndex}>{cell}</td>
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
