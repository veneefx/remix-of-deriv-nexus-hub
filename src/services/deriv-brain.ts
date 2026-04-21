// ── DERIV BRAIN — Strict Adaptive Digit Strategy ──────────────────
// Implements UNDER 8 + OVER 2 with strict entry triggers, controlled
// recovery, and per-strategy self-learning. ZERO random behavior.

import { aiLogger } from "./ai-logger";

export type BrainStrategy = "UNDER_8" | "OVER_2" | "RECOVERY_UNDER_5" | "RECOVERY_OVER_5";

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

interface BrainState {
  // Self-learning per-strategy stats
  stats: Record<BrainStrategy, StrategyStats>;
  // Recovery tracking
  recoveryArmed: boolean;
  recoveryFor: BrainStrategy | null;
  // Last fired strategy (for recovery decision)
  lastFiredStrategy: BrainStrategy | null;
  // Volatility baseline (rolling avg of last 50 tick deltas)
  lastQuotes: number[];
  // Throttle to prevent log spam
  lastWaitLogTs: number;
}

const STORAGE_KEY = "dnx_brain_v1";

function loadState(): BrainState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        stats: parsed.stats || makeEmptyStats(),
        recoveryArmed: false,
        recoveryFor: null,
        lastFiredStrategy: null,
        lastQuotes: [],
        lastWaitLogTs: 0,
      };
    }
  } catch {}
  return {
    stats: makeEmptyStats(),
    recoveryArmed: false,
    recoveryFor: null,
    lastFiredStrategy: null,
    lastQuotes: [],
    lastWaitLogTs: 0,
  };
}

function makeEmptyStats(): Record<BrainStrategy, StrategyStats> {
  return {
    UNDER_8: { trades: 0, wins: 0, losses: 0 },
    OVER_2: { trades: 0, wins: 0, losses: 0 },
    RECOVERY_UNDER_5: { trades: 0, wins: 0, losses: 0 },
    RECOVERY_OVER_5: { trades: 0, wins: 0, losses: 0 },
  };
}

function persist(state: BrainState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ stats: state.stats }));
  } catch {}
}

class DerivBrain {
  private state: BrainState = loadState();
  private inFlight = false; // single-trade guard

