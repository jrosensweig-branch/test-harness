import styles from "./charts.module.css";

export type LegendItem = { id: string; label: string; color: string; value?: string };

/** Legend keys mirror the mark: a line for line charts, a rect for bars and areas. Text stays in ink tokens. */
export function Legend({ items, shape }: { items: LegendItem[]; shape: "line" | "rect" }) {
  return (
    <ul className={styles.legend}>
      {items.map((item) => (
        <li key={item.id} className={styles.legendItem}>
          <span className={styles.legendKey} data-shape={shape} style={{ background: item.color }} />
          <span className={styles.legendLabel}>{item.label}</span>
          {item.value && <span className={styles.legendValue}>{item.value}</span>}
        </li>
      ))}
    </ul>
  );
}
