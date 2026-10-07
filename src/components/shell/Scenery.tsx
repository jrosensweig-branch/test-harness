import type { ThemeId } from "@/lib/themes";
import styles from "./scenery.module.css";

/** Small-scale theme backdrop for previews and the explainer stage. The parent needs `isolation: isolate`. */
export function Scenery({ variant }: { variant: ThemeId }) {
  return (
    <div className={styles.scenery} data-variant={variant} aria-hidden>
      <span className={styles.blob} />
      <span className={styles.blob} />
      <span className={styles.sun} />
      <span className={styles.floor} />
      <span className={styles.scan} />
    </div>
  );
}
