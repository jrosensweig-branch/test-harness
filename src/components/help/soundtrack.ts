import type { ThemeId } from "@/lib/themes";

/*
 * A tiny step sequencer on the Web Audio API that plays an original four-bar
 * loop per theme. Notes are scheduled slightly ahead of the audio clock (the
 * "two clocks" pattern) so timing stays tight even when the main thread is busy.
 *
 * Patterns are 16-step strings: "x" plays, anything else rests.
 */

type Wave = OscillatorType;

type Preset = {
  bpm: number;
  /** One chord per bar, MIDI note numbers. */
  chords: number[][];
  bassRoots: number[];
  bass: { wave: Wave; pattern: string; octaveJump: boolean; cutoff: number; gain: number; release: number };
  lead: { wave: Wave; pattern: string; octaves: number; cutoff: number; gain: number; release: number; delay: number; detune: number };
  pad: { wave: Wave; gain: number; cutoff: number; detune: number } | null;
  drums: { kick: string; snare: string; hat: string; kickGain: number; snareGain: number; hatGain: number; snareReverb: number };
  reverb: number;
};

const PRESETS: Record<ThemeId, Preset> = {
  // 80s night drive: A minor i–VI–III–VII, pulsing octave bass, delayed saw arpeggio, gated-reverb snare.
  synthwave: {
    bpm: 104,
    chords: [
      [57, 60, 64],
      [53, 57, 60],
      [55, 60, 64],
      [55, 59, 62],
    ],
    bassRoots: [45, 41, 48, 43],
    bass: { wave: "sawtooth", pattern: "x-x-x-x-x-x-x-x-", octaveJump: true, cutoff: 650, gain: 0.2, release: 0.16 },
    lead: { wave: "sawtooth", pattern: "xxxxxxxxxxxxxxxx", octaves: 2, cutoff: 2200, gain: 0.05, release: 0.13, delay: 0.32, detune: 7 },
    pad: { wave: "sawtooth", gain: 0.035, cutoff: 1000, detune: 12 },
    drums: { kick: "x-------x-------", snare: "----x-------x---", hat: "--x---x---x---x-", kickGain: 0.85, snareGain: 0.4, hatGain: 0.1, snareReverb: 0.65 },
    reverb: 0.35,
  },
  // Cartridge-era chiptune: square-wave arps, pulse bass, noise percussion.
  crt: {
    bpm: 132,
    chords: [
      [64, 67, 71],
      [60, 64, 67],
      [62, 66, 69],
      [59, 63, 66],
    ],
    bassRoots: [40, 36, 38, 35],
    bass: { wave: "square", pattern: "x-xxx-x-x-xxx-x-", octaveJump: true, cutoff: 1600, gain: 0.09, release: 0.07 },
    lead: { wave: "square", pattern: "xxxxxxxxxxxxxxxx", octaves: 1, cutoff: 5000, gain: 0.035, release: 0.06, delay: 0, detune: 0 },
    pad: null,
    drums: { kick: "x-----x-x-------", snare: "----x-------x--x", hat: "x-x-x-x-x-x-x-x-", kickGain: 0.7, snareGain: 0.28, hatGain: 0.05, snareReverb: 0 },
    reverb: 0.06,
  },
  // Late-night deep house: warm extended chords, round bass, sparse delayed plucks.
  dark: {
    bpm: 96,
    chords: [
      [50, 53, 57, 64],
      [46, 50, 53, 57],
      [53, 57, 60, 64],
      [48, 52, 55, 62],
    ],
    bassRoots: [38, 34, 41, 36],
    bass: { wave: "triangle", pattern: "x-----x---x-----", octaveJump: false, cutoff: 420, gain: 0.32, release: 0.34 },
    lead: { wave: "triangle", pattern: "x--x--x---x--x--", octaves: 2, cutoff: 3200, gain: 0.08, release: 0.32, delay: 0.42, detune: 0 },
    pad: { wave: "sawtooth", gain: 0.03, cutoff: 760, detune: 10 },
    drums: { kick: "x---x---x---x---", snare: "----x-------x---", hat: "--x---x---x---x-", kickGain: 0.55, snareGain: 0.16, hatGain: 0.06, snareReverb: 0.5 },
    reverb: 0.45,
  },
  // Bright and optimistic: I–V–vi–IV with a marimba-like pluck and a soft shaker.
  light: {
    bpm: 112,
    chords: [
      [60, 64, 67],
      [59, 62, 67],
      [57, 60, 64],
      [57, 60, 65],
    ],
    bassRoots: [36, 43, 45, 41],
    bass: { wave: "sine", pattern: "x---x-x-x---x-x-", octaveJump: false, cutoff: 900, gain: 0.34, release: 0.22 },
    lead: { wave: "triangle", pattern: "x-xx-x-xx-xx-x-x", octaves: 2, cutoff: 4200, gain: 0.09, release: 0.22, delay: 0.18, detune: 0 },
    pad: { wave: "triangle", gain: 0.04, cutoff: 1500, detune: 6 },
    drums: { kick: "x-------x-x-----", snare: "----x-------x---", hat: "xxxxxxxxxxxxxxxx", kickGain: 0.6, snareGain: 0.22, hatGain: 0.03, snareReverb: 0.3 },
    reverb: 0.3,
  },
};

