/**
 * The explainer's script. Each scene is narrated sentence by sentence (short
 * utterances dodge Chrome's habit of silently dropping long ones) and shows the
 * current sentence as a caption. A scene ends once its narration is done and
 * its minimum on-screen time has elapsed, so visuals never get cut short by a
 * fast voice.
 */

export type SceneId = "intro" | "mission" | "runs" | "services" | "live" | "themes" | "outro";

export type Scene = {
  id: SceneId;
  chapter: string;
  /** Minimum time on screen, in ms, even if the narration finishes sooner. */
  minMs: number;
  sentences: string[];
  /** Optional on-screen caption text where the spoken text differs (e.g. "⌘K" vs "Command K"). */
  captions?: string[];
};

export const SCENES: Scene[] = [
  {
    id: "intro",
    chapter: "Welcome",
    minMs: 8000,
    sentences: [
      "Welcome to Test Harness: mission control for every suite, every service, and every run.",
      "Here's your ninety second tour.",
    ],
  },
  {
    id: "mission",
    chapter: "Mission Control",
    minMs: 15000,
    sentences: [
      "Start at Mission Control.",
      "Your overall pass rate leads the way, backed by live KPIs, pass rate trends for every suite, and a clear breakdown of why tests fail.",
      "The live run feed and environment status show what's happening right now. No refresh required.",
    ],
  },
  {
    id: "runs",
    chapter: "Test Runs",
    minMs: 15000,
    sentences: [
      "Test Runs is where you dig in.",
      "Filter by time range and suite, and every chart follows along.",
      "Run volume, a heatmap of when failures strike, duration trends, your latest pipeline, and a leaderboard of the slowest tests.",
    ],
  },
  {
    id: "services",
    chapter: "Service Health",
    minMs: 14000,
    sentences: [
      "Service Health maps every dependency.",
      "Watch traffic flow through the topology, and click any node to inspect it.",
      "Latency against each SLO, live throughput, and sixty days of uptime, all at a glance.",
    ],
  },
  {
    id: "live",
    chapter: "Live Ops",
    minMs: 13000,
    sentences: [
      "Live Ops puts you in the control room.",
      "Streaming test output, real-time progress with an ETA, and the entire worker pool lighting up as your tests run.",
    ],
  },
  {
    id: "themes",
    chapter: "Themes & shortcuts",
    minMs: 15000,
    sentences: [
      "Make it yours with four themes: light, dark, synthwave, and CRT.",
      "And move at the speed of thought.",
      "Press Command K to jump anywhere, G and a letter to switch screens, or T to change the vibe.",
    ],
    captions: [
      "Make it yours with four themes: light, dark, synthwave, and CRT.",
      "And move at the speed of thought.",
      "Press ⌘K to jump anywhere, G + a letter to switch screens, or T to change the vibe.",
    ],
  },
  {
    id: "outro",
    chapter: "Get started",
    minMs: 7000,
    sentences: ["Test Harness. Know what's green, fix what's red, and enjoy every minute of it."],
  },
];

const WORDS_PER_SECOND = 2.6;
export const SENTENCE_GAP_MS = 280;
const SCENE_TAIL_MS = 700;

export function estimateSpeechMs(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.round((words / WORDS_PER_SECOND) * 1000);
}

/** Expected scene length, used for the scrubber and time display before the voice reports real timings. */
export function estimateSceneMs(scene: Scene): number {
  const speech = scene.sentences.reduce((sum, sentence) => sum + estimateSpeechMs(sentence) + SENTENCE_GAP_MS, 0);
  return Math.max(scene.minMs, speech + SCENE_TAIL_MS);
}

export const SCENE_ESTIMATES = SCENES.map(estimateSceneMs);
export const TOTAL_ESTIMATE_MS = SCENE_ESTIMATES.reduce((sum, ms) => sum + ms, 0);
