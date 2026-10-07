"use client";

import { CircleCheck, GitBranch } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { ColumnChart } from "@/components/charts/ColumnChart";
import { Gauge } from "@/components/charts/Gauge";
import { Heatmap } from "@/components/charts/Heatmap";
import { LineChart } from "@/components/charts/LineChart";
import { Sparkline } from "@/components/charts/Sparkline";
import { BrandMark } from "@/components/shell/BrandMark";
import { CountUp } from "@/components/ui/CountUp";
import { Topology } from "@/components/widgets/Topology";
import { MiniDashboard } from "@/components/widgets/ThemePreview";
import { formatDuration } from "@/lib/format";
import {
  KPIS,
  PASS_RATE_LABELS,
  PASS_RATE_SERIES,
  SERVICES,
  SLOWEST_TESTS,
  SUITES,
  WEEKDAYS,
  failureHeatmap,
  hourLabel,
  makeLogLine,
  runsByBucket,
  seededRandom,
  seriesColor,
  type SuiteId,
} from "@/lib/mock";
import { THEMES } from "@/lib/themes";
import type { SceneId } from "../script";
import { useCue, useCueIndex, useElapsed } from "../sceneClock";
import { Cursor, Keycap, Panel, SceneLayout } from "./SceneKit";
import styles from "../help.module.css";

const ease = [0.22, 1, 0.36, 1] as const;

/* ------------------------------------------------------------------ intro -- */

const INTRO_CHIPS = [
  { label: "98.7% pass rate", at: 1800, className: styles.chipTopLeft },
  { label: "4,812 tests", at: 2600, className: styles.chipTopRight },
  { label: "7 services mapped", at: 3400, className: styles.chipBottomLeft },
  { label: "4 themes", at: 4200, className: styles.chipBottomRight },
];

function IntroScene() {
  return (
    <div className={styles.centerScene}>
      <motion.div
        className={styles.heroMark}
        initial={{ scale: 0.3, rotate: -30, opacity: 0 }}
        animate={{ scale: 2.4, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 14 }}
      >
        <BrandMark />
      </motion.div>
      <motion.h3
        className={styles.heroTitle}
        initial={{ opacity: 0, y: 30, letterSpacing: "0.3em" }}
        animate={{ opacity: 1, y: 0, letterSpacing: "-0.02em" }}
        transition={{ duration: 1.1, ease, delay: 0.3 }}
      >
        Test Harness
      </motion.h3>
      <motion.p
        className={styles.heroTagline}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.9 }}
      >
        Mission control for every suite, service and run.
      </motion.p>
      {INTRO_CHIPS.map((chip) => (
        <FloatingChip key={chip.label} {...chip} />
      ))}
    </div>
  );
}