const INTRO_BARS = 2;
const LOOKAHEAD_S = 0.12;
const SCHEDULER_MS = 25;
const VOLUME = 0.55;
const DUCKED = 0.36;

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
const hits = (pattern: string, step: number) => pattern[step] === "x";

type VoiceOptions = {
  wave: Wave;
  midi: number;
  time: number;
  gain: number;
  cutoff: number;
  /** Pluck: decays over `release`. Sustain: holds for `hold`, then releases. */
  hold?: number;
  attack?: number;
  release: number;
  detune?: number;
  reverbSend?: number;
  delaySend?: number;
};

export class Soundtrack {
  private context: AudioContext;
  private master: GainNode;
  private music: GainNode;
  private reverbIn: GainNode;
  private delayIn: GainNode;
  private delay: DelayNode;
  private noise: AudioBuffer;
  private preset: Preset;
  private pending: Preset | null = null;
  private step = 0;
  private bar = 0;
  private nextTime = 0;
  private timer: number | null = null;
  private muted = false;

  constructor(theme: ThemeId) {
    this.context = new AudioContext();
    this.preset = PRESETS[theme];

    const compressor = this.context.createDynamicsCompressor();
    compressor.threshold.value = -16;
    compressor.ratio.value = 4;

    this.master = this.context.createGain();
    this.master.gain.value = 0.0001;
    this.music = this.context.createGain();
    this.music.connect(compressor).connect(this.master).connect(this.context.destination);

    const reverb = this.context.createConvolver();
    reverb.buffer = this.impulse(2.6);
    this.reverbIn = this.context.createGain();
    this.reverbIn.connect(reverb).connect(this.music);

    this.delay = this.context.createDelay(2);
    const feedback = this.context.createGain();
    feedback.gain.value = 0.34;
    const feedbackTone = this.context.createBiquadFilter();
    feedbackTone.type = "lowpass";
    feedbackTone.frequency.value = 2400;
    this.delayIn = this.context.createGain();
    this.delayIn.connect(this.delay);
    this.delay.connect(feedbackTone).connect(feedback).connect(this.delay);
    this.delay.connect(this.music);
    this.syncDelayTime();

    this.noise = this.context.createBuffer(1, this.context.sampleRate, this.context.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let index = 0; index < data.length; index++) data[index] = Math.random() * 2 - 1;
  }

  start() {
    void this.context.resume();
    this.nextTime = this.context.currentTime + 0.08;
    this.timer = window.setInterval(this.schedule, SCHEDULER_MS);
    this.rampMaster(this.muted ? 0.0001 : VOLUME, 1.2);
  }

  /** Swap the loop for another theme's at the next bar line, so the change lands on the beat. */
  setTheme(theme: ThemeId) {
    const next = PRESETS[theme];
    if (next !== this.preset) this.pending = next;
  }

  duck(active: boolean) {
    this.music.gain.setTargetAtTime(active ? DUCKED : 1, this.context.currentTime, 0.25);
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    this.rampMaster(muted ? 0.0001 : VOLUME, 0.15);
  }

  pause() {
    void this.context.suspend();
  }

  resume() {
    void this.context.resume();
  }

  fadeOut(seconds = 2.5) {
    this.rampMaster(0.0001, seconds);
    window.setTimeout(() => this.stopScheduler(), seconds * 1000);
  }

  dispose() {
    this.stopScheduler();
    void this.context.close();
  }

  private rampMaster(target: number, seconds: number) {
    const now = this.context.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(Math.max(this.master.gain.value, 0.0001), now);
    this.master.gain.exponentialRampToValueAtTime(target, now + seconds);
  }

  private stopScheduler() {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
  }

  private syncDelayTime() {
    // Dotted-eighth echo: the signature synth-pop delay.
    this.delay.delayTime.value = (60 / this.preset.bpm) * 0.75;
  }

  private schedule = () => {
    while (this.nextTime < this.context.currentTime + LOOKAHEAD_S) {
      this.playStep(this.step, this.nextTime);
      this.nextTime += 60 / this.preset.bpm / 4;
      this.step = (this.step + 1) % 16;
      if (this.step === 0) {
        this.bar++;
        if (this.pending) {
          this.preset = this.pending;
          this.pending = null;
          this.syncDelayTime();
        }
      }
    }
  };

