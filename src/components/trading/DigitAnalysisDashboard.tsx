import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Flame, TrendingUp, TrendingDown, Minus, Zap, Target,
  ArrowUp, ArrowDown, BarChart3, Activity, Gauge
} from "lucide-react";

interface DigitAnalysisDashboardProps {
  lastDigits: number[];
  tickBuffer: { quote: number; digit: number; epoch: number }[];
  digitPressure: Record<number, number>;
  signalScore: number;
  signalDetails: {
    frequencyScore: number;
    pressureScore: number;
    streakScore: number;
    patternScore: number;
    volatilityScore: number;
  };
}

const DigitAnalysisDashboard = ({
  lastDigits,
  tickBuffer,
  digitPressure,
  signalScore,
  signalDetails,
}: DigitAnalysisDashboardProps) => {
  // ── Frequency Heatmap (50, 100, 300 windows) ──
  const heatmapData = useMemo(() => {
    const windows = [50, 100, 300] as const;
    return windows.map((w) => {
      const slice = lastDigits.slice(-w);
      const freq = new Array(10).fill(0);
      slice.forEach((d) => freq[d]++);
      return {
        window: w,
        counts: freq,
        total: slice.length,
        pcts: freq.map((c) => (slice.length > 0 ? (c / slice.length) * 100 : 0)),
      };
    });
  }, [lastDigits]);

  // ── Momentum Tracker ──
  const momentum = useMemo(() => {
    if (lastDigits.length < 60) return new Array(10).fill(0);
    const recent = lastDigits.slice(-30);
    const older = lastDigits.slice(-60, -30);
    return Array.from({ length: 10 }, (_, d) => {
      const rCount = recent.filter((x) => x === d).length;
      const oCount = older.filter((x) => x === d).length;
      return rCount - oCount; // positive = rising, negative = falling
    });
  }, [lastDigits]);

  // ── Streak Detection ──
  const streaks = useMemo(() => {
    if (lastDigits.length < 3) return [];
    const found: { digit: number; length: number; position: number }[] = [];
    let i = lastDigits.length - 1;
    while (i >= 2) {
      let len = 1;
      while (i - len >= 0 && lastDigits[i - len] === lastDigits[i]) len++;
      if (len >= 3) {
        found.push({ digit: lastDigits[i], length: len, position: i });
      }
      i -= len;
    }
    return found.slice(0, 5); // last 5 streaks
  }, [lastDigits]);

  // ── Even/Odd Pressure ──
  const evenOdd = useMemo(() => {
    const recent = lastDigits.slice(-100);
    if (recent.length === 0) return { even: 50, odd: 50 };
    const evenCount = recent.filter((d) => d % 2 === 0).length;
    return {
      even: (evenCount / recent.length) * 100,
      odd: ((recent.length - evenCount) / recent.length) * 100,
    };
  }, [lastDigits]);

  // ── High/Low Pressure ──
  const highLow = useMemo(() => {
    const recent = lastDigits.slice(-100);
    if (recent.length === 0) return { high: 50, low: 50 };
    const highCount = recent.filter((d) => d >= 5).length;
    return {
      high: (highCount / recent.length) * 100,
      low: ((recent.length - highCount) / recent.length) * 100,
    };
  }, [lastDigits]);

  // ── Confluence Score ──
  const confluence = useMemo(() => {
    const score = Math.round(signalScore * 100);
    let strength: "Weak" | "Moderate" | "Strong" | "Very Strong" = "Weak";
    if (score >= 70) strength = "Very Strong";
    else if (score >= 50) strength = "Strong";
    else if (score >= 30) strength = "Moderate";
    return { score, strength };
  }, [signalScore]);

  // ── Volatility Monitor ──
  const volatility = useMemo(() => {
    const recent = tickBuffer.slice(-30);
    if (recent.length < 5) return { level: "Low" as const, ticksPerSec: 0, fluctuation: 0 };
    // Estimate ticks per second
    const epochs = recent.filter((t) => t.epoch > 0);
    let tps = 0;
    if (epochs.length >= 2) {
      const span = epochs[epochs.length - 1].epoch - epochs[0].epoch;
      tps = span > 0 ? epochs.length / span : 0;
    }
    // Price fluctuation
    let totalMove = 0;
    for (let i = 1; i < recent.length; i++) {
      totalMove += Math.abs(recent[i].quote - recent[i - 1].quote);
    }
    const avgFluc = totalMove / (recent.length - 1);
    const level = avgFluc > 0.5 ? "High" : avgFluc > 0.15 ? "Medium" : "Low";
    return { level: level as "Low" | "Medium" | "High", ticksPerSec: tps, fluctuation: avgFluc };
  }, [tickBuffer]);

  // ── Probability Table ──
  const probability = useMemo(() => {
    const recent = lastDigits.slice(-200);
    if (recent.length === 0) return Array.from({ length: 10 }, (_, i) => ({ digit: i, pct: 10 }));
    const freq = new Array(10).fill(0);
    recent.forEach((d) => freq[d]++);
    return Array.from({ length: 10 }, (_, i) => ({
      digit: i,
      pct: (freq[i] / recent.length) * 100,
    }));
  }, [lastDigits]);

  // ── Suggested Trade ──
  const suggestion = useMemo(() => {
    if (lastDigits.length < 50) return null;
    const { even, odd } = evenOdd;
    const oddBias = odd > even;
    const confidence = Math.abs(odd - even);
    // Check momentum
    const risingOdd = [1, 3, 5, 7, 9].reduce((s, d) => s + Math.max(0, momentum[d]), 0);
    const risingEven = [0, 2, 4, 6, 8].reduce((s, d) => s + Math.max(0, momentum[d]), 0);
    const reasons: string[] = [];
    let bias = oddBias ? "ODD" : "EVEN";
    let conf = Math.min(Math.round(50 + confidence + confluence.score * 0.3), 95);

    if (Math.abs(odd - even) > 8) reasons.push("Digit imbalance detected");
    if (oddBias && risingOdd > risingEven) reasons.push("Odd momentum rising");
    if (!oddBias && risingEven > risingOdd) reasons.push("Even momentum rising");
    if (confluence.score > 50) reasons.push("High confluence score");
    if (volatility.level === "High") reasons.push("Volatility spike");

    // Check highest pressure digit
    let maxP = 0, maxD = 0;
    for (let d = 0; d <= 9; d++) {
      if ((digitPressure[d] || 0) > maxP) { maxP = digitPressure[d]; maxD = d; }
    }
    if (maxP > 15) reasons.push(`Digit ${maxD} overdue (${maxP} ticks)`);

    return { bias, confidence: conf, reasons };
  }, [lastDigits, evenOdd, momentum, confluence, volatility, digitPressure]);

  if (lastDigits.length < 30) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <Activity className="w-8 h-8 mx-auto mb-2 animate-pulse" />
        <p className="text-sm">Collecting tick data... ({lastDigits.length}/30 ticks)</p>
      </div>
    );
  }

  const heatColor = (pct: number) => {
    if (pct >= 14) return "bg-buy/30 text-buy border-buy/40";
    if (pct >= 11) return "bg-warning/20 text-warning border-warning/30";
    if (pct <= 6) return "bg-sell/30 text-sell border-sell/40";
    return "bg-secondary text-foreground border-border";
  };

  return (
    <div className="space-y-3 p-4 overflow-y-auto">
      {/* ── Row 1: Frequency Heatmap ── */}
      <div className="p-4 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Digit Frequency Heatmap</h3>
        </div>
        <div className="space-y-2">
          {heatmapData.map((row) => (
            <div key={row.window}>
              <p className="text-[9px] text-muted-foreground mb-1">Last {row.total} ticks</p>
              <div className="grid grid-cols-10 gap-1">
                {row.pcts.map((pct, d) => (
                  <div
                    key={d}
                    className={`text-center p-1.5 rounded-lg border text-[10px] font-bold ${heatColor(pct)}`}
                  >
                    <div>{d}</div>
                    <div className="text-[8px] font-mono opacity-80">{pct.toFixed(0)}%</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-4 mt-2 text-[8px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-buy" /> High</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning" /> Medium</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sell" /> Rare</span>
        </div>
      </div>

      {/* ── Row 2: Momentum + Streak ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Momentum Tracker */}
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Digit Momentum</h3>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {momentum.map((m, d) => (
              <div key={d} className="text-center p-1.5 rounded-lg border border-border">
                <p className="text-sm font-bold text-foreground">{d}</p>
                <div className="flex items-center justify-center gap-0.5 mt-0.5">
                  {m > 0 ? (
                    <ArrowUp className="w-3 h-3 text-buy" />
                  ) : m < 0 ? (
                    <ArrowDown className="w-3 h-3 text-sell" />
                  ) : (
                    <Minus className="w-3 h-3 text-muted-foreground" />
                  )}
                  <span
                    className={`text-[9px] font-bold ${
                      m > 0 ? "text-buy" : m < 0 ? "text-sell" : "text-muted-foreground"
                    }`}
                  >
                    {m > 0 ? `+${m}` : m}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Streak Detector */}
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-warning" />
            <h3 className="text-sm font-semibold text-foreground">Streak Detector</h3>
          </div>
          {streaks.length > 0 ? (
            <div className="space-y-1.5">
              {streaks.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-2 p-2 rounded-lg bg-warning/10 border border-warning/20"
                >
                  <Zap className="w-3 h-3 text-warning" />
                  <span className="text-xs font-medium text-foreground">
                    Digit {s.digit} × {s.length}
                  </span>
                  <span className="text-[9px] text-muted-foreground ml-auto">streak</span>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">No streaks (3+) detected</p>
          )}
        </div>
      </div>

      {/* ── Row 3: Pressure Meters ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Even/Odd Pressure */}
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Gauge className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Even / Odd Pressure</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-foreground font-medium">Even ({evenOdd.even.toFixed(0)}%)</span>
              <span className="text-foreground font-medium">Odd ({evenOdd.odd.toFixed(0)}%)</span>
            </div>
            <div className="h-4 rounded-full bg-secondary overflow-hidden flex">
              <motion.div
                className="bg-primary/60 h-full"
                animate={{ width: `${evenOdd.even}%` }}
                transition={{ duration: 0.5 }}
              />
              <motion.div
                className="bg-buy/60 h-full"
                animate={{ width: `${evenOdd.odd}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-[9px] text-center text-muted-foreground">
              {Math.abs(evenOdd.even - evenOdd.odd) > 10
                ? `⚡ ${evenOdd.even > evenOdd.odd ? "Even" : "Odd"} bias detected`
                : "Balanced distribution"}
            </p>
          </div>
        </div>

        {/* High/Low Pressure */}
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Gauge className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">High / Low Digits</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-foreground font-medium">Low 0-4 ({highLow.low.toFixed(0)}%)</span>
              <span className="text-foreground font-medium">High 5-9 ({highLow.high.toFixed(0)}%)</span>
            </div>
            <div className="h-4 rounded-full bg-secondary overflow-hidden flex">
              <motion.div
                className="bg-sell/50 h-full"
                animate={{ width: `${highLow.low}%` }}
                transition={{ duration: 0.5 }}
              />
              <motion.div
                className="bg-buy/50 h-full"
                animate={{ width: `${highLow.high}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-[9px] text-center text-muted-foreground">
              {Math.abs(highLow.high - highLow.low) > 10
                ? `⚡ ${highLow.high > highLow.low ? "High" : "Low"} digit bias detected`
                : "Balanced distribution"}
            </p>
          </div>
        </div>
      </div>

      {/* ── Row 4: Confluence + Volatility ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Confluence Score */}
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Confluence Score</h3>
          </div>
          <div className="text-center mb-3">
            <motion.p
              key={confluence.score}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className={`text-3xl font-bold ${
                confluence.score >= 70
                  ? "text-buy"
                  : confluence.score >= 50
                  ? "text-warning"
                  : "text-muted-foreground"
              }`}
            >
              {confluence.score}%
            </motion.p>
            <p
              className={`text-xs font-medium ${
                confluence.strength === "Very Strong"
                  ? "text-buy"
                  : confluence.strength === "Strong"
                  ? "text-warning"
                  : "text-muted-foreground"
              }`}
            >
              {confluence.strength}
            </p>
          </div>
          <div className="space-y-1">
            {[
              { label: "Frequency", value: signalDetails.frequencyScore, weight: "25%" },
              { label: "Pressure", value: signalDetails.pressureScore, weight: "30%" },
              { label: "Streak", value: signalDetails.streakScore, weight: "15%" },
              { label: "Pattern", value: signalDetails.patternScore, weight: "15%" },
              { label: "Volatility", value: signalDetails.volatilityScore, weight: "15%" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-2">
                <span className="text-[9px] text-muted-foreground w-16">{s.label}</span>
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary/60 rounded-full"
                    animate={{ width: `${s.value * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <span className="text-[8px] text-muted-foreground w-6">{s.weight}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Volatility Monitor */}
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Volatility Monitor</h3>
          </div>
          <div className="text-center mb-4">
            <motion.div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${
                volatility.level === "High"
                  ? "bg-sell/15 text-sell"
                  : volatility.level === "Medium"
                  ? "bg-warning/15 text-warning"
                  : "bg-buy/15 text-buy"
              }`}
            >
              <Activity className="w-4 h-4" />
              {volatility.level} Volatility
            </motion.div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Ticks/sec</span>
              <span className="font-mono text-foreground">{volatility.ticksPerSec.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Avg Fluctuation</span>
              <span className="font-mono text-foreground">{volatility.fluctuation.toFixed(4)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 5: Probability Table + Suggested Trade ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Probability Table */}
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Digit Probability</h3>
          </div>
          <div className="space-y-1">
            {probability
              .sort((a, b) => b.pct - a.pct)
              .map((p) => {
                const isOver = p.pct > 12;
                const isUnder = p.pct < 8;
                return (
                  <div key={p.digit} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-foreground w-4">{p.digit}</span>
                    <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${
                          isOver ? "bg-buy/60" : isUnder ? "bg-sell/50" : "bg-primary/40"
                        }`}
                        animate={{ width: `${Math.min(p.pct * 5, 100)}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <span
                      className={`text-[9px] font-mono w-8 text-right ${
                        isOver ? "text-buy font-bold" : isUnder ? "text-sell font-bold" : "text-muted-foreground"
                      }`}
                    >
                      {p.pct.toFixed(0)}%
                    </span>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Suggested Trade */}
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-buy" />
            <h3 className="text-sm font-semibold text-foreground">Suggested Bias</h3>
          </div>
          {suggestion ? (
            <div className="text-center space-y-3">
              <motion.div
                key={suggestion.bias}
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className={`inline-block px-6 py-3 rounded-xl text-lg font-bold ${
                  suggestion.bias === "ODD"
                    ? "bg-buy/15 text-buy border border-buy/30"
                    : "bg-primary/15 text-primary border border-primary/30"
                }`}
              >
                {suggestion.bias}
              </motion.div>
              <div>
                <p className="text-xs text-muted-foreground">Confidence</p>
                <p
                  className={`text-xl font-bold ${
                    suggestion.confidence >= 70 ? "text-buy" : suggestion.confidence >= 50 ? "text-warning" : "text-muted-foreground"
                  }`}
                >
                  {suggestion.confidence}%
                </p>
              </div>
              {suggestion.reasons.length > 0 && (
                <div className="space-y-1 text-left">
                  {suggestion.reasons.map((r, i) => (
                    <p key={i} className="text-[9px] text-muted-foreground flex items-center gap-1">
                      <span className="text-buy">•</span> {r}
                    </p>
                  ))}
                </div>
              )}
              <p className="text-[8px] text-muted-foreground italic">
                This is a suggestion only — not financial advice
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">
              Need 50+ ticks for suggestion
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DigitAnalysisDashboard;
