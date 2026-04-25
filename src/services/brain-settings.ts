export interface BrainThresholds {
  runLength: number;
  parityRunLength: number;
  flipRateMax: number;
  recentWindow: number;
  deepWindow: number;
  tradeScore: number;
  waitScore: number;
  recoveryScore: number;
  strictRecoveryScore: number;
}

export const DEFAULT_BRAIN_THRESHOLDS: BrainThresholds = {
  runLength: 4,
  parityRunLength: 4,
  flipRateMax: 60,
  recentWindow: 20,
  deepWindow: 1000,
  tradeScore: 75,
  waitScore: 65,
  recoveryScore: 70,
  strictRecoveryScore: 80,
};

const KEY = "dnx_brain_thresholds_v1";

export function loadBrainThresholds(): BrainThresholds {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_BRAIN_THRESHOLDS, ...JSON.parse(raw) } : DEFAULT_BRAIN_THRESHOLDS;
  } catch {
    return DEFAULT_BRAIN_THRESHOLDS;
  }
}

export function saveBrainThresholds(next: BrainThresholds) {
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  window.dispatchEvent(new CustomEvent("dnx-brain-thresholds", { detail: next }));
}

export function onBrainThresholdsChange(cb: (value: BrainThresholds) => void) {
  const handler = (event: Event) => cb((event as CustomEvent<BrainThresholds>).detail || loadBrainThresholds());
  window.addEventListener("dnx-brain-thresholds", handler);
  return () => window.removeEventListener("dnx-brain-thresholds", handler);
}