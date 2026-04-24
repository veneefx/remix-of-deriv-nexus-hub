// ── DERIV BRAIN — Advanced Recovery Engine ────────────────────────
// PRIMARY:  UNDER 8 (entry digit 6) / OVER 2 (entry digit 4)
// RECOVERY: User-selectable
//   • "digit"   → UNDER 5 (after UNDER 8 loss) / OVER 5 (after OVER 2 loss)
//   • "evenodd" → DIGITEVEN / DIGITODD when bias > 52% in last 100-500 ticks
// SAFETY:    Readiness score ≥ 70 (≥ 80 after 2 losses), max 3 attempts, cooldown 30 ticks
// SELF-LEARNING: bucketed pattern memory + cross-engine memory feed
// ZERO random behavior.

import { aiLogger } from "./ai-logger";

export type BrainStrategy =
  | "UNDER_8"
  | "OVER_2"
  | "RECOVERY_UNDER_5"
  | "RECOVERY_OVER_5"
  | "RECOVERY_EVEN"
  | "RECOVERY_ODD";

export type RecoveryMode = "digit" | "evenodd";

export interface BrainDecision {
  shouldTrade: boolean;
  contractType: "DIGITUNDER" | "DIGITOVER" | "DIGITEVEN" | "DIGITODD" | null;
  barrier: string | null;
  strategy: BrainStrategy | null;
  reason: string;
  confidence?: number;
}

interface StrategyStats {
  trades: number;
  wins: number;
  losses: number;
}

interface PatternMemory {
  [key: string]: { wins: number; losses: number };
}

interface BrainState {
  stats: Record<BrainStrategy, StrategyStats>;
  patterns: PatternMemory;
  recoveryArmed: boolean;
  recoveryFor: BrainStrategy | null;
  recoveryAttempts: number;       // 0..3
  cooldownUntilTick: number;      // tickCount threshold
  tickCount: number;
  lastFiredStrategy: BrainStrategy | null;
  lastFiredPatternKey: string | null;
  lastQuotes: number[];
  lastWaitLogTs: number;
  recoveryMode: RecoveryMode;
}

const STORAGE_KEY = "dnx_brain_v3";

function makeEmptyStats(): Record<BrainStrategy, StrategyStats> {
  return {
    UNDER_8: { trades: 0, wins: 0, losses: 0 },
    OVER_2: { trades: 0, wins: 0, losses: 0 },
    RECOVERY_UNDER_5: { trades: 0, wins: 0, losses: 0 },
    RECOVERY_OVER_5: { trades: 0, wins: 0, losses: 0 },
    RECOVERY_EVEN: { trades: 0, wins: 0, losses: 0 },
    RECOVERY_ODD: { trades: 0, wins: 0, losses: 0 },
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
        recoveryAttempts: 0,
        cooldownUntilTick: 0,
        tickCount: 0,
        lastFiredStrategy: null,
        lastFiredPatternKey: null,
        lastQuotes: [],
        lastWaitLogTs: 0,
        recoveryMode: (parsed.recoveryMode as RecoveryMode) || "digit",
      };
    }
  } catch {}
  return {
    stats: makeEmptyStats(),
    patterns: {},
    recoveryArmed: false,
    recoveryFor: null,
    recoveryAttempts: 0,
    cooldownUntilTick: 0,
    tickCount: 0,
    lastFiredStrategy: null,
    lastFiredPatternKey: null,
    lastQuotes: [],
    lastWaitLogTs: 0,
    recoveryMode: "digit",
  };
}

function persist(state: BrainState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      stats: state.stats,
      patterns: state.patterns,
      recoveryMode: state.recoveryMode,
    }));
  } catch {}
}

class DerivBrain {
  private state: BrainState = loadState();
  private inFlight = false;

  /** Switch recovery strategy (Digit vs Even/Odd). */
  setRecoveryMode(mode: RecoveryMode) {
    if (this.state.recoveryMode === mode) return;
    this.state.recoveryMode = mode;
    persist(this.state);
    aiLogger.log("Brain", "info", `Recovery mode → ${mode === "digit" ? "Digit Recovery" : "Even/Odd Recovery"}`);
  }

  getRecoveryMode(): RecoveryMode {
    return this.state.recoveryMode;
  }