  private playStep(step: number, time: number) {
    const preset = this.preset;
    const chordIndex = this.bar % preset.chords.length;
    const chord = preset.chords[chordIndex];
    const root = preset.bassRoots[chordIndex];
    const barSeconds = (60 / preset.bpm) * 4;
    const fullBand = this.bar >= INTRO_BARS;

    if (step === 0 && preset.pad) {
      for (const note of chord) {
        for (const detune of [-preset.pad.detune, preset.pad.detune]) {
          this.voice({
            wave: preset.pad.wave,
            midi: note,
            time,
            gain: preset.pad.gain,
            cutoff: preset.pad.cutoff,
            attack: 0.5,
            hold: barSeconds - 0.5,
            release: 0.9,
            detune,
            reverbSend: preset.reverb,
          });
        }
      }
    }

    if (hits(preset.lead.pattern, step)) {
      const tones = Array.from({ length: preset.lead.octaves }, (_, octave) => chord.map((note) => note + 12 + octave * 12)).flat();
      const hitIndex = [...preset.lead.pattern.slice(0, step)].filter((symbol) => symbol === "x").length;
      this.voice({
        wave: preset.lead.wave,
        midi: tones[hitIndex % tones.length],
        time,
        gain: preset.lead.gain,
        cutoff: preset.lead.cutoff,
        release: preset.lead.release,
        detune: preset.lead.detune,
        reverbSend: preset.reverb * 0.6,
        delaySend: preset.lead.delay,
      });
    }

    if (!fullBand) return;

    if (hits(preset.bass.pattern, step)) {
      const hitIndex = [...preset.bass.pattern.slice(0, step)].filter((symbol) => symbol === "x").length;
      this.voice({
        wave: preset.bass.wave,
        midi: preset.bass.octaveJump && hitIndex % 2 === 1 ? root + 12 : root,
        time,
        gain: preset.bass.gain,
        cutoff: preset.bass.cutoff,
        release: preset.bass.release,
      });
    }

    if (hits(preset.drums.kick, step)) this.kick(time, preset.drums.kickGain);
    if (hits(preset.drums.snare, step)) this.snare(time, preset.drums.snareGain, preset.drums.snareReverb);
    if (hits(preset.drums.hat, step)) this.hat(time, preset.drums.hatGain);
  }

  private voice({ wave, midi, time, gain, cutoff, hold, attack = 0.005, release, detune = 0, reverbSend = 0, delaySend = 0 }: VoiceOptions) {
    const oscillator = this.context.createOscillator();
    oscillator.type = wave;
    oscillator.frequency.value = hz(midi);
    oscillator.detune.value = detune;

    const filter = this.context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = cutoff;

    const envelope = this.context.createGain();
    envelope.gain.setValueAtTime(0.0001, time);
    envelope.gain.exponentialRampToValueAtTime(gain, time + attack);
    const releaseStart = time + attack + (hold ?? 0);
    if (hold) envelope.gain.setValueAtTime(gain, releaseStart);
    envelope.gain.exponentialRampToValueAtTime(0.0001, releaseStart + release);

    oscillator.connect(filter).connect(envelope).connect(this.music);
    if (reverbSend) this.send(envelope, this.reverbIn, reverbSend);
    if (delaySend) this.send(envelope, this.delayIn, delaySend);

    oscillator.start(time);
    oscillator.stop(releaseStart + release + 0.05);
  }

  private send(source: AudioNode, destination: AudioNode, amount: number) {
    const level = this.context.createGain();
    level.gain.value = amount;
    source.connect(level).connect(destination);
  }

  private kick(time: number, gain: number) {
    const oscillator = this.context.createOscillator();
    oscillator.frequency.setValueAtTime(150, time);
    oscillator.frequency.exponentialRampToValueAtTime(42, time + 0.13);
    const envelope = this.context.createGain();
    envelope.gain.setValueAtTime(0.0001, time);
    envelope.gain.exponentialRampToValueAtTime(gain, time + 0.004);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + 0.42);
    oscillator.connect(envelope).connect(this.music);
    oscillator.start(time);
    oscillator.stop(time + 0.45);
  }

  private snare(time: number, gain: number, reverbSend: number) {
    const noise = this.context.createBufferSource();
    noise.buffer = this.noise;
    const band = this.context.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 1800;
    band.Q.value = 0.7;
    const envelope = this.context.createGain();
    envelope.gain.setValueAtTime(0.0001, time);
    envelope.gain.exponentialRampToValueAtTime(gain, time + 0.003);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + 0.2);
    noise.connect(band).connect(envelope).connect(this.music);
    if (reverbSend) this.send(envelope, this.reverbIn, reverbSend);
    noise.start(time);
    noise.stop(time + 0.25);

    this.voice({ wave: "triangle", midi: 54, time, gain: gain * 0.5, cutoff: 2000, release: 0.09 });
  }

  private hat(time: number, gain: number) {
    const noise = this.context.createBufferSource();
    noise.buffer = this.noise;
    const high = this.context.createBiquadFilter();
    high.type = "highpass";
    high.frequency.value = 7000;
    const envelope = this.context.createGain();
    envelope.gain.setValueAtTime(0.0001, time);
    envelope.gain.exponentialRampToValueAtTime(gain, time + 0.002);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
    noise.connect(high).connect(envelope).connect(this.music);
    noise.start(time);
    noise.stop(time + 0.08);
  }

  /** Synthetic reverb tail: decaying stereo noise. */
  private impulse(seconds: number) {
    const length = Math.floor(this.context.sampleRate * seconds);
    const buffer = this.context.createBuffer(2, length, this.context.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let index = 0; index < length; index++) {
        data[index] = (Math.random() * 2 - 1) * (1 - index / length) ** 3;
      }
    }
    return buffer;
  }
}
