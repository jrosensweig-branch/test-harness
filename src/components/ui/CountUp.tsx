"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { formatValue, type ValueFormat } from "@/lib/format";

/** Counts up from the previous value when scrolled into view. Writes to the DOM directly — no re-render per frame. */
export function CountUp({ value, format, className }: { value: number; format: ValueFormat; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduceMotion = useReducedMotion();
  const previous = useRef(0);

  useEffect(() => {
    const node = ref.current;
    if (!node || !inView) return;
    if (reduceMotion) {
      node.textContent = formatValue(value, format);
      previous.current = value;
      return;
    }
    const controls = animate(previous.current, value, {
      duration: previous.current === 0 ? 1.6 : 0.6,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        node.textContent = formatValue(latest, format);
      },
    });
    previous.current = value;
    return () => controls.stop();
  }, [inView, value, format, reduceMotion]);

  return (
    <span ref={ref} className={className}>
      {formatValue(value, format)}
    </span>
  );
}