  decide(digits: number[], quote: number): BrainDecision {
    this.state.tickCount++;
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

    // Cooldown after 3 failed recovery attempts
    if (this.state.tickCount < this.state.cooldownUntilTick) {
      const remaining = this.state.cooldownUntilTick - this.state.tickCount;
      return wait(`Recovery cooldown — ${remaining} ticks remaining`);
    }

    const lastDigit = digits[digits.length - 1];
    const deep = digits.slice(-1000);
    const freq = computeFrequency(deep);
    const volSpike = this.detectVolSpike();
    const sumLow0_4 = freq[0] + freq[1] + freq[2] + freq[3] + freq[4];
    const sumHigh5_9 = freq[5] + freq[6] + freq[7] + freq[8] + freq[9];

    // ── RECOVERY MODE ─────────────────────────────────────────────
    if (this.state.recoveryArmed && this.state.recoveryFor) {
      if (volSpike) return wait("Vol spike — holding recovery");

      // Stricter threshold after 2+ consecutive recovery losses
      const minScore = this.state.recoveryAttempts >= 2 ? 80 : 70;

      if (this.state.recoveryMode === "evenodd") {
        return this.tryEvenOddRecovery(digits, freq, minScore);
      }
      return this.tryDigitRecovery(freq, sumLow0_4, sumHigh5_9, minScore);
    }

    // ── PRIMARY STRATEGIES ────────────────────────────────────────
    if (volSpike) return wait("Volatility spike — standing down");

    const under8WinRate = this.winRate("UNDER_8");
    const over2WinRate = this.winRate("OVER_2");
    const under8Valid = this.checkUnder8(freq);
    const over2Valid = this.checkOver2(freq);

    if (under8Valid.valid && lastDigit === 6) {
      const stat = this.state.stats.UNDER_8;
      if (!(stat.trades > 20 && under8WinRate < 40)) {
        const key = `U8|high89=${bucket(freq[8] + freq[9])}|low04=${bucket(sumLow0_4)}`;
        if (!this.shouldSkipPattern(key)) {
          this.firePrimary("UNDER_8", key);
          aiLogger.log("Brain", "success",
            `UNDER 8 firing — entry 6 [8:${freq[8].toFixed(1)} 9:${freq[9].toFixed(1)}]`);
          return { shouldTrade: true, contractType: "DIGITUNDER", barrier: "8", strategy: "UNDER_8", reason: "UNDER 8 entry" };
        }
      }
    }

    if (over2Valid.valid && lastDigit === 4) {
      const stat = this.state.stats.OVER_2;
      if (!(stat.trades > 20 && over2WinRate < 40)) {
        const key = `O2|low01=${bucket(freq[0] + freq[1])}|high59=${bucket(sumHigh5_9)}`;
        if (!this.shouldSkipPattern(key)) {
          this.firePrimary("OVER_2", key);
          aiLogger.log("Brain", "success",
            `OVER 2 firing — entry 4 [0:${freq[0].toFixed(1)} 1:${freq[1].toFixed(1)}]`);
          return { shouldTrade: true, contractType: "DIGITOVER", barrier: "2", strategy: "OVER_2", reason: "OVER 2 entry" };
        }
      }
    }

    if (under8Valid.valid && lastDigit !== 6) return wait(`UNDER 8 ready — waiting entry digit 6 (got ${lastDigit})`);
    if (over2Valid.valid && lastDigit !== 4) return wait(`OVER 2 ready — waiting entry digit 4 (got ${lastDigit})`);
    return wait(`No valid setup [U8:${under8Valid.reason} | O2:${over2Valid.reason}]`);
  }

