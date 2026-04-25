// ── DERIV BRAIN — Advanced Recovery Engine ────────────────────────
// PRIMARY:  UNDER 8 (entry digit 6) / OVER 2 (entry digit 4)
// RECOVERY: User-selectable
//   • "digit"   → UNDER 5 (after UNDER 8 loss) / OVER 5 (after OVER 2 loss)
//   • "evenodd" → DIGITEVEN / DIGITODD when bias > 52% in last 100-500 ticks
// SAFETY:    Readiness score ≥ 70 (≥ 80 after 2 losses), max 3 attempts, cooldown 30 ticks
// SELF-LEARNING: bucketed pattern memory + cross-engine memory feed
// ZERO random behavior.

import { aiLogger } from "./ai-logger";
import { decisionFeed } from "./decision-feed";
import { DEFAULT_BRAIN_THRESHOLDS, loadBrainThresholds, onBrainThresholdsChange, type BrainThresholds } from "./brain-settings";

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

export interface RecoveryDebugSnapshot {
  armed: boolean;
  mode: RecoveryMode;
  target: BrainStrategy | null;
  attempts: number;
  cooldownUntilTick: number;
  lastReason: string;
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
  private thresholds: BrainThresholds = typeof window !== "undefined" ? loadBrainThresholds() : DEFAULT_BRAIN_THRESHOLDS;
  private lastRecoveryReason = "";

  constructor() {
    if (typeof window !== "undefined") onBrainThresholdsChange((next) => { this.thresholds = next; });
  }

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

    if (digits.length < this.thresholds.deepWindow) {
      const now = Date.now();
      if (now - this.state.lastWaitLogTs > 5000) {
        aiLogger.log("Brain", "info", `Collecting ticks… ${digits.length}/${this.thresholds.deepWindow}`);
        this.state.lastWaitLogTs = now;
      }
      return this.waitDecision("Building deep tick buffer", 0);
    }

    if (this.inFlight) return this.waitDecision("Trade in flight", 0);

    // Cooldown after 3 failed recovery attempts
    if (this.state.tickCount < this.state.cooldownUntilTick) {
      const remaining = this.state.cooldownUntilTick - this.state.tickCount;
      return this.waitDecision(`Recovery cooldown — ${remaining} ticks remaining`, 0);
    }

    const lastDigit = digits[digits.length - 1];
    const deep = digits.slice(-this.thresholds.deepWindow);
    const freq = computeFrequency(deep);
    const volSpike = this.detectVolSpike();
    const sumLow0_4 = freq[0] + freq[1] + freq[2] + freq[3] + freq[4];
    const sumHigh5_9 = freq[5] + freq[6] + freq[7] + freq[8] + freq[9];

    // ── SEQUENCE-PATTERN ANALYSIS (last 30/100 ticks) ─────────────
    // The Brain reads what's actually happening, not just thresholds.
    const seq = this.analyzeSequence(digits);

    // ── RECOVERY MODE ─────────────────────────────────────────────
    if (this.state.recoveryArmed && this.state.recoveryFor) {
      if (volSpike) return wait("Vol spike — holding recovery");

      // Stricter threshold after 2+ consecutive recovery losses
      const minScore = this.state.recoveryAttempts >= 2 ? this.thresholds.strictRecoveryScore : this.thresholds.recoveryScore;

      if (this.state.recoveryMode === "evenodd") {
        return this.tryEvenOddRecovery(digits, freq, minScore, seq);
      }
      return this.tryDigitRecovery(freq, sumLow0_4, sumHigh5_9, minScore, seq);
    }

    // ── PRIMARY STRATEGIES ────────────────────────────────────────
    if (volSpike) return this.waitDecision("Volatility spike — standing down", 35);

    const under8WinRate = this.winRate("UNDER_8");
    const over2WinRate = this.winRate("OVER_2");
    const under8Valid = this.checkUnder8(freq);
    const over2Valid = this.checkOver2(freq);

    // Pattern-driven entry: read last sequence, fire when pattern aligns even
    // if the user-defined entry digit hasn't appeared yet. Brain chooses for itself.
    const confluence = this.computeDecisionScore(freq, seq, under8Valid.valid, over2Valid.valid);
    const lowRunDriven = seq.lowRun >= this.thresholds.runLength || seq.below5InLast20 >= Math.ceil(this.thresholds.recentWindow * 0.7);
    const highRunDriven = seq.highRun >= this.thresholds.runLength || seq.above4InLast20 >= Math.ceil(this.thresholds.recentWindow * 0.7);

