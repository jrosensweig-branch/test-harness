import styles from "./shell.module.css";

/** Animated logo: a spinning conic ring around a pulse glyph. CSS swaps the glyph per theme. */
export function BrandMark() {
  return (
    <span className={styles.brandMark} aria-hidden>
      <span className={styles.brandRing} />
      <svg viewBox="0 0 24 24" className={styles.brandGlyph}>
        <path d="M3 12h4l2.5-6 5 12 2.5-6h4" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className={styles.brandPrompt}>&gt;_</span>
    </span>
  );
}
