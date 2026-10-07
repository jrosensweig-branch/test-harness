"use client";

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";

/** setInterval that pauses while the tab is hidden and always calls the latest callback. */
export function useInterval(callback: () => void, delayMs: number | null) {
  const savedCallback = useRef(callback);

  useLayoutEffect(() => {
    savedCallback.current = callback;
  });

  useEffect(() => {
    if (delayMs === null) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") savedCallback.current();
    }, delayMs);
    return () => window.clearInterval(id);
  }, [delayMs]);
}

/** Tracks the rendered width of an element so SVG charts can draw at real pixel size. */
export function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    setWidth(element.clientWidth);
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}

/** True once mounted on the client; used to gate time-of-day text that would break hydration. */
export function useMounted() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

const noopSubscribe = () => () => {};
