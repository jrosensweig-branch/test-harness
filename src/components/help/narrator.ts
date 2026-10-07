import { estimateSpeechMs } from "./script";

/**
 * Best-sounding voices first: Siri-grade Premium/Enhanced system voices (macOS, downloadable),
 * Edge's neural "Natural" voices, then Chrome's network Google voice. The compact system
 * voices (Samantha, Daniel) are the robotic last resort.
 */
const PREFERRED_VOICES = [
  /\(premium\)/i,
  /\(enhanced\)/i,
  /natural/i,
  /google us english/i,
  /google uk english female/i,
  /^samantha/i,
  /^daniel/i,
];

function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const english = voices.filter((voice) => voice.lang.toLowerCase().startsWith("en"));
  for (const pattern of PREFERRED_VOICES) {
    const match = english.find((voice) => pattern.test(voice.name));
    if (match) return match;
  }
  return english.find((voice) => voice.lang === "en-US") ?? english[0] ?? null;
}

type SpeakHandlers = { onEnd: () => void };

/**
 * Thin wrapper over the Web Speech API. Every speak() bumps a generation
 * counter so callbacks from cancelled utterances (browsers fire `end`/`error`
 * on cancel) are ignored. When speech is unavailable or muted, it "speaks"
 * silently on a timer so captions and pacing still work.
 */
export class Narrator {
  private generation = 0;
  private voice: SpeechSynthesisVoice | null = null;
  private timers: number[] = [];
  readonly supported: boolean;
  muted = false;

  constructor() {
    this.supported = typeof window !== "undefined" && "speechSynthesis" in window;
    if (this.supported) {
      this.voice = pickVoice(window.speechSynthesis.getVoices());
      window.speechSynthesis.addEventListener("voiceschanged", this.onVoicesChanged);
    }
  }

  private onVoicesChanged = () => {
    this.voice = pickVoice(window.speechSynthesis.getVoices());
  };

  speak(text: string, { onEnd }: SpeakHandlers) {
    this.stop();
    const generation = this.generation;
    let finished = false;
    const finish = () => {
      if (finished || generation !== this.generation) return;
      finished = true;
      this.clearTimers();
      onEnd();
    };

    const estimate = estimateSpeechMs(text);

    if (!this.supported || this.muted) {
      this.timers.push(window.setTimeout(finish, estimate));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    if (this.voice) utterance.voice = this.voice;
    utterance.lang = this.voice?.lang ?? "en-US";
    utterance.rate = 1.03;
    utterance.pitch = 1;
    utterance.onend = finish;
    utterance.onerror = finish;
    // Watchdog: some engines occasionally never fire `end`; don't let the video stall.
    this.timers.push(window.setTimeout(finish, estimate * 1.8 + 2500));
    window.speechSynthesis.speak(utterance);
  }

  stop() {
    this.generation++;
    this.clearTimers();
    // Chrome can drop a speak() issued right after an unnecessary cancel(), so only cancel when busy.
    if (this.supported && (window.speechSynthesis.speaking || window.speechSynthesis.pending)) {
      window.speechSynthesis.cancel();
    }
  }

  dispose() {
    this.stop();
    if (this.supported) window.speechSynthesis.removeEventListener("voiceschanged", this.onVoicesChanged);
  }

  private clearTimers() {
    this.timers.forEach((timer) => window.clearTimeout(timer));
    this.timers = [];
  }
}
