// ── DERIV BRAIN — Strict Adaptive Digit Strategy ──────────────────
// PRIMARY:  UNDER 8 (entry digit 6) / OVER 2 (entry digit 4)
// RECOVERY: UNDER 5 / OVER 4 — pure probability-based (no entry digit)
// SELF-LEARNING: tracks digit-distribution patterns that produced wins
//                and biases future trades toward proven setups.
// ZERO random behavior.

import { aiLogger } from "./ai-logger";

export type BrainStrategy = "UNDER_8" | "OVER_2" | "RECOVERY_UNDER_5" | "RECOVERY_OVER_4";

export interface BrainDecision {
  shouldTrade: boolean;
  contractType: "DIGITUNDER" | "DIGITOVER" | null;
  barrier: string | null;
  strategy: BrainStrategy | null;
  reason: string;
}

interface StrategyStats {
  trades: number;
  wins: number;
  losses: number;
}

// Self-learning pattern memory: bucketed distribution → win/loss
interface PatternMemory {
  // key: e.g. "U8|low0-4>50|high8-9<20"
  [key: string]: { wins: number; losses: number };
}

interface BrainState {
  stats: Record<BrainStrategy, StrategyStats>;
  patterns: PatternMemory;
  recoveryArmed: boolean;
  recoveryFor: BrainStrategy | null;
  lastFiredStrategy: BrainStrategy | null;
  lastFiredPatternKey: string | null;
  lastQuotes: number[];
  lastWaitLogTs: number;
}

const STORAGE_KEY = "dnx_brain_v2";

function makeEmptyStats(): Record<BrainStrategy, StrategyStats> {
  return {
    UNDER_8: { trades: 0, wins: 0, losses: 0 },
    OVER_2: { trades: 0, wins: 0, losses: 0 },
    RECOVERY_UNDER_5: { trades: 0, wins: 0, losses: 0 },
    RECOVERY_OVER_4: { trades: 0, wins: 0, losses: 0 },
  };
}

function loadState(): BrainState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        stats: { ...makeEmptyStats(), ...(parsed.stats || {}) },
        patterns: parsed.patterns || {},
        recoveryArmed: false,
        recoveryFor: null,
        lastFiredStrategy: null,
        lastFiredPatternKey: null,
        lastQuotes: [],
        lastWaitLogTs: 0,
      };
    }
  } catch {}
  return {
    stats: makeEmptyStats(),
    patterns: {},
    recoveryArmed: false,
    recoveryFor: null,
    lastFiredStrategy: null,
    lastFiredPatternKey: null,
    lastQuotes: [],
    lastWaitLogTs: 0,
  };
}

function persist(state: BrainState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ stats: state.stats, patterns: state.patterns }));
  } catch {}
}

class DerivBrain {
  private state: BrainState = loadState();
  private inFlight = false;