function FloatingChip({ label, at, className }: { label: string; at: number; className: string }) {
  const shown = useCue(at);
  return (
    <motion.span
      className={`${styles.floatingChip} ${className}`}
      initial={{ opacity: 0, scale: 0.6 }}
      animate={shown ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
    >
      <CircleCheck size={14} />
      {label}
    </motion.span>
  );
}

/* -------------------------------------------------------- mission control -- */

function MissionScene() {
  const toast = useCue(10500);
  return (
    <SceneLayout
      index={1}
      title="Mission Control"
      bullets={[
        { text: "Hero pass rate", at: 1500 },
        { text: "Live KPIs & suite trends", at: 4200 },
        { text: "Why tests fail", at: 8000 },
        { text: "Real-time run feed", at: 10500 },
      ]}
    >
      <div className={styles.missionTop}>
        <Panel at={400} className={styles.ringPanel}>
          <svg viewBox="0 0 120 120" className={styles.ring} aria-hidden>
            <circle cx="60" cy="60" r="50" className={styles.ringTrack} />
            <motion.circle
              cx="60"
              cy="60"
              r="50"
              className={styles.ringArc}
              transform="rotate(-90 60 60)"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 0.987 }}
              transition={{ duration: 1.8, ease, delay: 0.6 }}
            />
          </svg>
          <div className={styles.ringCenter}>
            <CountUp value={98.7} format="percent" className={styles.ringValue} />
            <span className={styles.ringCaption}>pass rate</span>
          </div>
        </Panel>
        <div className={styles.kpiStack}>
          {KPIS.slice(0, 2).map((kpi, index) => (
            <Panel key={kpi.id} at={3800 + index * 500} className={styles.kpiPanel}>
              <div>
                <p className={styles.panelLabel}>{kpi.label}</p>
                <p className={styles.kpiValue}>
                  {kpi.format === "duration" ? formatDuration(kpi.value) : <CountUp value={kpi.value} format={kpi.format} />}
                </p>
              </div>
              <div className={styles.kpiSpark}>
                <Sparkline values={kpi.trend} height={36} />
              </div>
            </Panel>
          ))}
        </div>
      </div>
      <Panel at={5600} className={styles.chartPanel}>
        <p className={styles.panelLabel}>Pass rate by suite · 14 days</p>
        <LineChart
          series={PASS_RATE_SERIES}
          labels={PASS_RATE_LABELS}
          format="percent"
          zeroBaseline={false}
          endLabels
          height={150}
          ariaLabel="Pass rate by suite"
        />
      </Panel>
      <AnimatePresence>
        {toast && (
          <motion.div
            className={styles.toast}
            initial={{ opacity: 0, x: 80, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
          >
            <span className={styles.toastSwatch} style={{ background: seriesColor(1) }} />
            <strong>Ledger</strong>
            <span className={styles.toastBranch}>
              <GitBranch size={12} /> feat/velocity-limits
            </span>
            <span className={styles.toastStatus}>
              <CircleCheck size={13} /> Passed
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </SceneLayout>
  );
}

/* -------------------------------------------------------------- test runs -- */

const RUNS_VOLUME = runsByBucket("7d");
const RUNS_HEATMAP = failureHeatmap("7d", SUITES.map((suite) => suite.id));
const HOURS = Array.from({ length: 24 }, (_, hour) => hourLabel(hour));
const RUNS_CURSOR = [
  { at: 4400, target: '[data-cursor="chip-transfers"]' },
  { at: 5300, target: '[data-cursor="chip-ach"]', click: true },
  { at: 9400, target: '[data-cursor="heatmap"]' },
  { at: 12200, target: '[data-cursor="leaderboard"]' },
];

function RunsScene() {
  const achHidden = useCue(6100);
  const series = RUNS_VOLUME.perSuite.map((entry) =>
    achHidden && entry.id === "ach" ? { ...entry, values: entry.values.map(() => 0) } : entry,
  );
  const activeIds: SuiteId[] = SUITES.map((suite) => suite.id).filter((id) => !(achHidden && id === "ach"));

  return (
    <SceneLayout
      index={2}
      title="Test Runs"
      bullets={[
        { text: "Filters scope every chart", at: 3200 },
        { text: "Failure heatmap", at: 9400 },
        { text: "Pipeline & slowest tests", at: 12200 },
      ]}
    >
      <Panel at={300} className={styles.chipRow}>
        <span className={styles.rangePill}>7 days</span>
        {SUITES.map((suite) => (
          <span key={suite.id} className={styles.sceneChip} data-cursor={`chip-${suite.id}`} data-off={!activeIds.includes(suite.id)}>
            <span className={styles.toastSwatch} style={{ background: seriesColor(suite.slot) }} />
            {suite.label}
          </span>
        ))}
      </Panel>
      <Panel at={900} className={styles.chartPanel}>
        <ColumnChart labels={RUNS_VOLUME.labels} series={series} legendIds={activeIds} format="int" height={112} ariaLabel="Run volume by suite" />
      </Panel>
      <div className={styles.runsBottom}>
        <Panel at={8600} className={styles.heatPanel}>
          <div data-cursor="heatmap">
            <Heatmap rowLabels={WEEKDAYS} columnLabels={HOURS} values={RUNS_HEATMAP} valueLabel="failures" ariaLabel="Failure heatmap" />
          </div>
        </Panel>
        <Panel at={11600} className={styles.leaderPanel}>
          <div data-cursor="leaderboard">
            <p className={styles.panelLabel}>Slowest tests</p>
            {SLOWEST_TESTS.slice(0, 3).map((test, rank) => (
              <p key={test.name} className={styles.leaderLine}>
                <span>{rank + 1}</span>
                <span className={styles.leaderName}>{test.name.split(" › ")[0]}</span>
                <strong>{formatDuration(test.seconds)}</strong>
              </p>
            ))}
          </div>
        </Panel>
      </div>
      <Cursor stops={RUNS_CURSOR} />
    </SceneLayout>
  );
}

/* --------------------------------------------------------- service health -- */

const SERVICES_CURSOR = [
  { at: 4600, target: '[aria-label^="Ledger,"]' },
  { at: 5600, target: '[aria-label^="Transfers,"]', click: true },
  { at: 10200, target: '[data-cursor="gauge"]' },
];
const TRANSFERS = SERVICES.find((service) => service.id === "transfers")!;

function ServicesScene() {
  const selected = useCue(6400) ? "transfers" : "ledger";
  return (
    <SceneLayout
      index={3}
      title="Service Health"
      bullets={[
        { text: "Live dependency map", at: 1800 },
        { text: "Click any node to inspect", at: 6400 },
        { text: "SLOs, throughput, uptime", at: 9800 },
      ]}
    >
      <div className={styles.topologyWrap}>
        <Topology index={0} selected={selected} onSelect={() => {}} />
      </div>
      <Panel at={9800} className={styles.gaugePanel}>
        <div data-cursor="gauge">
          <Gauge label={TRANSFERS.label} value={TRANSFERS.p95} slo={TRANSFERS.slo} />
        </div>
      </Panel>
      <Cursor stops={SERVICES_CURSOR} />
    </SceneLayout>
  );
}

/* --------------------------------------------------------------- live ops -- */

const LOG_LINES = (() => {
  const random = seededRandom(1999);
  return Array.from({ length: 48 }, (_, index) => makeLogLine(index, random));
})();
const WORKERS = 48;
const LOG_EVERY_MS = 330;
const RUN_MS = 11000;

function workerState(worker: number, tick: number) {
  const roll = Math.sin(worker * 12.9898 + tick * 78.233) * 43758.5453;
  const fraction = roll - Math.floor(roll);
  return fraction < 0.5 ? "running" : fraction < 0.9 ? "passed" : fraction < 0.95 ? "failed" : "idle";
}

function LiveScene() {
  const elapsed = useElapsed(110);
  const visibleLines = LOG_LINES.slice(0, Math.min(LOG_LINES.length, Math.floor(elapsed / LOG_EVERY_MS) + 1)).slice(-9);
  const progress = Math.min(1, elapsed / RUN_MS);
  const tick = Math.floor(elapsed / 440);

  return (
    <SceneLayout
      index={4}
      title="Live Ops"
      bullets={[
        { text: "Streaming test output", at: 1800 },
        { text: "Progress with an ETA", at: 4800 },
        { text: "The whole worker pool", at: 8000 },
      ]}
    >
      <div className={styles.liveTop}>
        <Panel at={300} className={styles.terminalPanel}>
          {visibleLines.map((line) => (
            <p key={line.id} className={styles.logLine}>
              <span className={styles.logLevel} data-level={line.level}>
                {line.level}
              </span>
              <span className={styles.logMessage}>{line.message}</span>
            </p>
          ))}
          <span className={styles.logCursor} />
        </Panel>
        <Panel at={4200} className={styles.progressPanel}>
          <svg viewBox="0 0 120 120" className={styles.ring} aria-hidden>
            <circle cx="60" cy="60" r="50" className={styles.ringTrack} />
            <circle cx="60" cy="60" r="50" className={styles.ringArc} transform="rotate(-90 60 60)" pathLength={1} strokeDasharray={`${progress} 1`} />
          </svg>
          <div className={styles.ringCenter}>
            <span className={styles.ringValue}>{Math.round(progress * 100)}%</span>
            <span className={styles.ringCaption}>{progress < 1 ? `ETA ${formatDuration((1 - progress) * 140)}` : "done"}</span>
          </div>
        </Panel>
      </div>
      <Panel at={7400} className={styles.workerPanel}>
        {Array.from({ length: WORKERS }, (_, worker) => (
          <span key={worker} className={styles.worker} data-state={workerState(worker, tick)} />
        ))}
      </Panel>
    </SceneLayout>
  );
}

/* ------------------------------------------------------- themes & keyboard -- */

const THEME_CUES = [0, 2400, 4800, 7000];

function ThemesScene() {
  const themeIndex = Math.max(0, useCueIndex(THEME_CUES));
  const theme = THEMES[themeIndex];
  return (
    <SceneLayout
      index={5}
      title="Themes & shortcuts"
      bullets={[
        { text: "Light and dark", at: 600 },
        { text: "Synthwave and CRT", at: 4800 },
        { text: "Keyboard-first navigation", at: 9400 },
      ]}
    >
      <div className={styles.themeStage}>
        <AnimatePresence mode="popLayout">
          <motion.div
            key={theme.id}
            className={styles.themeFrame}
            initial={{ clipPath: "circle(0% at 85% 10%)" }}
            animate={{ clipPath: "circle(150% at 85% 10%)" }}
            exit={{ opacity: 1 }}
            transition={{ duration: 0.9, ease }}
          >
            <MiniDashboard id={theme.id} className={styles.themeMini} />
          </motion.div>
        </AnimatePresence>
        <div className={styles.themeDots}>
          {THEMES.map((entry, index) => (
            <span key={entry.id} data-active={index === themeIndex}>
              {entry.label}
            </span>
          ))}
        </div>
      </div>
      <Panel at={9200} className={styles.keysPanel}>
        <div className={styles.keyGroup}>
          <span>
            <Keycap label="⌘" pressAt={10000} />
            <Keycap label="K" pressAt={10000} />
          </span>
          <p>Jump anywhere</p>
        </div>
        <div className={styles.keyGroup}>
          <span>
            <Keycap label="G" pressAt={11400} />
            <Keycap label="R" pressAt={11700} />
          </span>
          <p>Switch screens</p>
        </div>
        <div className={styles.keyGroup}>
          <span>
            <Keycap label="T" pressAt={13200} />
          </span>
          <p>Change the vibe</p>
        </div>
      </Panel>
    </SceneLayout>
  );
}

/* ------------------------------------------------------------------ outro -- */

function OutroScene() {
  return (
    <div className={styles.centerScene}>
      <motion.div
        className={styles.heroMark}
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 2, opacity: 1 }}
        transition={{ type: "spring", stiffness: 140, damping: 14 }}
      >
        <BrandMark />
      </motion.div>
      <motion.h3
        className={styles.outroTitle}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease, delay: 0.3 }}
      >
        Know what&apos;s green.
        <br />
        <span className={styles.outroAccent}>Fix what&apos;s red.</span>
      </motion.h3>
      <motion.p
        className={styles.heroTagline}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.6 }}
      >
        Press <kbd className={styles.inlineKey}>⌘K</kbd> anytime to get started.
      </motion.p>
    </div>
  );
}

export const SCENE_COMPONENTS: Record<SceneId, () => React.ReactElement> = {
  intro: IntroScene,
  mission: MissionScene,
  runs: RunsScene,
  services: ServicesScene,
  live: LiveScene,
  themes: ThemesScene,
  outro: OutroScene,
};
