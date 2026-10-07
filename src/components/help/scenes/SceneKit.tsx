"use client";

import { Check } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useLayoutEffect, useRef, useState } from "react";
import { SCENES } from "../script";
import { useCue, useCueIndex } from "../sceneClock";
import styles from "../help.module.css";

/** Design size of the stage. Scenes are laid out in these units and scaled to fit the dialog. */
export const STAGE_WIDTH = 960;
export const STAGE_HEIGHT = 540;

const ease = [0.22, 1, 0.36, 1] as const;

export function SceneLayout({
  index,
  title,
  bullets,
  children,
}: {
  index: number;
  title: string;
  bullets: { text: string; at: number }[];
  children: React.ReactNode;
}) {
  const words = title.split(" ");
  return (
    <div className={styles.sceneLayout}>
      <div className={styles.sceneText}>
        <motion.p
          className={styles.sceneChapter}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease }}
        >
          {String(index).padStart(2, "0")} / {String(SCENES.length - 2).padStart(2, "0")}
        </motion.p>
        <h3 className={styles.sceneTitle}>
          {words.map((word, wordIndex) => (
            <span key={`${word}-${wordIndex}`} className={styles.sceneWordMask}>
              <motion.span
                className={styles.sceneWord}
                initial={{ y: "110%" }}
                animate={{ y: "0%" }}
                transition={{ duration: 0.7, ease, delay: 0.15 + wordIndex * 0.09 }}
              >
                {word}
              </motion.span>
            </span>
          ))}
        </h3>
        <ul className={styles.sceneBullets}>
          {bullets.map((bullet) => (
            <Bullet key={bullet.text} {...bullet} />
          ))}
        </ul>
      </div>
      <div className={styles.sceneVisual}>{children}</div>
    </div>
  );
}

function Bullet({ text, at }: { text: string; at: number }) {
  const shown = useCue(at);
  return (
    <motion.li
      className={styles.sceneBullet}
      initial={false}
      animate={shown ? { opacity: 1, x: 0 } : { opacity: 0.18, x: -6 }}
      transition={{ duration: 0.45, ease }}
    >
      <motion.span
        className={styles.sceneBulletIcon}
        animate={shown ? { scale: [0.4, 1.25, 1], rotate: [0, -12, 0] } : { scale: 0.6 }}
        transition={{ duration: 0.5 }}
      >
        <Check size={13} strokeWidth={3} />
      </motion.span>
      {text}
    </motion.li>
  );
}

/** A glass panel that pops in at its cue. */
export function Panel({
  at = 0,
  className,
  style,
  children,
}: {
  at?: number;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const shown = useCue(at);
  return (
    <motion.div
      className={`${styles.panel} ${className ?? ""}`}
      style={style}
      initial={{ opacity: 0, y: 24, scale: 0.94 }}
      animate={shown ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 24, scale: 0.94 }}
      transition={{ type: "spring", stiffness: 220, damping: 24 }}
    >
      {children}
    </motion.div>
  );
}

type CursorStop = { at: number; target: string; click?: boolean };

/**
 * A scripted mouse pointer. Each stop names a CSS selector inside the scene;
 * the pointer glides to that element's centre at the cue and optionally clicks.
 * Pass a module-level constant for `stops` so the measuring effect only reruns per cue.
 */
export function Cursor({ stops }: { stops: CursorStop[] }) {
  const index = useCueIndex(stops.map((stop) => stop.at));
  const anchor = useRef<HTMLDivElement>(null);
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null);

  useLayoutEffect(() => {
    if (index < 0 || !anchor.current) return;
    const root = anchor.current.closest<HTMLElement>("[data-scene-root]");
    const target = root?.querySelector(stops[index].target);
    if (!root || !target) return;
    // Measure against the cursor's own layer (its positioning origin) and undo the stage scale.
    const origin = anchor.current.getBoundingClientRect();
    const box = target.getBoundingClientRect();
    const scale = root.getBoundingClientRect().width / STAGE_WIDTH || 1;
    setPoint({
      x: (box.left + box.width / 2 - origin.left) / scale,
      y: (box.top + box.height / 2 - origin.top) / scale,
    });
  }, [index, stops]);

  const clicking = index >= 0 && stops[index].click;

  return (
    <div ref={anchor} className={styles.cursorLayer} aria-hidden>
      <motion.div
        className={styles.cursor}
        initial={{ opacity: 0 }}
        animate={point ? { opacity: 1, x: point.x, y: point.y, scale: clicking ? [1, 0.82, 1] : 1 } : { opacity: 0 }}
        transition={{ x: { duration: 0.8, ease }, y: { duration: 0.8, ease }, scale: { delay: 0.75, duration: 0.25 }, opacity: { duration: 0.3 } }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24">
          <path d="M4 3l14 7.5-6.2 1.6L9 18.5z" />
        </svg>
        <AnimatePresence>
          {clicking && (
            <motion.span
              key={index}
              className={styles.cursorRipple}
              initial={{ scale: 0, opacity: 0.8 }}
              animate={{ scale: 2.6, opacity: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

/** Keyboard key that depresses when its cue fires. */
export function Keycap({ label, pressAt }: { label: string; pressAt: number }) {
  const pressed = useCue(pressAt);
  const released = useCue(pressAt + 260);
  const down = pressed && !released;
  return (
    <motion.kbd
      className={styles.keycap}
      animate={{ y: down ? 3 : 0, boxShadow: down ? "0 0 0 var(--border-strong)" : "0 3px 0 var(--border-strong)" }}
      transition={{ duration: 0.1 }}
      data-lit={pressed}
    >
      {label}
    </motion.kbd>
  );
}