    if (confluence.total < this.thresholds.waitScore) {
      return this.waitDecision(`Score ${confluence.total}% → BLOCK trade (low confluence)`, confluence.total, confluence.parts);
    }

    if (under8Valid.valid) {
      const stat = this.state.stats.UNDER_8;
      if (!(stat.trades > 20 && under8WinRate < 40)) {
        const entryByDigit = lastDigit === 6;
        const entryByPattern = lowRunDriven && seq.last8and9Frac < 0.15;
        if (entryByDigit || entryByPattern) {
          const key = `U8|high89=${bucket(freq[8] + freq[9])}|low04=${bucket(sumLow0_4)}|seq=${seq.lowRun >= 4 ? "lowRun" : "freq"}`;
          if (!this.shouldSkipPattern(key) && confluence.total >= this.thresholds.tradeScore) {
            this.firePrimary("UNDER_8", key);
            const trigger = entryByPattern && !entryByDigit
              ? `pattern-fire (lowRun ${seq.lowRun}, <5 in last20: ${seq.below5InLast20})`
              : `entry digit 6`;
            aiLogger.log("Brain", "success", `Score: ${confluence.total}% → Trade Executed • UNDER 8 — ${trigger}`);
            decisionFeed.push({ engine: "Brain", action: "trade", score: confluence.total, contractType: "DIGITUNDER", barrier: "8", reason: `UNDER 8 fired: ${trigger}`, breakdown: confluence.parts });
            return { shouldTrade: true, contractType: "DIGITUNDER", barrier: "8", strategy: "UNDER_8", reason: "UNDER 8 entry" };
          }
        }
      }
    }

    if (over2Valid.valid) {
      const stat = this.state.stats.OVER_2;
      if (!(stat.trades > 20 && over2WinRate < 40)) {
        const entryByDigit = lastDigit === 4;
        const entryByPattern = highRunDriven && seq.last0and1Frac < 0.15;
        if (entryByDigit || entryByPattern) {
          const key = `O2|low01=${bucket(freq[0] + freq[1])}|high59=${bucket(sumHigh5_9)}|seq=${seq.highRun >= 4 ? "highRun" : "freq"}`;
          if (!this.shouldSkipPattern(key) && confluence.total >= this.thresholds.tradeScore) {
            this.firePrimary("OVER_2", key);
            const trigger = entryByPattern && !entryByDigit
              ? `pattern-fire (highRun ${seq.highRun}, >4 in last20: ${seq.above4InLast20})`
              : `entry digit 4`;
            aiLogger.log("Brain", "success", `Score: ${confluence.total}% → Trade Executed • OVER 2 — ${trigger}`);
            decisionFeed.push({ engine: "Brain", action: "trade", score: confluence.total, contractType: "DIGITOVER", barrier: "2", reason: `OVER 2 fired: ${trigger}`, breakdown: confluence.parts });
            return { shouldTrade: true, contractType: "DIGITOVER", barrier: "2", strategy: "OVER_2", reason: "OVER 2 entry" };
          }
        }
      }
    }