  // ── DIGIT RECOVERY ──────────────────────────────────────────────
  private tryDigitRecovery(freq: number[], sumLow0_4: number, sumHigh5_9: number, minScore: number): BrainDecision {
    const sumLow0_4Strict = freq[0] + freq[1] + freq[2] + freq[3]; // for UNDER 5
    const sumHigh5_9Strict = freq[5] + freq[6] + freq[7] + freq[8] + freq[9]; // for OVER 5 (>5 means 6-9)

    if (this.state.recoveryFor === "UNDER_8") {
      // RECOVERY = UNDER 5
      const score = this.computeReadinessScore(freq, "DIGITUNDER", 5);
      const each04Ok = [0, 1, 2, 3, 4].every((d) => freq[d] >= 9.0);
      const digit5NotExtreme = freq[5] < 14 && freq[5] > 7;

      aiLogger.log("Brain", "info",
        `Recovery UNDER 5 — score ${score}/100 • P[<5]=${sumLow0_4Strict.toFixed(1)}% • need ${minScore}+`);

      if (score >= minScore && sumLow0_4Strict >= 53 && each04Ok && digit5NotExtreme) {
        const key = `RU5|low04=${bucket(sumLow0_4Strict)}|d5=${bucket(freq[5])}`;
        if (this.shouldSkipPattern(key)) return wait(`Pattern ${key} avoided (poor history)`);
        this.fireRecovery("RECOVERY_UNDER_5", key);
        aiLogger.log("Brain", "success", `Confidence ${score}% → Executing UNDER 5`);
        return { shouldTrade: true, contractType: "DIGITUNDER", barrier: "5", strategy: "RECOVERY_UNDER_5", reason: "UNDER 5 recovery", confidence: score };
      }
      return wait(`Recovery (UNDER 5) — score ${score}, P[<5]=${sumLow0_4Strict.toFixed(1)}%`);
    }

    if (this.state.recoveryFor === "OVER_2") {
      // RECOVERY = OVER 5 (digits 6-9)
      const sumHigh6_9 = freq[6] + freq[7] + freq[8] + freq[9];
      const score = this.computeReadinessScore(freq, "DIGITOVER", 5);
      const each69Ok = [6, 7, 8, 9].every((d) => freq[d] >= 9.0);
      const digit5NotExtreme = freq[5] < 14 && freq[5] > 7;

      aiLogger.log("Brain", "info",
        `Recovery OVER 5 — score ${score}/100 • P[>5]=${sumHigh6_9.toFixed(1)}% • need ${minScore}+`);

      if (score >= minScore && sumHigh6_9 >= 45 && each69Ok && digit5NotExtreme) {
        const key = `RO5|high69=${bucket(sumHigh6_9)}|d5=${bucket(freq[5])}`;
        if (this.shouldSkipPattern(key)) return wait(`Pattern ${key} avoided (poor history)`);
        this.fireRecovery("RECOVERY_OVER_5", key);
        aiLogger.log("Brain", "success", `Confidence ${score}% → Executing OVER 5`);
        return { shouldTrade: true, contractType: "DIGITOVER", barrier: "5", strategy: "RECOVERY_OVER_5", reason: "OVER 5 recovery", confidence: score };
      }
      return wait(`Recovery (OVER 5) — score ${score}, P[>5]=${sumHigh6_9.toFixed(1)}%`);
    }

    return wait("Recovery armed but no target");
  }

  // ── EVEN / ODD RECOVERY ─────────────────────────────────────────
  private tryEvenOddRecovery(digits: number[], freq: number[], minScore: number): BrainDecision {
    // Use last 100-500 ticks
    const window = digits.slice(-500);
    let evenCount = 0;
    window.forEach((d) => { if (d % 2 === 0) evenCount++; });
    const evenPct = (evenCount / window.length) * 100;
    const oddPct = 100 - evenPct;

    // Recent 30-tick reversal detection — avoid flipping zones
    const recent30 = window.slice(-30);
    let flips = 0;
    for (let i = 1; i < recent30.length; i++) {
      if ((recent30[i] % 2) !== (recent30[i - 1] % 2)) flips++;
    }
    const flipRate = (flips / recent30.length) * 100;
    const stable = flipRate < 60; // <60% flip rate = stable sequence

    const score = this.computeReadinessScore(freq, "DIGITEVEN", 0);

    aiLogger.log("Brain", "info",
      `Recovery E/O — Even ${evenPct.toFixed(1)}% • Odd ${oddPct.toFixed(1)}% • flips ${flipRate.toFixed(0)}% • score ${score}`);

    if (!stable) return wait(`E/O recovery — flipping (${flipRate.toFixed(0)}%) — wait`);
    if (score < minScore) return wait(`E/O recovery — low score ${score}`);

    if (evenPct >= 52) {
      const key = `REven|even=${bucket(evenPct)}|flips=${bucket(flipRate)}`;
      if (this.shouldSkipPattern(key)) return wait(`Pattern ${key} avoided`);
      this.fireRecovery("RECOVERY_EVEN", key);
      aiLogger.log("Brain", "success", `Confidence ${score}% → Executing EVEN`);
      return { shouldTrade: true, contractType: "DIGITEVEN", barrier: null, strategy: "RECOVERY_EVEN", reason: "EVEN bias", confidence: score };
    }
    if (oddPct >= 52) {
      const key = `ROdd|odd=${bucket(oddPct)}|flips=${bucket(flipRate)}`;
      if (this.shouldSkipPattern(key)) return wait(`Pattern ${key} avoided`);
      this.fireRecovery("RECOVERY_ODD", key);
      aiLogger.log("Brain", "success", `Confidence ${score}% → Executing ODD`);
      return { shouldTrade: true, contractType: "DIGITODD", barrier: null, strategy: "RECOVERY_ODD", reason: "ODD bias", confidence: score };
    }

    return wait(`E/O recovery — 50/50 zone (E ${evenPct.toFixed(0)}/O ${oddPct.toFixed(0)})`);
  }

