"use client";

import { Captions, CaptionsOff, Music, Pause, Play, RotateCcw, Volume2, VolumeX, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useMounted } from "@/lib/live";
import { Scenery } from "../shell/Scenery";
import { useTheme } from "../shell/useTheme";
import { Narrator } from "./narrator";
import { SceneClock, SceneClockContext } from "./sceneClock";
import { SCENE_COMPONENTS } from "./scenes/Scenes";
import { STAGE_WIDTH } from "./scenes/SceneKit";
import { SCENES, SCENE_ESTIMATES, SENTENCE_GAP_MS, TOTAL_ESTIMATE_MS } from "./script";
import { Soundtrack } from "./soundtrack";
import styles from "./help.module.css";

type Status = "poster" | "playing" | "paused" | "ended";

const SCENE_LEAD_IN_MS = 450;
const MAX_FRAME_MS = 100;

/**
 * Portaled to <body>: the top bar uses backdrop-filter, which would otherwise
 * become the containing block for this fixed-position overlay.
 */
export function ExplainerDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const mounted = useMounted();
  if (!mounted) return null;
  return createPortal(<AnimatePresence>{open && <Player key="explainer" onClose={onClose} />}</AnimatePresence>, document.body);
}

function formatClock(ms: number) {
  const seconds = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function Player({ onClose }: { onClose: () => void }) {
  const { theme } = useTheme();
  const [clock] = useState(() => new SceneClock());
  const narrator = useRef<Narrator | null>(null);
  const soundtrack = useRef<Soundtrack | null>(null);
  const gapTimer = useRef<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const stageOuter = useRef<HTMLDivElement>(null);

  const [status, setStatus] = useState<Status>("poster");
  const [sceneIndex, setSceneIndex] = useState(0);
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [musicOn, setMusicOn] = useState(true);
  const [voiceOn, setVoiceOn] = useState(true);
  const [captionsOn, setCaptionsOn] = useState(true);
  const [scale, setScale] = useState(1);

  // Mutable playback state read by audio callbacks, which outlive any single render.
  const playback = useRef({ status: "poster" as Status, scene: 0, sentence: 0, narrationDone: false });

  const updateStatus = useCallback((next: Status) => {
    playback.current.status = next;
    setStatus(next);
  }, []);

  const clearGap = () => {
    if (gapTimer.current !== null) window.clearTimeout(gapTimer.current);
    gapTimer.current = null;
  };

  /** Narrates a scene from the given sentence onward, one utterance per sentence with a short breath between. */
  const narrateFrom = useCallback((scene: number, firstSentence: number) => {
    const speak = (sentence: number) => {
      playback.current.sentence = sentence;
      setSentenceIndex(sentence);
      soundtrack.current?.duck(true);
      narrator.current?.speak(SCENES[scene].sentences[sentence], {
        onEnd: () => {
          const state = playback.current;
          if (state.scene !== scene || state.status !== "playing") return;
          if (sentence + 1 < SCENES[scene].sentences.length) {
            gapTimer.current = window.setTimeout(() => speak(sentence + 1), SENTENCE_GAP_MS);
          } else {
            state.narrationDone = true;
            soundtrack.current?.duck(false);
          }
        },
      });
    };
    speak(firstSentence);
  }, []);

  const startScene = useCallback(
    (scene: number) => {
      clearGap();
      narrator.current?.stop();
      playback.current = { ...playback.current, scene, sentence: 0, narrationDone: false };
      clock.reset();
      setSceneIndex(scene);
      setSentenceIndex(0);
      soundtrack.current?.duck(false);
      gapTimer.current = window.setTimeout(() => narrateFrom(scene, 0), SCENE_LEAD_IN_MS);
    },
    [clock, narrateFrom],
  );

  /** Audio must be created inside a user gesture, so this runs from click and key handlers only. */
  const ensureAudio = useCallback(() => {
    if (!narrator.current) narrator.current = new Narrator();
    narrator.current.muted = !voiceOn;
    if (!soundtrack.current) {
      soundtrack.current = new Soundtrack(theme ?? "dark");
      soundtrack.current.setMuted(!musicOn);
      soundtrack.current.start();
    }
  }, [musicOn, voiceOn, theme]);

  const playFrom = useCallback(
    (scene: number) => {
      if (playback.current.status === "ended") {
        soundtrack.current?.dispose();
        soundtrack.current = null;
      }
      ensureAudio();
      soundtrack.current?.resume();
      updateStatus("playing");
      startScene(scene);
    },
    [ensureAudio, startScene, updateStatus],
  );

  const pause = useCallback(() => {
    clearGap();
    narrator.current?.stop();
    soundtrack.current?.pause();
    updateStatus("paused");
  }, [updateStatus]);

  const resume = useCallback(() => {
    ensureAudio();
    soundtrack.current?.resume();
    updateStatus("playing");
    const { scene, sentence, narrationDone } = playback.current;
    // Speech can't resume mid-sentence reliably across browsers, so the sentence restarts.
    if (!narrationDone) narrateFrom(scene, sentence);
  }, [ensureAudio, narrateFrom, updateStatus]);

  const togglePlay = useCallback(() => {
    const current = playback.current.status;
    if (current === "playing") pause();
    else if (current === "paused") resume();
    else playFrom(0);
  }, [pause, resume, playFrom]);

  const seek = useCallback((scene: number) => playFrom(Math.max(0, Math.min(SCENES.length - 1, scene))), [playFrom]);

  // Playback clock: advances only while playing; moves to the next scene once narration and minimum time are done.
  useEffect(() => {
    if (status !== "playing") return;
    let frame = 0;
    let last = performance.now();
    const tick = (now: number) => {
      clock.advance(Math.min(now - last, MAX_FRAME_MS));
      last = now;
      const state = playback.current;
      if (state.narrationDone && clock.elapsed >= SCENES[state.scene].minMs) {
        if (state.scene + 1 < SCENES.length) {
          startScene(state.scene + 1);
        } else {
          narrator.current?.stop();
          soundtrack.current?.fadeOut(3);
          updateStatus("ended");
          return;
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [status, clock, startScene, updateStatus]);

  // The soundtrack follows the app theme, switching on the next bar line.
  useEffect(() => {
    if (theme) soundtrack.current?.setTheme(theme);
  }, [theme]);

  // Tear down audio and speech when the dialog closes.
  useEffect(
    () => () => {
      clearGap();
      narrator.current?.dispose();
      soundtrack.current?.dispose();
    },
    [],
  );

  // Lock page scroll and restore focus to whatever opened the dialog.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = previousOverflow;
      opener?.focus();
    };
  }, []);

  // Scale the 960×540 design stage to the dialog width.
  useLayoutEffect(() => {
    const element = stageOuter.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / STAGE_WIDTH));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const toggleMusic = () => {
    const next = !musicOn;
    setMusicOn(next);
    soundtrack.current?.setMuted(!next);
  };

  const toggleVoice = () => {
    const next = !voiceOn;
    setVoiceOn(next);
    if (!narrator.current) return;
    narrator.current.muted = !next;
    const { status: current, scene, sentence, narrationDone } = playback.current;
    if (current === "playing" && !narrationDone) {
      clearGap();
      narrateFrom(scene, sentence);
    }
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const target = event.target as HTMLElement;
    const onButton = target.tagName === "BUTTON";
    switch (event.key) {
      case "Escape":
        event.preventDefault();
        onClose();
        return;
      case " ":
      case "k":
        if (event.key === " " && onButton) return; // let the focused button handle Space itself
        event.preventDefault();
        togglePlay();
        return;
      case "ArrowRight":
        event.preventDefault();
        seek(playback.current.scene + 1);
        return;
      case "ArrowLeft":
        event.preventDefault();
        seek(playback.current.scene - 1);
        return;
      case "m":
        toggleMusic();
        return;
      case "v":
        toggleVoice();
        return;
      case "c":
        setCaptionsOn((value) => !value);
        return;
      case "Tab": {
        // Keep focus inside the dialog.
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>("button:not([disabled])");
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }
  };

  const scene = SCENES[sceneIndex];
  const SceneComponent = SCENE_COMPONENTS[scene.id];
  const caption = (scene.captions ?? scene.sentences)[sentenceIndex];
  const showStage = status === "playing" || status === "paused" || status === "ended";

  return (
    <motion.div
      className={styles.overlay}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="explainer-title"
        data-blocks-shortcuts
        onKeyDown={onKeyDown}
        initial={{ opacity: 0, y: 30, scale: 0.95, filter: "blur(10px)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: 16, scale: 0.97, filter: "blur(6px)" }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
      >
        <header className={styles.dialogHeader}>
          <div className={styles.dialogHeading}>
            <h2 id="explainer-title" className={styles.dialogTitle}>
              Take the tour
            </h2>
            <p className={styles.dialogSubtitle}>Narrated · about {formatClock(TOTAL_ESTIMATE_MS)} · sound on for the full effect</p>
          </div>
          <button type="button" className={styles.iconButton} onClick={onClose} aria-label="Close tour">
            <X size={17} />
          </button>
        </header>

        <div ref={stageOuter} className={styles.stageOuter}>
          <div className={styles.stage} style={{ transform: `scale(${scale})` }} data-paused={status === "paused"}>
            <Scenery variant={theme ?? "dark"} />
            <div className={styles.stageDim} />

            <SceneClockContext.Provider value={clock}>
              <AnimatePresence mode="wait">
                {showStage && (
                  <motion.div
                    key={scene.id}
                    className={styles.sceneLayer}
                    data-scene-root
                    initial={{ opacity: 0, scale: 0.97, filter: "blur(10px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 1.03, filter: "blur(10px)" }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <SceneComponent />
                  </motion.div>
                )}
              </AnimatePresence>
            </SceneClockContext.Provider>

            <AnimatePresence mode="wait">
              {captionsOn && showStage && status !== "ended" && caption && (
                <motion.p
                  key={`${scene.id}-${sentenceIndex}`}
                  className={styles.captions}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.25 }}
                >
                  {caption}
                </motion.p>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {status === "poster" && (
                <motion.div className={styles.poster} exit={{ opacity: 0, scale: 1.05 }} transition={{ duration: 0.35 }}>
                  <p className={styles.posterEyebrow}>Test Harness · the tour</p>
                  <h3 className={styles.posterTitle}>Ninety seconds to mission control</h3>
                  <motion.button
                    type="button"
                    className={styles.playBig}
                    onClick={() => playFrom(0)}
                    aria-label="Play the tour"
                    autoFocus
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                  >
                    <span className={styles.playRing} />
                    <Play size={38} fill="currentColor" />
                  </motion.button>
                  <p className={styles.posterMeta}>Narrated with captions · music matches your theme</p>
                  <div className={styles.chapterList}>
                    {SCENES.slice(1, -1).map((entry, index) => (
                      <button key={entry.id} type="button" className={styles.chapterChip} onClick={() => playFrom(index + 1)}>
                        {entry.chapter}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
              {status === "ended" && (
                <motion.div className={styles.endCard} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.5 }}>
                  <div className={styles.endActions}>
                    <button type="button" className={styles.primaryButton} onClick={() => playFrom(0)} autoFocus>
                      <RotateCcw size={16} /> Watch again
                    </button>
                    <button type="button" className={styles.secondaryButton} onClick={onClose}>
                      Start exploring
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className={styles.controls}>
          <button
            type="button"
            className={styles.iconButton}
            onClick={togglePlay}
            aria-label={status === "playing" ? "Pause" : "Play"}
            title={status === "playing" ? "Pause (Space)" : "Play (Space)"}
          >
            {status === "playing" ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <span className={styles.chapterNow}>{showStage ? scene.chapter : "Ready"}</span>
          <ProgressBar clock={clock} sceneIndex={sceneIndex} status={status} onSeek={seek} />
          <button
            type="button"
            className={styles.iconButton}
            onClick={toggleMusic}
            aria-pressed={musicOn}
            aria-label="Background music"
            title="Music (M)"
          >
            <Music size={16} />
          </button>
          <button
            type="button"
            className={styles.iconButton}
            onClick={toggleVoice}
            aria-pressed={voiceOn}
            aria-label="Narration"
            title="Narration (V)"
          >
            {voiceOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => setCaptionsOn((value) => !value)}
            aria-pressed={captionsOn}
            aria-label="Captions"
            title="Captions (C)"
          >
            {captionsOn ? <Captions size={16} /> : <CaptionsOff size={16} />}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

const SCENE_STARTS = SCENE_ESTIMATES.map((_, index) => SCENE_ESTIMATES.slice(0, index).reduce((sum, ms) => sum + ms, 0));

function ProgressBar({
  clock,
  sceneIndex,
  status,
  onSeek,
}: {
  clock: SceneClock;
  sceneIndex: number;
  status: Status;
  onSeek: (scene: number) => void;
}) {
  const elapsed = useSyncExternalStore(
    clock.subscribe,
    () => Math.floor(clock.elapsed / 100) * 100,
    () => 0,
  );

  const sceneProgress = (index: number) => {
    if (status === "poster") return 0;
    if (status === "ended" || index < sceneIndex) return 1;
    if (index > sceneIndex) return 0;
    return Math.min(1, elapsed / SCENE_ESTIMATES[index]);
  };

  const total =
    status === "poster"
      ? 0
      : status === "ended"
        ? TOTAL_ESTIMATE_MS
        : SCENE_STARTS[sceneIndex] + Math.min(elapsed, SCENE_ESTIMATES[sceneIndex]);

  return (
    <>
      <div className={styles.progress} role="group" aria-label="Chapters">
        {SCENES.map((scene, index) => (
          <button
            key={scene.id}
            type="button"
            className={styles.segment}
            style={{ flexGrow: SCENE_ESTIMATES[index] }}
            onClick={() => onSeek(index)}
            aria-label={`Jump to ${scene.chapter}`}
            title={scene.chapter}
          >
            <span className={styles.segmentFill} style={{ width: `${sceneProgress(index) * 100}%` }} />
          </button>
        ))}
      </div>
      <span className={styles.time}>
        {formatClock(total)} / {formatClock(TOTAL_ESTIMATE_MS)}
      </span>
    </>
  );
}