  /**
   * Main decision function — call on every tick.
   * Returns shouldTrade=true only when ALL conditions match.
   */
  decide(digits: number[], quote: number): BrainDecision {
    // Track quote for volatility
    this.state.lastQuotes.push(quote);
    if (this.state.lastQuotes.length > 50) this.state.lastQuotes.shift();

    // Need at least 1000 ticks for strict analysis
    if (digits.length < 1000) {
      const now = Date.now();
      if (now - this.state.lastWaitLogTs > 5000) {
        aiLogger.log("Brain", "info", `Collecting ticks… ${digits.length}/1000`);
        this.state.lastWaitLogTs = now;
      }
      return { shouldTrade: false, contractType: null, barrier: null, strategy: null, reason: "Building 1000-tick buffer" };
    }

    if (this.inFlight) {
      return { shouldTrade: false, contractType: null, barrier: null, strategy: null, reason: "Trade in flight" };
    }

    const lastDigit = digits[digits.length - 1];
    const lastDigitsDeep = digits.slice(-1000);
    const freq = computeFrequency(lastDigitsDeep);
    const volSpike = this.detectVolSpike();

    // ── RECOVERY MODE ──────────────────────────────────
    if (this.state.recoveryArmed && this.state.recoveryFor) {
      // Recovery: UNDER 5 (after UNDER 8 loss) or OVER 5 (after OVER 2 loss)
      if (this.state.recoveryFor === "UNDER_8") {
        // Re-validate: distribution still valid AND no vol spike
        if (volSpike) return wait("Volatility spike — holding recovery");
        if (freq[8] > 10.1 || freq[9] > 10.1) {
          this.state.recoveryArmed = false;
          this.state.recoveryFor = null;
          aiLogger.log("Brain", "warn", "Recovery aborted — distribution invalidated");
          return wait("Recovery cancelled");
        }
        // Trigger recovery on entry digit 6
        if (lastDigit === 6) {
          this.state.recoveryArmed = false;
          this.state.recoveryFor = null;
          this.state.lastFiredStrategy = "RECOVERY_UNDER_5";
          this.inFlight = true;
          aiLogger.log("Brain", "success", "Recovery → UNDER 5 firing (entry digit 6)");
          return { shouldTrade: true, contractType: "DIGITUNDER", barrier: "5", strategy: "RECOVERY_UNDER_5", reason: "Recovery UNDER 5" };
        }
        return wait("Recovery armed (UNDER 5) — waiting for digit 6");
      }
      if (this.state.recoveryFor === "OVER_2") {
        if (volSpike) return wait("Volatility spike — holding recovery");
        if (freq[0] > 10.3 || freq[1] > 10.3) {
          this.state.recoveryArmed = false;
          this.state.recoveryFor = null;
          aiLogger.log("Brain", "warn", "Recovery aborted — distribution invalidated");
          return wait("Recovery cancelled");
        }
        if (lastDigit === 4) {
          this.state.recoveryArmed = false;
          this.state.recoveryFor = null;
          this.state.lastFiredStrategy = "RECOVERY_OVER_5";
          this.inFlight = true;
          aiLogger.log("Brain", "success", "Recovery → OVER 5 firing (entry digit 4)");
          return { shouldTrade: true, contractType: "DIGITOVER", barrier: "5", strategy: "RECOVERY_OVER_5", reason: "Recovery OVER 5" };
        }
        return wait("Recovery armed (OVER 5) — waiting for digit 4");
      }
    }

    // ── ADAPTIVE: pick best strategy based on conditions ──────────
    if (volSpike) return wait("Volatility spike — standing down");

    // Self-learning weighting: prefer winning strategies
    const under8WinRate = this.winRate("UNDER_8");
    const over2WinRate = this.winRate("OVER_2");

    const under8Valid = this.checkUnder8(freq);
    const over2Valid = this.checkOver2(freq);

    // ── UNDER 8 STRATEGY ──
    if (under8Valid.valid) {
      if (lastDigit === 6) {
        // Self-learning: skip if win rate < 40% AND we have >20 trades
        const stat = this.state.stats.UNDER_8;
        if (stat.trades > 20 && under8WinRate < 40) {
          aiLogger.log("Brain", "warn", `UNDER 8 deprioritized (${under8WinRate.toFixed(0)}% win rate)`);
        } else {
          this.state.lastFiredStrategy = "UNDER_8";
          this.inFlight = true;
          aiLogger.log("Brain", "success", `UNDER 8 firing — entry digit 6 [8:${freq[8].toFixed(1)}% 9:${freq[9].toFixed(1)}%]`);
          return { shouldTrade: true, contractType: "DIGITUNDER", barrier: "8", strategy: "UNDER_8", reason: "UNDER 8 entry" };
        }
      }
    }

    // ── OVER 2 STRATEGY ──
    if (over2Valid.valid) {
      if (lastDigit === 4) {
        const stat = this.state.stats.OVER_2;
        if (stat.trades > 20 && over2WinRate < 40) {
          aiLogger.log("Brain", "warn", `OVER 2 deprioritized (${over2WinRate.toFixed(0)}% win rate)`);
        } else {
          this.state.lastFiredStrategy = "OVER_2";
          this.inFlight = true;
          aiLogger.log("Brain", "success", `OVER 2 firing — entry digit 4 [0:${freq[0].toFixed(1)}% 1:${freq[1].toFixed(1)}%]`);
          return { shouldTrade: true, contractType: "DIGITOVER", barrier: "2", strategy: "OVER_2", reason: "OVER 2 entry" };
        }
      }
    }

    // No setup matched — describe what we're waiting for
    if (under8Valid.valid && lastDigit !== 6) return wait(`UNDER 8 ready — waiting for entry digit 6 (got ${lastDigit})`);
    if (over2Valid.valid && lastDigit !== 4) return wait(`OVER 2 ready — waiting for entry digit 4 (got ${lastDigit})`);
    return wait(`No valid setup [U8:${under8Valid.reason} | O2:${over2Valid.reason}]`);
  }