  /**
   * Main decision function — call on every tick.
   */
  decide(digits: number[], quote: number): BrainDecision {
    this.state.lastQuotes.push(quote);
    if (this.state.lastQuotes.length > 50) this.state.lastQuotes.shift();

    if (digits.length < 1000) {
      const now = Date.now();
      if (now - this.state.lastWaitLogTs > 5000) {
        aiLogger.log("Brain", "info", `Collecting ticks… ${digits.length}/1000`);
        this.state.lastWaitLogTs = now;
      }
      return wait("Building 1000-tick buffer");
    }

    if (this.inFlight) return wait("Trade in flight");

    const lastDigit = digits[digits.length - 1];
    const deep = digits.slice(-1000);
    const freq = computeFrequency(deep);
    const volSpike = this.detectVolSpike();

    // Aggregate buckets used for both recovery and pattern memory
    const sumLow0_4 = freq[0] + freq[1] + freq[2] + freq[3] + freq[4];
    const sumHigh5_9 = freq[5] + freq[6] + freq[7] + freq[8] + freq[9];
    const sumLow0_4Strict = freq[0] + freq[1] + freq[2] + freq[3]; // for UNDER 5
    const sumHigh5_9Strict = freq[5] + freq[6] + freq[7] + freq[8] + freq[9]; // for OVER 4 (≥5)

    // ── RECOVERY MODE — probability-based, NO entry digit wait ────
    if (this.state.recoveryArmed && this.state.recoveryFor) {
      if (volSpike) return wait("Vol spike — holding recovery");

      if (this.state.recoveryFor === "UNDER_8") {
        // Recover with UNDER 5: digits 0-4 must dominate strongly
        // Random baseline = 50%. Need clear edge (>53%) AND each of 0-4 ≥ 9%.
        const each04Ok = [0, 1, 2, 3, 4].every((d) => freq[d] >= 9.0);
        if (sumLow0_4Strict >= 53 && each04Ok) {
          const key = `RU5|low04=${bucket(sumLow0_4Strict)}|high89=${bucket(freq[8] + freq[9])}`;
          if (this.shouldSkipPattern(key)) return wait(`Pattern ${key} avoided (poor history)`);
          this.fireRecovery("RECOVERY_UNDER_5", key);
          aiLogger.log("Brain", "success",
            `Recovery → UNDER 5 firing (P[<5]=${sumLow0_4Strict.toFixed(1)}%)`);
          return { shouldTrade: true, contractType: "DIGITUNDER", barrier: "5", strategy: "RECOVERY_UNDER_5", reason: "UNDER 5 recovery" };
        }
        return wait(`Recovery armed (UNDER 5) — P[<5]=${sumLow0_4Strict.toFixed(1)}% (need ≥53)`);
      }

      if (this.state.recoveryFor === "OVER_2") {
        // Recover with OVER 4: digits 5-9 must dominate strongly
        const each59Ok = [5, 6, 7, 8, 9].every((d) => freq[d] >= 9.0);
        if (sumHigh5_9Strict >= 53 && each59Ok) {
          const key = `RO4|high59=${bucket(sumHigh5_9Strict)}|low01=${bucket(freq[0] + freq[1])}`;
          if (this.shouldSkipPattern(key)) return wait(`Pattern ${key} avoided (poor history)`);
          this.fireRecovery("RECOVERY_OVER_4", key);
          aiLogger.log("Brain", "success",
            `Recovery → OVER 4 firing (P[>4]=${sumHigh5_9Strict.toFixed(1)}%)`);
          return { shouldTrade: true, contractType: "DIGITOVER", barrier: "4", strategy: "RECOVERY_OVER_4", reason: "OVER 4 recovery" };
        }
        return wait(`Recovery armed (OVER 4) — P[>4]=${sumHigh5_9Strict.toFixed(1)}% (need ≥53)`);
      }
    }

    // ── PRIMARY STRATEGIES ────────────────────────────────────────
    if (volSpike) return wait("Volatility spike — standing down");

    const under8WinRate = this.winRate("UNDER_8");
    const over2WinRate = this.winRate("OVER_2");

    const under8Valid = this.checkUnder8(freq);
    const over2Valid = this.checkOver2(freq);

    // ── UNDER 8 — entry digit 6
    if (under8Valid.valid && lastDigit === 6) {
      const stat = this.state.stats.UNDER_8;
      if (stat.trades > 20 && under8WinRate < 40) {
        aiLogger.log("Brain", "warn", `UNDER 8 deprioritized (${under8WinRate.toFixed(0)}% WR)`);
      } else {
        const key = `U8|high89=${bucket(freq[8] + freq[9])}|low04=${bucket(sumLow0_4)}`;
        if (this.shouldSkipPattern(key)) {
          aiLogger.log("Brain", "warn", `UNDER 8 skipped — pattern ${key} unfavorable`);
        } else {
          this.firePrimary("UNDER_8", key);
          aiLogger.log("Brain", "success",
            `UNDER 8 firing — entry 6 [8:${freq[8].toFixed(1)} 9:${freq[9].toFixed(1)}]`);
          return { shouldTrade: true, contractType: "DIGITUNDER", barrier: "8", strategy: "UNDER_8", reason: "UNDER 8 entry" };
        }
      }
    }

    // ── OVER 2 — entry digit 4
    if (over2Valid.valid && lastDigit === 4) {
      const stat = this.state.stats.OVER_2;
      if (stat.trades > 20 && over2WinRate < 40) {
        aiLogger.log("Brain", "warn", `OVER 2 deprioritized (${over2WinRate.toFixed(0)}% WR)`);
      } else {
        const key = `O2|low01=${bucket(freq[0] + freq[1])}|high59=${bucket(sumHigh5_9)}`;
        if (this.shouldSkipPattern(key)) {
          aiLogger.log("Brain", "warn", `OVER 2 skipped — pattern ${key} unfavorable`);
        } else {
          this.firePrimary("OVER_2", key);
          aiLogger.log("Brain", "success",
            `OVER 2 firing — entry 4 [0:${freq[0].toFixed(1)} 1:${freq[1].toFixed(1)}]`);
          return { shouldTrade: true, contractType: "DIGITOVER", barrier: "2", strategy: "OVER_2", reason: "OVER 2 entry" };
        }
      }
    }

    // No setup — narrate
    if (under8Valid.valid && lastDigit !== 6) return wait(`UNDER 8 ready — waiting entry digit 6 (got ${lastDigit})`);
    if (over2Valid.valid && lastDigit !== 4) return wait(`OVER 2 ready — waiting entry digit 4 (got ${lastDigit})`);
    return wait(`No valid setup [U8:${under8Valid.reason} | O2:${over2Valid.reason}]`);
  }

  /**
   * Called by TradingPanel after a trade settles.
   */
  recordResult(won: boolean, profit: number) {
    this.inFlight = false;
    const strat = this.state.lastFiredStrategy;
    const patternKey = this.state.lastFiredPatternKey;
    if (!strat) return;

    const s = this.state.stats[strat];
    s.trades++;
    if (won) s.wins++; else s.losses++;

    // Self-learning: record pattern outcome
    if (patternKey) {
      const p = this.state.patterns[patternKey] || { wins: 0, losses: 0 };
      if (won) p.wins++; else p.losses++;
      this.state.patterns[patternKey] = p;
    }

    persist(this.state);

    aiLogger.log("Brain", won ? "success" : "warn",
      `${strat} ${won ? "WIN" : "LOSS"} • ${profit >= 0 ? "+" : ""}${profit.toFixed(2)} • WR ${this.winRate(strat).toFixed(0)}%`);

    // Arm recovery only on PRIMARY losses
    if (!won && (strat === "UNDER_8" || strat === "OVER_2")) {
      this.state.recoveryArmed = true;
      this.state.recoveryFor = strat;
      aiLogger.log("Brain", "info",
        `Re-analyzing for recovery (${strat === "UNDER_8" ? "UNDER 5" : "OVER 4"}) — probability based`);
    } else {
      this.state.recoveryArmed = false;
      this.state.recoveryFor = null;
    }
  }

