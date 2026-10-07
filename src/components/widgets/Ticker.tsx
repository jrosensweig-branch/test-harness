import { Sparkles } from "lucide-react";
import styles from "./widgets.module.css";

/** Infinite marquee. The list is rendered twice so the loop seam is invisible; hover pauses it. */
export function Ticker({ items }: { items: string[] }) {
  return (
    <div className={styles.ticker} role="marquee" aria-label="Latest harness events">
      <div className={styles.tickerTrack}>
        {[0, 1].map((copy) => (
          <ul key={copy} className={styles.tickerList} aria-hidden={copy === 1}>
            {items.map((item) => (
              <li key={item} className={styles.tickerItem}>
                <Sparkles size={13} className={styles.tickerIcon} />
                {item}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
