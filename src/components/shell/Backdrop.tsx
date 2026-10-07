"use client";

import { motion, useScroll, useTransform } from "motion/react";
import styles from "./backdrop.module.css";

/**
 * Every theme's scenery is always mounted; CSS shows only the active theme's
 * layer. That keeps the server render theme-agnostic (no hydration mismatch)
 * and lets the view-transition reveal paint the new scenery instantly.
 */
export function Backdrop() {
  const { scrollY } = useScroll();
  const drift = useTransform(scrollY, [0, 1600], [0, -120]);
  const sunSink = useTransform(scrollY, [0, 1600], [0, 90]);
  const gridFade = useTransform(scrollY, [0, 1200], [1, 0.55]);

  return (
    <>
      <div className={styles.backdrop} aria-hidden>
        <motion.div className={styles.aurora} style={{ y: drift }}>
          <span className={styles.blobA} />
          <span className={styles.blobB} />
          <span className={styles.blobC} />
        </motion.div>
        <div className={styles.grain} />

        <div className={styles.synth}>
          <motion.div className={styles.stars} style={{ y: drift }} />
          <motion.div className={styles.sun} style={{ y: sunSink }} />
          <div className={styles.horizonGlow} />
          <motion.div className={styles.floor} style={{ opacity: gridFade }}>
            <div className={styles.floorGrid} />
          </motion.div>
        </div>

        <div className={styles.crtGlow} />
      </div>

      {/* CRT glass sits above the content so scanlines cover everything. */}
      <div className={styles.crtGlass} aria-hidden>
        <div className={styles.scanlines} />
        <div className={styles.rollBar} />
        <div className={styles.vignette} />
      </div>
    </>
  );
}
