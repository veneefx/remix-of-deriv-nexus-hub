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
    if (ctx.state === "suspended" && navigator.userActivation?.hasBeenActive) {
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
    tone(587, 90, 0, "sine", 0.14);
    tone(880, 120, 0.07, "triangle", 0.16);
    tone(1174, 180, 0.15, "triangle", 0.14);
  },
  /** Loss tone — soft descending */
  error() {
    sweep(520, 210, 240, 0, "triangle", 0.12);
    tone(180, 120, 0.2, "sine", 0.08);
  },
  /** Warning chirp */
  warn() {
    tone(740, 70, 0, "triangle", 0.1);
    tone(554, 110, 0.12, "triangle", 0.1);
  },
  /** Info ping */
  info() {
    tone(698, 90, 0, "sine", 0.09);
    tone(932, 110, 0.05, "sine", 0.07);
  },
  /** Take-Profit fanfare — celebratory */
  tp() {
    tone(523, 110, 0, "triangle", 0.16);
    tone(659, 110, 0.1, "triangle", 0.17);
    tone(784, 140, 0.2, "triangle", 0.18);
    tone(1047, 260, 0.32, "triangle", 0.18);
    sweep(1047, 1568, 260, 0.55, "sine", 0.12);
  },
  /** Stop-Loss alert — descending double tone */
  sl() {
    sweep(640, 320, 220, 0, "triangle", 0.14);
    sweep(420, 160, 240, 0.24, "triangle", 0.14);
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
  prime() {
    const audio = getCtx();
    if (audio && audio.state === "suspended" && navigator.userActivation?.hasBeenActive) {
      audio.resume().catch(() => {});
    }
  },
};

export type { SoundKind };