  /**
   * Called by TradingPanel after a trade settles.
   * Updates self-learning stats and arms recovery if loss.
   */
  recordResult(won: boolean, profit: number) {
    this.inFlight = false;
    const strat = this.state.lastFiredStrategy;
    if (!strat) return;

    const s = this.state.stats[strat];
    s.trades++;
    if (won) s.wins++; else s.losses++;
    persist(this.state);

    aiLogger.log("Brain", won ? "success" : "warn",
      `${strat} ${won ? "WIN" : "LOSS"} • ${profit >= 0 ? "+" : ""}${profit.toFixed(2)} • WR ${this.winRate(strat).toFixed(0)}%`);

    // Arm recovery on loss for primary strategies only (not on recovery losses)
    if (!won && (strat === "UNDER_8" || strat === "OVER_2")) {
      this.state.recoveryArmed = true;
      this.state.recoveryFor = strat;
      aiLogger.log("Brain", "info", `Re-analyzing before recovery (${strat === "UNDER_8" ? "UNDER 5" : "OVER 5"})`);
    } else {
      this.state.recoveryArmed = false;
      this.state.recoveryFor = null;
    }
  }

  /**
   * Called when TradingPanel fails to fire (e.g. proposal not ready).
   * Releases the in-flight guard so we can try again.
   */
  cancelInFlight() {
    this.inFlight = false;
  }

  getStats() {
    return {
      stats: this.state.stats,
      under8WinRate: this.winRate("UNDER_8"),
      over2WinRate: this.winRate("OVER_2"),
      recoveryWinRate: (this.winRate("RECOVERY_UNDER_5") + this.winRate("RECOVERY_OVER_5")) / 2,
    };
  }

  reset() {
    this.state = {
      stats: makeEmptyStats(),
      recoveryArmed: false,
      recoveryFor: null,
      lastFiredStrategy: null,
      lastQuotes: [],
      lastWaitLogTs: 0,
    };
    this.inFlight = false;
    persist(this.state);
    aiLogger.log("Brain", "info", "Brain stats reset");
  }

  // ── Internal helpers ────────────────────────────────────────────

  private winRate(strat: BrainStrategy): number {
    const s = this.state.stats[strat];
    if (s.trades === 0) return 50; // neutral
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
    // Spike = recent moves > 3x average
    return recentAvg > avg * 3;
  }

  private checkUnder8(freq: number[]): { valid: boolean; reason: string } {
    // 8 and 9 must be ≤ 10.1% each
    if (freq[8] > 10.1 || freq[9] > 10.1) return { valid: false, reason: `8/9 too high (${freq[8].toFixed(1)}/${freq[9].toFixed(1)})` };

    // 8 and 9 must NOT be highest or lowest
    const sorted = [...freq].map((v, i) => ({ d: i, v })).sort((a, b) => b.v - a.v);
    const highest = sorted[0].d;
    const lowest = sorted[9].d;
    if (highest === 8 || highest === 9) return { valid: false, reason: "8/9 is highest" };
    if (lowest === 8 || lowest === 9) return { valid: false, reason: "8/9 is lowest" };

    return { valid: true, reason: "OK" };
  }

  private checkOver2(freq: number[]): { valid: boolean; reason: string } {
    // 0 and 1 must be ≤ 10.3%
    if (freq[0] > 10.3 || freq[1] > 10.3) return { valid: false, reason: `0/1 too high (${freq[0].toFixed(1)}/${freq[1].toFixed(1)})` };

    // 0-2 cluster check (≤ 10.1% bias means combined ≤ ~30.3%)
    const cluster012 = freq[0] + freq[1] + freq[2];
    if (cluster012 > 30.3 + 10.1) return { valid: false, reason: `0-2 cluster ${cluster012.toFixed(1)}%` };

    // 0 and 1 must NOT be least frequent
    const sorted = [...freq].map((v, i) => ({ d: i, v })).sort((a, b) => a.v - b.v);
    const lowest = sorted[0].d;
    const second = sorted[1].d;
    if (lowest === 0 || lowest === 1 || second === 0 || second === 1) return { valid: false, reason: "0/1 is least frequent" };

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

export const derivBrain = new DerivBrain();