  // ── READINESS SCORE (0-100) ─────────────────────────────────────
  // Combines: distribution balance, no dominance, no chaos, low volatility
  private computeReadinessScore(freq: number[], _ct: string, _barrier: number): number {
    let score = 100;

    // A. No digit dominating > 18%
    const maxDigit = Math.max(...freq);
    if (maxDigit > 18) score -= 30;
    else if (maxDigit > 15) score -= 15;

    // B. Avoid if 2+ digits > 12%
    const above12 = freq.filter((p) => p > 12).length;
    if (above12 >= 3) score -= 20;
    else if (above12 === 2) score -= 10;

    // C. Tick-flow rhythm via quote stability (already covers volatility filter)
    const q = this.state.lastQuotes;
    if (q.length >= 20) {
      const deltas: number[] = [];
      for (let i = 1; i < q.length; i++) deltas.push(Math.abs(q[i] - q[i - 1]));
      const avg = deltas.reduce((a, b) => a + b, 0) / deltas.length;
      const recent = deltas.slice(-3);
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      if (recentAvg > avg * 2) score -= 25;
      else if (recentAvg > avg * 1.5) score -= 10;
    }

    // D. Distribution balance — std-dev around 10%
    const variance = freq.reduce((acc, p) => acc + Math.pow(p - 10, 2), 0) / 10;
    const std = Math.sqrt(variance);
    if (std > 4) score -= 15;
    else if (std > 3) score -= 5;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  recordResult(won: boolean, profit: number) {
    this.inFlight = false;
    const strat = this.state.lastFiredStrategy;
    const patternKey = this.state.lastFiredPatternKey;
    if (!strat) return;

    const s = this.state.stats[strat];
    s.trades++;
    if (won) s.wins++; else s.losses++;

    if (patternKey) {
      const p = this.state.patterns[patternKey] || { wins: 0, losses: 0 };
      if (won) p.wins++; else p.losses++;
      this.state.patterns[patternKey] = p;
    }

    persist(this.state);

    aiLogger.log("Brain", won ? "success" : "warn",
      `${strat} ${won ? "WIN" : "LOSS"} • ${profit >= 0 ? "+" : ""}${profit.toFixed(2)} • WR ${this.winRate(strat).toFixed(0)}%`);

    const isPrimary = strat === "UNDER_8" || strat === "OVER_2";
    const isRecovery = !isPrimary;

    if (won) {
      // Reset everything on any win
      if (isRecovery) aiLogger.log("Brain", "success", "Recovery success → returning to base");
      this.state.recoveryArmed = false;
      this.state.recoveryFor = null;
      this.state.recoveryAttempts = 0;
      return;
    }

    // LOSS handling
    if (isPrimary) {
      // Arm recovery for the primary that just lost
      this.state.recoveryArmed = true;
      this.state.recoveryFor = strat;
      this.state.recoveryAttempts = 0;
      const target =
        this.state.recoveryMode === "evenodd" ? "EVEN/ODD" :
        strat === "UNDER_8" ? "UNDER 5" : "OVER 5";
      aiLogger.log("Brain", "info", `Recovery triggered: ${target} — running readiness check`);
    } else {
      // Recovery loss
      this.state.recoveryAttempts++;
      if (this.state.recoveryAttempts >= 3) {
        aiLogger.log("Brain", "error", "3 recovery losses → cooldown 30 ticks");
        this.state.recoveryArmed = false;
        this.state.recoveryFor = null;
        this.state.recoveryAttempts = 0;
        this.state.cooldownUntilTick = this.state.tickCount + 30;
      } else {
        aiLogger.log("Brain", "warn",
          `Recovery loss ${this.state.recoveryAttempts}/3 — strictness raised`);
      }
    }
  }

  cancelInFlight() { this.inFlight = false; }

  getStats() {
    return {
      stats: this.state.stats,
      under8WinRate: this.winRate("UNDER_8"),
      over2WinRate: this.winRate("OVER_2"),
      patterns: Object.keys(this.state.patterns).length,
      recoveryMode: this.state.recoveryMode,
      recoveryArmed: this.state.recoveryArmed,
      recoveryAttempts: this.state.recoveryAttempts,
    };
  }

  reset() {
    const mode = this.state.recoveryMode;
    this.state = {
      stats: makeEmptyStats(),
      patterns: {},
      recoveryArmed: false,
      recoveryFor: null,
      recoveryAttempts: 0,
      cooldownUntilTick: 0,
      tickCount: 0,
      lastFiredStrategy: null,
      lastFiredPatternKey: null,
      lastQuotes: [],
      lastWaitLogTs: 0,
      recoveryMode: mode,
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
    if (!p) return false;
    const total = p.wins + p.losses;
    if (total < 5) return false;
    const wr = (p.wins / total) * 100;
    return wr < 35;
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

function bucket(p: number): string {
  return `${Math.floor(p / 5) * 5}-${Math.floor(p / 5) * 5 + 5}`;
}

export const derivBrain = new DerivBrain();
