/**
 * Deterministic mock data. Everything rendered on the server comes from a seeded
 * RNG so the client hydrates the exact same markup; live updates only start
 * after mount (see live.ts).
 */
import type { ValueFormat } from "./format";

export function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

const ANCHOR = Date.UTC(2026, 9, 7, 12);
const DAY_MS = 86_400_000;

export function dayLabel(daysAgo: number): string {
  return new Date(ANCHOR - daysAgo * DAY_MS).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export function hourLabel(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/* ---------------------------------------------------------------- suites -- */

/** Each suite owns a fixed categorical slot so its color never changes across charts or filters. */
export const SUITES = [
  { id: "ledger", label: "Ledger", slot: 1 },
  { id: "ach", label: "ACH", slot: 2 },
  { id: "transfers", label: "Transfers", slot: 3 },
  { id: "pay", label: "Pay", slot: 4 },
] as const;

export type SuiteId = (typeof SUITES)[number]["id"];

export const seriesColor = (slot: number) => `var(--series-${slot})`;

/* -------------------------------------------------------------- overview -- */

export type Kpi = {
  id: string;
  label: string;
  value: number;
  format: ValueFormat;
  delta: number;
  deltaKind: "pct" | "abs";
  upIsGood: boolean;
  trend: number[];
};

function walk(seed: number, length: number, start: number, volatility: number, drift = 0) {
  const random = seededRandom(seed);
  const values: number[] = [];
  let current = start;
  for (let index = 0; index < length; index++) {
    current = Math.max(0, current + (random() - 0.5) * volatility + drift);
    values.push(current);
  }
  return values;
}

export const KPIS: Kpi[] = [
  {
    id: "executed",
    label: "Tests executed · 24h",
    value: 128_430,
    format: "compact",
    delta: 0.084,
    deltaKind: "pct",
    upIsGood: true,
    trend: walk(11, 12, 90, 18, 3),
  },
  {
    id: "duration",
    label: "Avg suite duration",
    value: 252,
    format: "duration",
    delta: -0.061,
    deltaKind: "pct",
    upIsGood: false,
    trend: walk(12, 12, 300, 30, -4),
  },
  {
    id: "flaky",
    label: "Flaky tests",
    value: 23,
    format: "int",
    delta: 3,
    deltaKind: "abs",
    upIsGood: false,
    trend: walk(13, 12, 18, 4, 0.4),
  },
  {
    id: "failures",
    label: "Open failures",
    value: 7,
    format: "int",
    delta: -4,
    deltaKind: "abs",
    upIsGood: false,
    trend: walk(14, 12, 14, 3, -0.6),
  },
];

export const PASS_RATE_DAYS = 14;
export const PASS_RATE_LABELS = Array.from({ length: PASS_RATE_DAYS }, (_, index) =>
  dayLabel(PASS_RATE_DAYS - 1 - index),
);

export const PASS_RATE_SERIES = SUITES.slice(0, 3).map((suite, suiteIndex) => {
  const random = seededRandom(100 + suiteIndex);
  const base = [98.6, 96.4, 94.2][suiteIndex];
  return {
    id: suite.id,
    label: suite.label,
    color: seriesColor(suite.slot),
    values: Array.from({ length: PASS_RATE_DAYS }, (_, day) =>
      Math.min(99.9, base + Math.sin(day / 2 + suiteIndex) * 0.9 + (random() - 0.5) * 1.1 + day * 0.08),
    ),
  };
});

export const EXECUTION_HOURS = 24;
export const EXECUTIONS_PER_HOUR = Array.from({ length: EXECUTION_HOURS }, (_, hour) => {
  const random = seededRandom(200 + hour);
  const workday = Math.exp(-((hour - 14) ** 2) / 18);
  return Math.round(1800 + workday * 7200 + random() * 900);
});

export const FAILURE_CAUSES = [
  { id: "assertion", label: "Assertion", value: 42 },
  { id: "timeout", label: "Timeout", value: 27 },
  { id: "network", label: "Network", value: 14 },
  { id: "infra", label: "Infrastructure", value: 9 },
];

export type Status = "good" | "warning" | "serious" | "critical";

export const ENVIRONMENTS: {
  id: string;
  label: string;
  status: Status;
  version: string;
  deployedMinutesAgo: number;
  tests: number;
}[] = [
  { id: "dev", label: "dev", status: "good", version: "a1f9c2e", deployedMinutesAgo: 12, tests: 4_812 },
  { id: "staging", label: "staging", status: "warning", version: "7be0d41", deployedMinutesAgo: 94, tests: 4_790 },
  { id: "sandbox", label: "sandbox", status: "good", version: "7be0d41", deployedMinutesAgo: 181, tests: 4_790 },
  { id: "perf", label: "perf-lab", status: "critical", version: "3c22aa9", deployedMinutesAgo: 400, tests: 1_204 },
];

export const TICKER_ITEMS = [
  "ledger · 4,812 tests · 99.2% pass",
  "ach · nacha-file-builder green for 31 runs",
  "transfers · p95 142 ms",
  "pay · 2 flaky specs quarantined",
  "testcontainers · 38 warm pools",
  "nightly · 18m 04s end to end",
  "contract tests · 0 breaking changes",
  "coverage · 87.4% lines",
];

/* -------------------------------------------------------------- run feed -- */

const BRANCHES = [
  "feat/velocity-limits",
  "fix/null-ledger-entry",
  "chore/bump-spring-boot",
  "feat/retro-theme",
  "fix/ach-cutoff-tz",
  "feat/same-day-ach",
  "refactor/posting-chain",
  "fix/flaky-pubsub-ack",
];

export type FeedRun = {
  id: number;
  suite: SuiteId;
  branch: string;
  status: "passed" | "failed" | "running";
  durationSeconds: number;
  tests: number;
};

export function makeFeedRun(id: number, random: () => number): FeedRun {
  const suite = SUITES[Math.floor(random() * SUITES.length)];
  const roll = random();
  return {
    id,
    suite: suite.id,
    branch: BRANCHES[Math.floor(random() * BRANCHES.length)],
    status: roll < 0.18 ? "running" : roll < 0.27 ? "failed" : "passed",
    durationSeconds: Math.round(40 + random() * 420),
    tests: Math.round(200 + random() * 1600),
  };
}

export const INITIAL_FEED: FeedRun[] = (() => {
  const random = seededRandom(300);
  return Array.from({ length: 6 }, (_, index) => makeFeedRun(index, random));
})();

/* ------------------------------------------------------------------ runs -- */

export type RangeKey = "24h" | "7d" | "30d";

export const RANGES: { id: RangeKey; label: string }[] = [
  { id: "24h", label: "Last 24 hours" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
];

export function runsByBucket(range: RangeKey) {
  const length = range === "24h" ? 24 : range === "7d" ? 7 : 30;
  const labels = Array.from({ length }, (_, index) =>
    range === "24h" ? hourLabel(index) : dayLabel(length - 1 - index),
  );
  const perSuite = SUITES.map((suite, suiteIndex) => {
    const random = seededRandom(400 + suiteIndex * 31 + length);
    const scale = range === "24h" ? 6 : 60;
    const weight = [1.2, 0.9, 0.7, 0.5][suiteIndex];
    return {
      id: suite.id,
      label: suite.label,
      color: seriesColor(suite.slot),
      values: Array.from({ length }, (_, index) => {
        const rhythm = range === "24h" ? Math.exp(-((index - 14) ** 2) / 20) : 0.6 + 0.4 * Math.sin(index / 1.3);
        return Math.round(scale * weight * (1 + rhythm * 2) * (0.7 + random() * 0.6));
      }),
    };
  });
  return { labels, perSuite };
}

export function failureHeatmap(range: RangeKey, activeSuites: SuiteId[]) {
  const scale = (range === "24h" ? 0.3 : range === "7d" ? 1 : 3.4) * (activeSuites.length / SUITES.length);
  const random = seededRandom(500 + activeSuites.length * 7 + range.length);
  return WEEKDAYS.map((_, day) =>
    Array.from({ length: 24 }, (_, hour) => {
      const businessHours = Math.exp(-((hour - 13) ** 2) / 14);
      const weekday = day < 5 ? 1 : 0.25;
      const deployTuesday = day === 1 && hour >= 15 && hour <= 17 ? 2.2 : 1;
      return Math.round((2 + businessHours * 18 * weekday * deployTuesday + random() * 4) * scale);
    }),
  );
}

export const DURATION_BUCKETS = ["<1m", "1–2m", "2–3m", "3–4m", "4–5m", "5–6m", "6–8m", "8–10m", ">10m"];

export function durationHistogram(range: RangeKey, activeSuites: SuiteId[]) {
  const total = (range === "24h" ? 220 : range === "7d" ? 1500 : 6200) * (activeSuites.length / SUITES.length);
  const shape = [0.05, 0.12, 0.2, 0.22, 0.16, 0.11, 0.08, 0.04, 0.02];
  const random = seededRandom(600 + activeSuites.length + range.length * 3);
  return DURATION_BUCKETS.map((label, index) => ({
    label,
    value: Math.max(1, Math.round(total * shape[index] * (0.85 + random() * 0.3))),
  }));
}

export const SLOWEST_TESTS: { name: string; suite: SuiteId; seconds: number; trend: number }[] = [
  { name: "LedgerReconciliationIT › reconciles a million postings", suite: "ledger", seconds: 212, trend: 0.04 },
  { name: "NachaFileBuilderIT › builds same-day batch with addenda", suite: "ach", seconds: 164, trend: -0.12 },
  { name: "TransferSagaIT › compensates after downstream timeout", suite: "transfers", seconds: 141, trend: 0.21 },
  { name: "CardAuthChainComponentTest › approves under velocity cap", suite: "pay", seconds: 118, trend: -0.03 },
  { name: "ReturnsProcessorIT › maps R01 through R85", suite: "ach", seconds: 97, trend: 0.08 },
  { name: "BalanceProjectionIT › replays 30 days of events", suite: "ledger", seconds: 88, trend: -0.18 },
  { name: "PubSubRetryComponentTest › dead-letters after 5 nacks", suite: "transfers", seconds: 74, trend: 0.02 },
  { name: "SettlementWindowTest › rolls cutoff across DST", suite: "pay", seconds: 61, trend: -0.07 },
];

export type PipelineStage = { name: string; start: number; duration: number; status: "passed" | "failed" | "running" };

export const PIPELINE: PipelineStage[] = [
  { name: "Checkout", start: 0, duration: 8, status: "passed" },
  { name: "Install deps", start: 8, duration: 42, status: "passed" },
  { name: "Compile", start: 50, duration: 64, status: "passed" },
  { name: "Unit tests", start: 114, duration: 96, status: "passed" },
  { name: "Component tests", start: 114, duration: 148, status: "passed" },
  { name: "Integration · Testcontainers", start: 122, duration: 214, status: "running" },
  { name: "Contract tests", start: 262, duration: 52, status: "failed" },
  { name: "Publish report", start: 336, duration: 14, status: "passed" },
];

/* -------------------------------------------------------------- services -- */

export type ServiceNode = {
  id: string;
  label: string;
  kind: "edge" | "service" | "data";
  x: number;
  y: number;
  p95: number;
  slo: number;
  rps: number;
  errorRate: number;
};

export const SERVICES: ServiceNode[] = [
  { id: "gateway", label: "API Gateway", kind: "edge", x: 0.1, y: 0.5, p95: 38, slo: 120, rps: 2140, errorRate: 0.0004 },
  { id: "pay", label: "Pay", kind: "service", x: 0.4, y: 0.14, p95: 96, slo: 180, rps: 820, errorRate: 0.0011 },
  { id: "ach", label: "ACH", kind: "service", x: 0.4, y: 0.5, p95: 151, slo: 180, rps: 410, errorRate: 0.0032 },
  { id: "transfers", label: "Transfers", kind: "service", x: 0.4, y: 0.86, p95: 172, slo: 180, rps: 530, errorRate: 0.0087 },
  { id: "ledger", label: "Ledger", kind: "service", x: 0.68, y: 0.5, p95: 64, slo: 150, rps: 1760, errorRate: 0.0002 },
  { id: "pubsub", label: "Pub/Sub", kind: "data", x: 0.68, y: 0.14, p95: 12, slo: 60, rps: 3100, errorRate: 0 },
  { id: "db", label: "Postgres", kind: "data", x: 0.92, y: 0.5, p95: 8, slo: 40, rps: 5400, errorRate: 0 },
];

export const SERVICE_EDGES: [string, string][] = [
  ["gateway", "pay"],
  ["gateway", "ach"],
  ["gateway", "transfers"],
  ["pay", "ledger"],
  ["ach", "ledger"],
  ["transfers", "ledger"],
  ["pay", "pubsub"],
  ["transfers", "pubsub"],
  ["pubsub", "ledger"],
  ["ledger", "db"],
];

export function latencyStatus(p95: number, slo: number): Status {
  const ratio = p95 / slo;
  if (ratio < 0.7) return "good";
  if (ratio < 0.9) return "warning";
  if (ratio < 1) return "serious";
  return "critical";
}

export const UPTIME_DAYS = 60;

export function uptimeHistory(serviceIndex: number): Status[] {
  const random = seededRandom(700 + serviceIndex);
  return Array.from({ length: UPTIME_DAYS }, () => {
    const roll = random();
    if (roll < 0.015 * (serviceIndex % 3)) return "critical";
    if (roll < 0.06) return "warning";
    return "good";
  });
}

export const THROUGHPUT_WINDOW = 40;

export function initialThroughput(seed: number, base: number) {
  return walk(seed, THROUGHPUT_WINDOW, base, base * 0.12);
}

/* ------------------------------------------------------------------ live -- */

const LOG_TESTS: Record<SuiteId, string[]> = {
  ledger: [
    "LedgerPostingComponentTest › posts balanced double entry",
    "BalanceProjectionIT › projects pending holds",
    "JournalReplayTest › is idempotent on duplicate events",
  ],
  ach: [
    "NachaFileBuilderTest › pads batch to block of ten",
    "ReturnsProcessorIT › handles R02 account closed",
    "CutoffSchedulerTest › respects Fed holiday calendar",
  ],
  transfers: [
    "TransferSagaIT › settles instant transfer",
    "PubSubRetryComponentTest › backs off exponentially",
    "TransferControllerTest › rejects negative amount with 400",
  ],
  pay: [
    "CardAuthChainComponentTest › declines on SUSPECTED_FRAUD",
    "VelocityCheckStepTest › counts only settled loads",
    "RefundFlowIT › reverses partial capture",
  ],
};

export type LogLine = {
  id: number;
  level: "PASS" | "FAIL" | "SKIP" | "INFO";
  suite: SuiteId;
  message: string;
  millis: number;
};

export function makeLogLine(id: number, random: () => number): LogLine {
  const suite = SUITES[Math.floor(random() * SUITES.length)].id;
  const roll = random();
  const level: LogLine["level"] = roll < 0.06 ? "FAIL" : roll < 0.11 ? "SKIP" : roll < 0.2 ? "INFO" : "PASS";
  const tests = LOG_TESTS[suite];
  const message =
    level === "INFO"
      ? ["spinning up postgres:16 container", "reusing warm testcontainer pool", "seeding 2,000 ledger accounts", "flushing pub/sub emulator"][
          Math.floor(random() * 4)
        ]
      : tests[Math.floor(random() * tests.length)];
  return { id, level, suite, message, millis: Math.round(4 + random() * (level === "FAIL" ? 2400 : 380)) };
}

export const WORKER_COUNT = 64;
export type WorkerState = "idle" | "running" | "passed" | "failed";

export function initialWorkers(): WorkerState[] {
  const random = seededRandom(800);
  return Array.from({ length: WORKER_COUNT }, () => {
    const roll = random();
    return roll < 0.5 ? "running" : roll < 0.8 ? "passed" : roll < 0.84 ? "failed" : "idle";
  });
}

export const LIVE_TOTAL_TESTS = 4_820;
