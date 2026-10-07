"use client";

import { createContext, useContext, useSyncExternalStore } from "react";

/**
 * Scene-local playback clock. It only advances while the explainer is playing,
 * so scripted beats (a cursor click, a filter toggle) pause with the video.
 * Components subscribe through `useCue`, which re-renders only when a cue flips.
 */
export class SceneClock {
  private elapsedMs = 0;
  private listeners = new Set<() => void>();

  get elapsed() {
    return this.elapsedMs;
  }

  reset() {
    this.elapsedMs = 0;
    this.emit();
  }

  advance(deltaMs: number) {
    this.elapsedMs += deltaMs;
    this.emit();
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private emit() {
    this.listeners.forEach((listener) => listener());
  }
}

export const SceneClockContext = createContext<SceneClock | null>(null);

function useClock() {
  const clock = useContext(SceneClockContext);
  if (!clock) throw new Error("useCue must be used inside an explainer scene");
  return clock;
}

/** True once the scene has been on screen for `atMs`. */
export function useCue(atMs: number): boolean {
  const clock = useClock();
  return useSyncExternalStore(
    clock.subscribe,
    () => clock.elapsed >= atMs,
    () => false,
  );
}

/** Index of the last cue reached (−1 before the first), for stepping through a sequence. */
export function useCueIndex(cuesMs: number[]): number {
  const clock = useClock();
  return useSyncExternalStore(
    clock.subscribe,
    () => {
      let reached = -1;
      cuesMs.forEach((cue, index) => {
        if (clock.elapsed >= cue) reached = index;
      });
      return reached;
    },
    () => -1,
  );
}

/** Raw elapsed time, quantized so subscribers re-render at most every `stepMs`. */
export function useElapsed(stepMs = 100): number {
  const clock = useClock();
  return useSyncExternalStore(
    clock.subscribe,
    () => Math.floor(clock.elapsed / stepMs) * stepMs,
    () => 0,
  );
}
