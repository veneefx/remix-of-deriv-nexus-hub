// ── Trade alert sounds (WebAudio — no asset files required) ──────
// Plays a short distinctive jingle for each event so the user can audibly
// distinguish wins, losses, TP/SL and connection alerts even when the phone
// is locked (paired with the Notification API vibration).

type SoundKind = "success" | "error" | "warn" | "info" | "tp" | "sl";

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    if (!ctx) {
      const C = window.AudioContext || (window as any).webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    if (ctx.state === "suspended") {
      // Best-effort resume; browsers require a user gesture for first play
      ctx.resume().catch(() => {});
    }
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, durationMs: number, startOffset = 0, type: OscillatorType = "sine", gain = 0.18) {
  const audio = getCtx();
  if (!audio) return;
  const t = audio.currentTime + startOffset;
  const osc = audio.createOscillator();
  const g = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + durationMs / 1000);
  osc.connect(g);
  g.connect(audio.destination);
  osc.start(t);
  osc.stop(t + durationMs / 1000 + 0.05);
}

function sweep(fromHz: number, toHz: number, durationMs: number, startOffset = 0, type: OscillatorType = "sine", gain = 0.18) {
  const audio = getCtx();
  if (!audio) return;
  const t = audio.currentTime + startOffset;
  const osc = audio.createOscillator();
  const g = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(fromHz, t);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, toHz), t + durationMs / 1000);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + durationMs / 1000);
  osc.connect(g);
  g.connect(audio.destination);
  osc.start(t);
  osc.stop(t + durationMs / 1000 + 0.05);
}

export const sounds = {
  /** Quick success ping (trade win) */
  success() {
    tone(880, 120, 0, "triangle");
    tone(1320, 160, 0.08, "triangle");
  },
  /** Loss tone — soft descending */
  error() {
    sweep(420, 180, 280, 0, "sawtooth", 0.16);
  },
  /** Warning chirp */
  warn() {
    tone(660, 90, 0, "square", 0.14);
    tone(660, 90, 0.18, "square", 0.14);
  },
  /** Info ping */
  info() {
    tone(1040, 100, 0, "sine", 0.12);
  },
  /** Take-Profit fanfare — celebratory */
  tp() {
    tone(660, 110, 0, "triangle", 0.2);
    tone(880, 110, 0.1, "triangle", 0.2);
    tone(1320, 220, 0.22, "triangle", 0.22);
    sweep(1320, 1980, 260, 0.45, "triangle", 0.2);
  },
  /** Stop-Loss alert — descending double tone */
  sl() {
    sweep(700, 240, 300, 0, "sawtooth", 0.2);
    sweep(500, 180, 280, 0.32, "sawtooth", 0.2);
  },
  play(kind: SoundKind) {
    switch (kind) {
      case "success": return this.success();
      case "error":   return this.error();
      case "warn":    return this.warn();
      case "info":    return this.info();
      case "tp":      return this.tp();
      case "sl":      return this.sl();
    }
  },
  /** Prime the AudioContext on first user gesture so later plays work even if backgrounded. */
  prime() { getCtx(); },
};

export type { SoundKind };