  cancelInFlight() { this.inFlight = false; }

  getStats() {
    return {
      stats: this.state.stats,
      under8WinRate: this.winRate("UNDER_8"),
      over2WinRate: this.winRate("OVER_2"),
      recoveryWinRate: (this.winRate("RECOVERY_UNDER_5") + this.winRate("RECOVERY_OVER_4")) / 2,
      patterns: Object.keys(this.state.patterns).length,
    };
  }

  reset() {
    this.state = {
      stats: makeEmptyStats(),
      patterns: {},
      recoveryArmed: false,
      recoveryFor: null,
      lastFiredStrategy: null,
      lastFiredPatternKey: null,
      lastQuotes: [],
      lastWaitLogTs: 0,
    };
    this.inFlight = false;
    persist(this.state);
    aiLogger.log("Brain", "info", "Brain stats + patterns reset");
  }

  // ── Internals ────────────────────────────────────────────────
  private firePrimary(strat: BrainStrategy, patternKey: string) {
    this.state.lastFiredStrategy = strat;
    this.state.lastFiredPatternKey = patternKey;
    this.inFlight = true;
  }

  private fireRecovery(strat: BrainStrategy, patternKey: string) {
    this.state.recoveryArmed = false;
    this.state.recoveryFor = null;
    this.state.lastFiredStrategy = strat;
    this.state.lastFiredPatternKey = patternKey;
    this.inFlight = true;
  }

  private shouldSkipPattern(key: string): boolean {
    const p = this.state.patterns[key];
    if (!p) return false; // no history — allow
    const total = p.wins + p.losses;
    if (total < 5) return false; // need samples
    const wr = (p.wins / total) * 100;
    return wr < 35; // pattern repeatedly losing — avoid
  }

  private winRate(strat: BrainStrategy): number {
    const s = this.state.stats[strat];
    if (s.trades === 0) return 50;
    return (s.wins / s.trades) * 100;
  }

  private detectVolSpike(): boolean {
    const q = this.state.lastQuotes;
    if (q.length < 20) return false;
    const deltas: number[] = [];
    for (let i = 1; i < q.length; i++) deltas.push(Math.abs(q[i] - q[i - 1]));
    const avg = deltas.reduce((a, b) => a + b, 0) / deltas.length;
    const recent = deltas.slice(-3);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    return recentAvg > avg * 3;
  }

  private checkUnder8(freq: number[]): { valid: boolean; reason: string } {
    if (freq[8] > 10.1 || freq[9] > 10.1) return { valid: false, reason: `8/9 high(${freq[8].toFixed(1)}/${freq[9].toFixed(1)})` };
    const sorted = [...freq].map((v, i) => ({ d: i, v })).sort((a, b) => b.v - a.v);
    if (sorted[0].d === 8 || sorted[0].d === 9) return { valid: false, reason: "8/9 highest" };
    if (sorted[9].d === 8 || sorted[9].d === 9) return { valid: false, reason: "8/9 lowest" };
    return { valid: true, reason: "OK" };
  }

  private checkOver2(freq: number[]): { valid: boolean; reason: string } {
    if (freq[0] > 10.3 || freq[1] > 10.3) return { valid: false, reason: `0/1 high(${freq[0].toFixed(1)}/${freq[1].toFixed(1)})` };
    const cluster012 = freq[0] + freq[1] + freq[2];
    if (cluster012 > 30.3 + 10.1) return { valid: false, reason: `0-2 cluster ${cluster012.toFixed(1)}%` };
    const sorted = [...freq].map((v, i) => ({ d: i, v })).sort((a, b) => a.v - b.v);
    if (sorted[0].d === 0 || sorted[0].d === 1 || sorted[1].d === 0 || sorted[1].d === 1) return { valid: false, reason: "0/1 least frequent" };
    return { valid: true, reason: "OK" };
  }
}

function wait(reason: string): BrainDecision {
  return { shouldTrade: false, contractType: null, barrier: null, strategy: null, reason };
}

function computeFrequency(digits: number[]): number[] {
  const total = digits.length;
  const freq = new Array(10).fill(0);
  digits.forEach((d) => freq[d]++);
  return freq.map((c) => (c / total) * 100);
}

// Bucket a percentage into 5% bins for stable pattern memory keys
function bucket(p: number): string {
  return `${Math.floor(p / 5) * 5}-${Math.floor(p / 5) * 5 + 5}`;
}

export const derivBrain = new DerivBrain();