    if (confluence.total < this.thresholds.tradeScore) return this.waitDecision(`Score ${confluence.total}% → WAIT (needs ${this.thresholds.tradeScore}%)`, confluence.total, confluence.parts);
    if (under8Valid.valid && lastDigit !== 6 && !lowRunDriven) return this.waitDecision(`UNDER 8 ready — entry digit 6 or low-run (got ${lastDigit}, lowRun=${seq.lowRun})`, confluence.total, confluence.parts);
    if (over2Valid.valid && lastDigit !== 4 && !highRunDriven) return this.waitDecision(`OVER 2 ready — entry digit 4 or high-run (got ${lastDigit}, highRun=${seq.highRun})`, confluence.total, confluence.parts);
    return this.waitDecision(`Market condition: RANDOM → No Trade [U8:${under8Valid.reason} | O2:${over2Valid.reason}]`, confluence.total, confluence.parts);
  }

  // ── SEQUENCE PATTERN READER ────────────────────────────────────
  private analyzeSequence(digits: number[]) {
    const last20 = digits.slice(-this.thresholds.recentWindow);
    const last30 = digits.slice(-Math.max(30, this.thresholds.recentWindow));

    const evenRun = trailingRun(last30, (d) => d % 2 === 0);
    const oddRun  = trailingRun(last30, (d) => d % 2 !== 0);
    const lowRun  = trailingRun(last30, (d) => d < 5);
    const highRun = trailingRun(last30, (d) => d > 4);

    const below5InLast20 = last20.filter((d) => d < 5).length;
    const above4InLast20 = last20.filter((d) => d > 4).length;
    const last8and9Frac  = last20.filter((d) => d >= 8).length / Math.max(1, last20.length);
    const last0and1Frac  = last20.filter((d) => d <= 1).length / Math.max(1, last20.length);

    // Flip rate (alternation density) — high = chaos
    let flips = 0;
    for (let i = 1; i < last30.length; i++) if ((last30[i] % 2) !== (last30[i - 1] % 2)) flips++;
    const flipRate = (flips / Math.max(1, last30.length - 1)) * 100;

    return { evenRun, oddRun, lowRun, highRun, below5InLast20, above4InLast20, last8and9Frac, last0and1Frac, flipRate };
  }

  private computeDecisionScore(freq: number[], seq: ReturnType<DerivBrain["analyzeSequence"]>, under8Ok: boolean, over2Ok: boolean) {
    const freqScore = Math.round((under8Ok || over2Ok ? 20 : 0) + (Math.max(...freq.map((p) => Math.abs(p - 10))) >= 2 ? 5 : 0));
    const flowScore = Math.min(20, (seq.lowRun >= this.thresholds.runLength || seq.highRun >= this.thresholds.runLength ? 14 : 0) + (seq.flipRate <= this.thresholds.flipRateMax ? 6 : 0));
    const patternScore = Math.min(15, (seq.below5InLast20 >= Math.ceil(this.thresholds.recentWindow * 0.65) || seq.above4InLast20 >= Math.ceil(this.thresholds.recentWindow * 0.65) ? 15 : 7));
    const momentumScore = Math.min(15, Math.round(Math.max(seq.below5InLast20, seq.above4InLast20) / Math.max(1, this.thresholds.recentWindow) * 15));
    const parityScore = Math.min(10, seq.evenRun >= this.thresholds.parityRunLength || seq.oddRun >= this.thresholds.parityRunLength ? 10 : 5);
    const volatilityScore = this.detectVolSpike() ? 0 : 10;
    const memoryScore = this.state.lastFiredPatternKey && this.shouldSkipPattern(this.state.lastFiredPatternKey) ? 0 : 10;
    const parts = {
      "Digit Frequency": Math.min(freqScore, 20),
      "Digit Flow": flowScore,
      "Pattern Radar": patternScore,
      "Probability Momentum": momentumScore,
      "Odd/Even Bias": parityScore,
      "Volatility": volatilityScore,
      "Outcome Memory": memoryScore,
    };
    return { total: Math.min(100, Object.values(parts).reduce((a, b) => a + b, 0)), parts };
  }

  private waitDecision(reason: string, score = 0, breakdown?: Record<string, number | string>): BrainDecision {
    const action = score >= this.thresholds.waitScore ? "wait" : "block";
    decisionFeed.push({ engine: "Brain", action, score, reason, breakdown });
    return wait(reason);
  }

  // ── DIGIT RECOVERY ──────────────────────────────────────────────
  private tryDigitRecovery(
    freq: number[], sumLow0_4: number, sumHigh5_9: number, minScore: number,
    seq: ReturnType<DerivBrain["analyzeSequence"]>
  ): BrainDecision {
    const sumLow0_4Strict = freq[0] + freq[1] + freq[2] + freq[3]; // for UNDER 5
    const sumHigh5_9Strict = freq[5] + freq[6] + freq[7] + freq[8] + freq[9]; // for OVER 5 (>5 means 6-9)

    if (this.state.recoveryFor === "UNDER_8") {
      // RECOVERY = UNDER 5 — fire on probability OR clear sequence pattern
      const score = this.computeReadinessScore(freq, "DIGITUNDER", 5);
      const each04Ok = [0, 1, 2, 3, 4].every((d) => freq[d] >= 9.0);
      const digit5NotExtreme = freq[5] < 14 && freq[5] > 7;
      const sequenceFire = seq.lowRun >= 4 && seq.below5InLast20 >= 13 && seq.flipRate < 65;

      aiLogger.log("Brain", "info",
        `Recovery UNDER 5 — score ${score}/100 • P[<5]=${sumLow0_4Strict.toFixed(1)}% • lowRun=${seq.lowRun} • need ${minScore}+`);

      const probOk = score >= minScore && sumLow0_4Strict >= 53 && each04Ok && digit5NotExtreme;
      if (probOk || sequenceFire) {
        const key = `RU5|low04=${bucket(sumLow0_4Strict)}|d5=${bucket(freq[5])}|seq=${sequenceFire ? "lowRun" : "prob"}`;
        if (this.shouldSkipPattern(key)) return wait(`Pattern ${key} avoided (poor history)`);
        this.fireRecovery("RECOVERY_UNDER_5", key);
        this.lastRecoveryReason = `${sequenceFire ? `Matched low-run ${seq.lowRun}` : `Score ${score}%`} • martingale recovery attempt ${this.state.recoveryAttempts + 1}`;
        decisionFeed.push({ engine: "Brain", action: "recovery", score, contractType: "DIGITUNDER", barrier: "5", reason: this.lastRecoveryReason, breakdown: { lowRun: seq.lowRun, flipRate: Math.round(seq.flipRate), minScore } });
        aiLogger.log("Brain", "success",
          `${sequenceFire && !probOk ? `Sequence-fire (lowRun ${seq.lowRun})` : `Confidence ${score}%`} → Executing UNDER 5`);
        return { shouldTrade: true, contractType: "DIGITUNDER", barrier: "5", strategy: "RECOVERY_UNDER_5", reason: "UNDER 5 recovery", confidence: score };
      }
      return wait(`Recovery (UNDER 5) — score ${score}, P[<5]=${sumLow0_4Strict.toFixed(1)}%, lowRun=${seq.lowRun}`);
    }

    if (this.state.recoveryFor === "OVER_2") {
      // RECOVERY = OVER 5 (digits 6-9)
      const sumHigh6_9 = freq[6] + freq[7] + freq[8] + freq[9];
      const score = this.computeReadinessScore(freq, "DIGITOVER", 5);
      const each69Ok = [6, 7, 8, 9].every((d) => freq[d] >= 9.0);
      const digit5NotExtreme = freq[5] < 14 && freq[5] > 7;
      const sequenceFire = seq.highRun >= 4 && seq.above4InLast20 >= 13 && seq.flipRate < 65;

      aiLogger.log("Brain", "info",
        `Recovery OVER 5 — score ${score}/100 • P[>5]=${sumHigh6_9.toFixed(1)}% • highRun=${seq.highRun} • need ${minScore}+`);

      const probOk = score >= minScore && sumHigh6_9 >= 45 && each69Ok && digit5NotExtreme;
      if (probOk || sequenceFire) {
        const key = `RO5|high69=${bucket(sumHigh6_9)}|d5=${bucket(freq[5])}|seq=${sequenceFire ? "highRun" : "prob"}`;
        if (this.shouldSkipPattern(key)) return wait(`Pattern ${key} avoided (poor history)`);
        this.fireRecovery("RECOVERY_OVER_5", key);
        this.lastRecoveryReason = `${sequenceFire ? `Matched high-run ${seq.highRun}` : `Score ${score}%`} • martingale recovery attempt ${this.state.recoveryAttempts + 1}`;
        decisionFeed.push({ engine: "Brain", action: "recovery", score, contractType: "DIGITOVER", barrier: "5", reason: this.lastRecoveryReason, breakdown: { highRun: seq.highRun, flipRate: Math.round(seq.flipRate), minScore } });
        aiLogger.log("Brain", "success",
          `${sequenceFire && !probOk ? `Sequence-fire (highRun ${seq.highRun})` : `Confidence ${score}%`} → Executing OVER 5`);
        return { shouldTrade: true, contractType: "DIGITOVER", barrier: "5", strategy: "RECOVERY_OVER_5", reason: "OVER 5 recovery", confidence: score };
      }
      return wait(`Recovery (OVER 5) — score ${score}, P[>5]=${sumHigh6_9.toFixed(1)}%, highRun=${seq.highRun}`);
    }

    return wait("Recovery armed but no target");
  }

  // ── EVEN / ODD RECOVERY ─────────────────────────────────────────
  private tryEvenOddRecovery(
    digits: number[], freq: number[], minScore: number,
    seq: ReturnType<DerivBrain["analyzeSequence"]>
  ): BrainDecision {
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

    // Pattern-driven fire even if probability not met yet
    const evenSeqFire = seq.evenRun >= 4 && seq.flipRate < 55;
    const oddSeqFire  = seq.oddRun  >= 4 && seq.flipRate < 55;

    if (!stable && !evenSeqFire && !oddSeqFire) return wait(`E/O recovery — flipping (${flipRate.toFixed(0)}%) — wait`);
    if (score < minScore && !evenSeqFire && !oddSeqFire) return wait(`E/O recovery — low score ${score}`);

    if (evenPct >= 52 || evenSeqFire) {
      const key = `REven|even=${bucket(evenPct)}|flips=${bucket(flipRate)}|seq=${evenSeqFire ? "evenRun" : "prob"}`;
      if (this.shouldSkipPattern(key)) return wait(`Pattern ${key} avoided`);
      this.fireRecovery("RECOVERY_EVEN", key);
      this.lastRecoveryReason = `${evenSeqFire ? `Matched even-run ${seq.evenRun}` : `Even bias ${evenPct.toFixed(1)}%`} • martingale recovery attempt ${this.state.recoveryAttempts + 1}`;
      decisionFeed.push({ engine: "Brain", action: "recovery", score, contractType: "DIGITEVEN", reason: this.lastRecoveryReason, breakdown: { evenPct: evenPct.toFixed(1), flipRate: Math.round(flipRate), minScore } });
      aiLogger.log("Brain", "success",
        `${evenSeqFire ? `Even-run ${seq.evenRun}` : `Confidence ${score}%`} → Executing EVEN`);
      return { shouldTrade: true, contractType: "DIGITEVEN", barrier: null, strategy: "RECOVERY_EVEN", reason: "EVEN bias", confidence: score };
    }
    if (oddPct >= 52 || oddSeqFire) {
      const key = `ROdd|odd=${bucket(oddPct)}|flips=${bucket(flipRate)}|seq=${oddSeqFire ? "oddRun" : "prob"}`;
      if (this.shouldSkipPattern(key)) return wait(`Pattern ${key} avoided`);
      this.fireRecovery("RECOVERY_ODD", key);
      this.lastRecoveryReason = `${oddSeqFire ? `Matched odd-run ${seq.oddRun}` : `Odd bias ${oddPct.toFixed(1)}%`} • martingale recovery attempt ${this.state.recoveryAttempts + 1}`;
      decisionFeed.push({ engine: "Brain", action: "recovery", score, contractType: "DIGITODD", reason: this.lastRecoveryReason, breakdown: { oddPct: oddPct.toFixed(1), flipRate: Math.round(flipRate), minScore } });
      aiLogger.log("Brain", "success",
        `${oddSeqFire ? `Odd-run ${seq.oddRun}` : `Confidence ${score}%`} → Executing ODD`);
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
      this.lastRecoveryReason = `Re-armed after ${strat} loss → target ${target}; waiting for confluence/readiness`;
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

  getRecoveryDebug(): RecoveryDebugSnapshot {
    return {
      armed: this.state.recoveryArmed,
      mode: this.state.recoveryMode,
      target: this.state.recoveryFor,
      attempts: this.state.recoveryAttempts,
      cooldownUntilTick: this.state.cooldownUntilTick,
      lastReason: this.lastRecoveryReason,
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

/** Count how many trailing elements (from end) match `pred` consecutively. */
function trailingRun<T>(arr: T[], pred: (v: T) => boolean): number {
  let n = 0;
  for (let i = arr.length - 1; i >= 0; i--) {
    if (pred(arr[i])) n++;
    else break;
  }
  return n;
}

export const derivBrain = new DerivBrain();
