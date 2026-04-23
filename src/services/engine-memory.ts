// ── Cross-engine self-learning memory ────────────────────────────
// Every AI engine (ELIT, Aggressive, Balanced, Conservative, Adaptive) records
// the digit-frequency bucket present at the moment of each trade together with
// the contract type and outcome. Engines query `shouldSkip()` before firing to
// avoid setups they have repeatedly lost on.
//
// Persisted to localStorage so learning survives reloads. Admin dashboard reads
// `getAll()` to surface a daily learning report.

import type { AIEngine } from "./ai-logger";

const STORAGE_KEY = "dnx_engine_memory_v1";

export interface PatternRecord {
  wins: number;
  losses: number;
  lastSeenTs: number;
  lastWonTs: number;
}

export interface EngineMemoryShape {
  // engine -> patternKey -> record
  [engine: string]: Record<string, PatternRecord>;
}

interface DailyEntry {
  date: string;        // YYYY-MM-DD
  engine: AIEngine;
  pattern: string;
  wins: number;
  losses: number;
}

interface PersistedShape {
  patterns: EngineMemoryShape;
  daily: DailyEntry[];
}

function loadAll(): PersistedShape {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return {
        patterns: p.patterns || {},
        daily: Array.isArray(p.daily) ? p.daily : [],
      };
    }
  } catch {
    // ignore
  }
  return { patterns: {}, daily: [] };
}

function persist(state: PersistedShape) {
  try {
    // Keep last 30 days of daily entries
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    state.daily = state.daily.filter((d) => new Date(d.date).getTime() >= cutoff);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new Event("dnx_engine_memory_updated"));
  } catch {
    // ignore
  }
}

/** Build a stable bucket key from a 10-digit frequency array (percentages). */
export function buildPatternKey(contractType: string, freq: number[]): string {
  const bucket = (p: number) => Math.round(p / 5) * 5;
  const low04 = freq.slice(0, 5).reduce((a, b) => a + b, 0);
  const high59 = freq.slice(5, 10).reduce((a, b) => a + b, 0);
  const top = freq
    .map((v, i) => ({ d: i, v }))
    .sort((a, b) => b.v - a.v)[0].d;
  return `${contractType}|low04=${bucket(low04)}|high59=${bucket(high59)}|top=${top}`;
}

class EngineMemoryStore {
  private state: PersistedShape = loadAll();

  record(engine: AIEngine, pattern: string, won: boolean) {
    if (!this.state.patterns[engine]) this.state.patterns[engine] = {};
    const rec = this.state.patterns[engine][pattern] || {
      wins: 0,
      losses: 0,
      lastSeenTs: 0,
      lastWonTs: 0,
    };
    rec.lastSeenTs = Date.now();
    if (won) {
      rec.wins++;
      rec.lastWonTs = Date.now();
    } else {
      rec.losses++;
    }
    this.state.patterns[engine][pattern] = rec;

    // Daily roll-up for admin viewer
    const today = new Date().toISOString().slice(0, 10);
    let entry = this.state.daily.find(
      (d) => d.date === today && d.engine === engine && d.pattern === pattern
    );
    if (!entry) {
      entry = { date: today, engine, pattern, wins: 0, losses: 0 };
      this.state.daily.push(entry);
    }
    if (won) entry.wins++;
    else entry.losses++;

    persist(this.state);
  }

  /** True if this engine has consistently lost on this pattern (≥5 samples, <35% WR). */
  shouldSkip(engine: AIEngine, pattern: string): boolean {
    const rec = this.state.patterns[engine]?.[pattern];
    if (!rec) return false;
    const total = rec.wins + rec.losses;
    if (total < 5) return false;
    const wr = (rec.wins / total) * 100;
    return wr < 35;
  }

  getEngine(engine: AIEngine): Record<string, PatternRecord> {
    return this.state.patterns[engine] || {};
  }

  getAll(): EngineMemoryShape {
    return this.state.patterns;
  }

  getDaily(): DailyEntry[] {
    return [...this.state.daily].sort((a, b) =>
      a.date < b.date ? 1 : a.date > b.date ? -1 : 0
    );
  }

  reset(engine?: AIEngine) {
    if (engine) {
      delete this.state.patterns[engine];
    } else {
      this.state = { patterns: {}, daily: [] };
    }
    persist(this.state);
  }

  subscribe(cb: () => void) {
    const handler = () => cb();
    window.addEventListener("dnx_engine_memory_updated", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("dnx_engine_memory_updated", handler);
      window.removeEventListener("storage", handler);
    };
  }
}

export const engineMemory = new EngineMemoryStore();
