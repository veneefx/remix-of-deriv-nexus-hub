import { useMemo } from "react";
import { motion } from "framer-motion";
import { Activity, Gauge, BarChart3, Scan, RefreshCw, Target, TrendingUp, TrendingDown, Minus, Radar } from "lucide-react";
import AIOptimizer from "./AIOptimizer";
import InstitutionTools from "./InstitutionTools";

interface SessionStats {
  totalTrades: number;
  wins: number;
  losses: number;
  totalProfit: number;
  peakBalance: number;
  maxDrawdown: number;
  startBalance: number;
}

interface TickData {
  quote: number;
  digit: number;
  epoch: number;
}

interface SignalDetails {
  frequencyScore: number;
  pressureScore: number;
  streakScore: number;
  patternScore: number;
  volatilityScore: number;
}

interface AnalysisTabProps {
  lastDigits: number[];
  session: SessionStats;
  marketLabel: string;
  tickBuffer: TickData[];
  signalScore?: number;
  signalDetails?: SignalDetails;
  digitPressure?: { [digit: number]: number };
}

// ── Module 1: Volatility Scanner ──────────────────────────────────
const VolatilityScanner = ({ tickBuffer }: { tickBuffer: TickData[] }) => {
  const { level, value, color, label } = useMemo(() => {
    if (tickBuffer.length < 5) return { level: 0, value: 0, color: "text-muted-foreground", label: "Insufficient Data" };
    const recent = tickBuffer.slice(-100);
    let sum = 0;
    for (let i = 1; i < recent.length; i++) sum += Math.abs(recent[i].quote - recent[i - 1].quote);
    const avg = recent.length > 1 ? sum / (recent.length - 1) : 0;
    const v = Math.min(avg * 1000, 100);
    if (v >= 75) return { level: v, value: avg, color: "text-sell", label: "Extreme Volatility" };
    if (v >= 50) return { level: v, value: avg, color: "text-warning", label: "High Volatility" };
    if (v >= 25) return { level: v, value: avg, color: "text-primary", label: "Moderate Volatility" };
    return { level: v, value: avg, color: "text-buy", label: "Low Volatility" };
  }, [tickBuffer]);

  const barColor = level >= 75 ? "bg-sell" : level >= 50 ? "bg-warning" : level >= 25 ? "bg-primary" : "bg-buy";

  return (
    <div className="p-4 rounded-xl bg-card border border-border h-full">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Volatility Scanner</h3>
      </div>
      <div className="h-3 bg-secondary rounded-full overflow-hidden mb-2">
        <motion.div className={`h-full rounded-full ${barColor}`} animate={{ width: `${level}%` }} transition={{ duration: 0.4 }} />
      </div>
      <p className={`text-xs font-semibold ${color}`}>{label}</p>
      <p className="text-[10px] text-muted-foreground mt-1">Avg movement: {value.toFixed(6)}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">
        {level >= 50 ? "Short-term trading opportunities increasing." : "Market is calm — lower risk conditions."}
      </p>
    </div>
  );
};

// ── Module 2: Tick Speed Monitor ──────────────────────────────────
const TickSpeedMonitor = ({ tickBuffer }: { tickBuffer: TickData[] }) => {
  const { tps, tps5, tps30, state, stateColor } = useMemo(() => {
    if (tickBuffer.length < 3) return { tps: 0, tps5: 0, tps30: 0, state: "No Data", stateColor: "text-muted-foreground" };
    const now = tickBuffer[tickBuffer.length - 1].epoch;
    const count1 = tickBuffer.filter(t => t.epoch > now - 1).length;
    const count5 = tickBuffer.filter(t => t.epoch > now - 5).length;
    const count30 = tickBuffer.filter(t => t.epoch > now - 30).length;
    const t = count1;
    const t5 = count5 / 5;
    const t30 = count30 / 30;
    let s = "Slow Market", sc = "text-muted-foreground";
    if (t5 >= 3) { s = "Very Fast Market"; sc = "text-sell"; }
    else if (t5 >= 2) { s = "Fast Market"; sc = "text-warning"; }
    else if (t5 >= 1) { s = "Normal Market"; sc = "text-buy"; }
    return { tps: t, tps5: t5, tps30: t30, state: s, stateColor: sc };
  }, [tickBuffer]);

  return (
    <div className="p-4 rounded-xl bg-card border border-border h-full">
      <div className="flex items-center gap-2 mb-3">
        <Gauge className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Tick Speed Monitor</h3>
      </div>
      <div className="text-center mb-2">
        <p className="text-3xl font-bold text-foreground font-mono">{tps5.toFixed(1)}</p>
        <p className="text-[10px] text-muted-foreground">ticks/sec (5s avg)</p>
      </div>
      <p className={`text-xs font-semibold text-center ${stateColor}`}>{state}</p>
      <div className="flex justify-between mt-3 text-[10px] text-muted-foreground">
        <span>1s: {tps}</span>
        <span>5s avg: {tps5.toFixed(1)}</span>
        <span>30s avg: {tps30.toFixed(1)}</span>
      </div>
    </div>
  );
};

// ── Module 3: Digit Pressure Balance ──────────────────────────────
const DigitPressureBalance = ({ lastDigits }: { lastDigits: number[] }) => {
  const { evenPct, oddPct } = useMemo(() => {
    const d = lastDigits.slice(-100);
    if (d.length === 0) return { evenPct: 50, oddPct: 50 };
    const even = d.filter(x => x % 2 === 0).length;
    const total = d.length;
    return { evenPct: (even / total) * 100, oddPct: ((total - even) / total) * 100 };
  }, [lastDigits]);

  const dominant = evenPct > oddPct ? "Even" : oddPct > evenPct ? "Odd" : "Balanced";
  const dominantColor = dominant === "Even" ? "text-buy" : dominant === "Odd" ? "text-sell" : "text-muted-foreground";

  return (
    <div className="p-4 rounded-xl bg-card border border-border h-full">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Digit Pressure Balance</h3>
      </div>
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Even (0,2,4,6,8)</span><span>{evenPct.toFixed(1)}%</span>
          </div>
          <div className="h-4 bg-secondary rounded-full overflow-hidden">
            <motion.div className="h-full bg-buy rounded-full" animate={{ width: `${evenPct}%` }} transition={{ duration: 0.4 }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Odd (1,3,5,7,9)</span><span>{oddPct.toFixed(1)}%</span>
          </div>
          <div className="h-4 bg-secondary rounded-full overflow-hidden">
            <motion.div className="h-full bg-sell rounded-full" animate={{ width: `${oddPct}%` }} transition={{ duration: 0.4 }} />
          </div>
        </div>
      </div>
      <p className={`text-xs font-semibold mt-3 ${dominantColor}`}>{dominant} dominance detected. {dominant} trades currently favored.</p>
    </div>
  );
};

// ── Module 4: Pattern Recognition Engine ──────────────────────────
const PatternRecognitionEngine = ({ lastDigits }: { lastDigits: number[] }) => {
  const patterns = useMemo(() => {
    const d = lastDigits.slice(-200);
    if (d.length < 10) return [];

    const found: { pattern: string; count: number; confidence: number; type: string }[] = [];

    // Detect alternating pairs (e.g. 7-3-7-3)
    for (let len = 2; len <= 4; len++) {
      const seqMap = new Map<string, number>();
      for (let i = 0; i <= d.length - len; i++) {
        const seq = d.slice(i, i + len).join("-");
        seqMap.set(seq, (seqMap.get(seq) || 0) + 1);
      }
      seqMap.forEach((count, seq) => {
        if (count >= 3) {
          found.push({ pattern: seq, count, confidence: Math.min((count / (d.length / len)) * 100, 95), type: len === 2 ? "Pair" : len === 3 ? "Triple" : "Quad" });
        }
      });
    }

    // Detect streaks (same digit repeated)
    let cs = 1;
    for (let i = d.length - 1; i > 0; i--) {
      if (d[i] === d[i - 1]) {
        cs++;
        if (cs >= 3) {
          found.push({ pattern: `${d[i]} × ${cs}`, count: 1, confidence: Math.min(cs * 20, 90), type: "Streak" });
          break;
        }
      } else {
        cs = 1;
      }
    }

    // Detect reversals (e.g. 9→0, 0→9)
    if (d.length >= 2) {
      const last = d[d.length - 1];
      const prev = d[d.length - 2];
      if (Math.abs(last - prev) >= 7) {
        found.push({ pattern: `${prev} → ${last}`, count: 1, confidence: 55, type: "Reversal" });
      }
    }

    return found.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
  }, [lastDigits]);

  return (
    <div className="p-4 rounded-xl bg-card border border-border h-full">
      <div className="flex items-center gap-2 mb-3">
        <Scan className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Pattern Recognition Engine</h3>
      </div>
      {patterns.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">Analyzing patterns... Need more tick data.</p>
      ) : (
        <div className="space-y-2">
          {patterns.map((p, i) => (
            <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50 border border-border">
              <div className="flex items-center gap-2">
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                  p.type === "Streak" ? "bg-sell/10 text-sell" : p.type === "Reversal" ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary"
                }`}>{p.type}</span>
                <span className="text-xs font-mono font-semibold text-foreground">{p.pattern}</span>
              </div>
              <div className="text-right">
                <span className={`text-xs font-bold ${p.confidence >= 70 ? "text-buy" : p.confidence >= 40 ? "text-warning" : "text-muted-foreground"}`}>
                  {p.confidence.toFixed(0)}%
                </span>
                {p.count > 1 && <span className="text-[9px] text-muted-foreground ml-1">×{p.count}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Module 5: Digit Cycle Detector ────────────────────────────────
const DigitCycleDetector = ({ lastDigits }: { lastDigits: number[] }) => {
  const cycle = useMemo(() => {
    const d = lastDigits.slice(-100);
    if (d.length < 20) return null;

    // Check odd cycle (1→3→5→7→9) and even cycle (0→2→4→6→8)
    const oddSeq = [1, 3, 5, 7, 9];
    const evenSeq = [0, 2, 4, 6, 8];
    const highSeq = [5, 6, 7, 8, 9];
    const lowSeq = [0, 1, 2, 3, 4];

    const checkCycle = (seq: number[], label: string) => {
      let matchCount = 0;
      const recent = d.slice(-20);
      for (let i = 0; i < recent.length; i++) {
        if (seq.includes(recent[i])) matchCount++;
      }
      const strength = (matchCount / recent.length) * 100;
      return { label, sequence: seq, strength, matchCount };
    };

    const cycles = [
      checkCycle(oddSeq, "Odd Digit Cycle"),
      checkCycle(evenSeq, "Even Digit Cycle"),
      checkCycle(highSeq, "High Digit Cycle"),
      checkCycle(lowSeq, "Low Digit Cycle"),
    ];

    const best = cycles.sort((a, b) => b.strength - a.strength)[0];
    return best.strength >= 55 ? best : null;
  }, [lastDigits]);

  // Circular diagram
  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const activeSet = cycle ? new Set(cycle.sequence) : new Set<number>();

  return (
    <div className="p-4 rounded-xl bg-card border border-border h-full">
      <div className="flex items-center gap-2 mb-3">
        <RefreshCw className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Digit Cycle Detector</h3>
      </div>
      <div className="flex items-center gap-4">
        {/* Circular diagram */}
        <div className="relative w-28 h-28 shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {digits.map((d, i) => {
              const angle = (i * 36 - 90) * (Math.PI / 180);
              const x = 50 + 38 * Math.cos(angle);
              const y = 50 + 38 * Math.sin(angle);
              const isActive = activeSet.has(d);
              return (
                <g key={d}>
                  <circle cx={x} cy={y} r="8" fill={isActive ? "hsl(var(--buy))" : "hsl(var(--secondary))"} opacity={isActive ? 0.9 : 0.4} />
                  <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize="7" fontWeight="bold" fill={isActive ? "hsl(var(--buy-foreground, var(--background)))" : "hsl(var(--muted-foreground))"}>
                    {d}
                  </text>
                  {/* Draw connections between active digits */}
                  {isActive && i > 0 && activeSet.has(digits[i - 1]) && (
                    <line
                      x1={50 + 38 * Math.cos(((i - 1) * 36 - 90) * (Math.PI / 180))}
                      y1={50 + 38 * Math.sin(((i - 1) * 36 - 90) * (Math.PI / 180))}
                      x2={x} y2={y}
                      stroke="hsl(var(--buy))" strokeWidth="1" opacity="0.3"
                    />
                  )}
                </g>
              );
            })}
          </svg>
        </div>
        <div className="flex-1">
          {cycle ? (
            <>
              <p className="text-xs font-semibold text-foreground">{cycle.label}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Sequence: {cycle.sequence.join(" → ")}</p>
              <div className="mt-2">
                <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                  <span>Cycle Strength</span><span>{cycle.strength.toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div className="h-full bg-buy rounded-full" animate={{ width: `${cycle.strength}%` }} transition={{ duration: 0.4 }} />
                </div>
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">No dominant cycle detected. Digits are distributed evenly.</p>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Module 6: Probability Projection Engine ───────────────────────
const ProbabilityProjectionEngine = ({ lastDigits }: { lastDigits: number[] }) => {
  const { table, mostProbable, leastProbable, interpretation } = useMemo(() => {
    const d = lastDigits.slice(-300);
    const total = d.length;
    if (total < 10) return { table: [], mostProbable: 0, leastProbable: 0, interpretation: "" };

    const freq = new Array(10).fill(0);
    d.forEach(x => freq[x]++);
    const t = freq.map((c, i) => ({ digit: i, count: c, pct: (c / total) * 100 }));
    const sorted = [...t].sort((a, b) => b.pct - a.pct);
    const mp = sorted[0];
    const lp = sorted[sorted.length - 1];
    const interp = `Digit ${mp.digit} currently shows elevated probability based on recent distribution imbalance. Digit ${lp.digit} is underrepresented.`;
    return { table: t, mostProbable: mp.digit, leastProbable: lp.digit, interpretation: interp };
  }, [lastDigits]);

  if (table.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Probability Projection Engine</h3>
        </div>
        <p className="text-xs text-muted-foreground text-center py-4">Collecting tick data for probability analysis...</p>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-card border border-border">
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Probability Projection Engine</h3>
        <span className="text-[9px] text-muted-foreground ml-auto">Based on last {Math.min(lastDigits.length, 300)} ticks</span>
      </div>
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 mb-4">
        {table.map(d => {
          const isHigh = d.digit === mostProbable;
          const isLow = d.digit === leastProbable;
          const barHeight = Math.max(d.pct * 3, 4);
          return (
            <div key={d.digit} className="flex flex-col items-center gap-1">
              <div className="w-full h-20 bg-secondary/30 rounded-lg relative flex items-end justify-center overflow-hidden">
                <motion.div
                  className={`w-full rounded-t-md ${isHigh ? "bg-buy" : isLow ? "bg-sell" : "bg-primary/40"}`}
                  animate={{ height: `${barHeight}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
              <span className={`text-xs font-bold ${isHigh ? "text-buy" : isLow ? "text-sell" : "text-foreground"}`}>{d.digit}</span>
              <span className={`text-[9px] font-mono ${isHigh ? "text-buy" : isLow ? "text-sell" : "text-muted-foreground"}`}>{d.pct.toFixed(1)}%</span>
              <div className="flex items-center">
                {d.pct > 12 ? <TrendingUp className="w-3 h-3 text-buy" /> : d.pct < 8 ? <TrendingDown className="w-3 h-3 text-sell" /> : <Minus className="w-3 h-3 text-muted-foreground" />}
              </div>
            </div>
          );
        })}
      </div>
      <div className="p-3 rounded-lg bg-secondary/30 border border-border">
        <p className="text-xs text-muted-foreground">{interpretation}</p>
      </div>
    </div>
  );
};

// ── Confluence Radar Panel ─────────────────────────────────────────
const ConfluenceRadar = ({ lastDigits, tickBuffer, signalScore = 0, signalDetails, digitPressure }: {
  lastDigits: number[];
  tickBuffer: TickData[];
  signalScore: number;
  signalDetails?: SignalDetails;
  digitPressure?: { [digit: number]: number };
}) => {
  const radarData = useMemo(() => {
    const freq = signalDetails?.frequencyScore ?? 0;
    const pressure = signalDetails?.pressureScore ?? 0;
    const streak = signalDetails?.streakScore ?? 0;
    const pattern = signalDetails?.patternScore ?? 0;
    const volatility = signalDetails?.volatilityScore ?? 0;

    // Momentum from digit edge
    const d = lastDigits;
    let momentum = 0;
    if (d.length >= 50) {
      const recent = d.slice(-25);
      const older = d.slice(-50, -25);
      const recentOdd = recent.filter(x => x % 2 !== 0).length / recent.length;
      const olderOdd = older.filter(x => x % 2 !== 0).length / older.length;
      momentum = Math.min(Math.abs(recentOdd - olderOdd) * 5, 1);
    }

    // Tick speed factor
    let speed = 0;
    if (tickBuffer.length >= 10) {
      const last10 = tickBuffer.slice(-10);
      const span = last10[last10.length - 1].epoch - last10[0].epoch;
      speed = span > 0 ? Math.min((10 / span) / 3, 1) : 0;
    }

    const axes = [
      { axis: "Frequency", value: freq },
      { axis: "Pressure", value: pressure },
      { axis: "Streak", value: streak },
      { axis: "Pattern", value: pattern },
      { axis: "Volatility", value: volatility },
      { axis: "Momentum", value: momentum },
      { axis: "Speed", value: speed },
    ];

    const combined = (freq * 0.2 + pressure * 0.25 + streak * 0.1 + pattern * 0.1 + volatility * 0.1 + momentum * 0.15 + speed * 0.1) * 100;
    const confidence = Math.min(Math.round(combined), 100);

    let bias = "NEUTRAL";
    if (d.length >= 30) {
      const oddCount = d.slice(-100).filter(x => x % 2 !== 0).length;
      const total = Math.min(d.length, 100);
      bias = oddCount / total > 0.55 ? "ODD" : oddCount / total < 0.45 ? "EVEN" : "NEUTRAL";
    }

    return { axes, confidence, bias };
  }, [lastDigits, tickBuffer, signalScore, signalDetails]);

  const { axes, confidence, bias } = radarData;
  const cx = 120, cy = 120, r = 90;
  const angleStep = (2 * Math.PI) / axes.length;

  const pointsStr = axes.map((a, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const val = a.value * r;
    return `${cx + val * Math.cos(angle)},${cy + val * Math.sin(angle)}`;
  }).join(" ");

  const confColor = confidence >= 70 ? "text-buy" : confidence >= 40 ? "text-warning" : "text-muted-foreground";
  const confBg = confidence >= 70 ? "stroke-buy fill-buy/20" : confidence >= 40 ? "stroke-warning fill-warning/20" : "stroke-muted-foreground fill-muted/20";

  return (
    <div className="p-4 rounded-xl bg-card border border-border">
      <div className="flex items-center gap-2 mb-3">
        <Radar className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Confluence Radar</h3>
        <span className={`ml-auto text-xl font-bold ${confColor}`}>{confidence}%</span>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4">
        {/* SVG Radar Chart */}
        <svg viewBox="0 0 240 240" className="w-52 h-52 shrink-0">
          {/* Grid rings */}
          {[0.25, 0.5, 0.75, 1].map(ring => (
            <polygon
              key={ring}
              points={axes.map((_, i) => {
                const angle = i * angleStep - Math.PI / 2;
                const v = ring * r;
                return `${cx + v * Math.cos(angle)},${cy + v * Math.sin(angle)}`;
              }).join(" ")}
              className="fill-none stroke-border"
              strokeWidth={0.5}
            />
          ))}
          {/* Axis lines */}
          {axes.map((a, i) => {
            const angle = i * angleStep - Math.PI / 2;
            return (
              <line key={a.axis} x1={cx} y1={cy} x2={cx + r * Math.cos(angle)} y2={cy + r * Math.sin(angle)} className="stroke-border" strokeWidth={0.5} />
            );
          })}
          {/* Data polygon */}
          <motion.polygon
            points={pointsStr}
            className={confBg}
            strokeWidth={2}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
          {/* Axis labels */}
          {axes.map((a, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const lx = cx + (r + 18) * Math.cos(angle);
            const ly = cy + (r + 18) * Math.sin(angle);
            return (
              <text key={a.axis} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground text-[8px]">
                {a.axis}
              </text>
            );
          })}
        </svg>

        {/* Scores breakdown */}
        <div className="flex-1 space-y-2 w-full">
          {axes.map(a => (
            <div key={a.axis} className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground w-16">{a.axis}</span>
              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${a.value >= 0.7 ? "bg-buy" : a.value >= 0.4 ? "bg-warning" : "bg-muted-foreground"}`}
                  animate={{ width: `${a.value * 100}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
              <span className="text-[10px] text-foreground font-mono w-8 text-right">{(a.value * 100).toFixed(0)}%</span>
            </div>
          ))}

          <div className="mt-3 p-3 rounded-lg bg-secondary/30 border border-border">
            <p className="text-xs text-muted-foreground">
              Trade Signal: <span className={`font-bold ${confColor}`}>{confidence}% Confluence</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Suggested Bias: <span className="font-bold text-foreground">{bias}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Confidence: <span className="font-bold text-foreground">{confidence >= 70 ? "High" : confidence >= 40 ? "Medium" : "Low"}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main Analysis Tab ─────────────────────────────────────────────
const AnalysisTab = ({ lastDigits, session, marketLabel, tickBuffer, signalScore, signalDetails, digitPressure }: AnalysisTabProps) => {
  const winRate = session.totalTrades > 0 ? ((session.wins / session.totalTrades) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-4">
      {/* Session Overview Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Trades", value: session.totalTrades, color: "text-foreground" },
          { label: "Win Rate", value: `${winRate}%`, color: "text-buy" },
          { label: "Net Profit", value: `$${session.totalProfit.toFixed(2)}`, color: session.totalProfit >= 0 ? "text-buy" : "text-sell" },
          { label: "Max Drawdown", value: `${session.maxDrawdown.toFixed(1)}%`, color: "text-sell" },
        ].map(s => (
          <div key={s.label} className="p-3 rounded-xl bg-card border border-border text-center">
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* AI Strategy Optimizer */}
      <AIOptimizer
        lastDigits={lastDigits}
        tickBuffer={tickBuffer}
        signalScore={signalScore}
      />

      {/* Confluence Radar — Full Width */}
      <ConfluenceRadar
        lastDigits={lastDigits}
        tickBuffer={tickBuffer}
        signalScore={signalScore ?? 0}
        signalDetails={signalDetails}
        digitPressure={digitPressure}
      />

      {/* Section 1 — Market Overview (Top Row) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <VolatilityScanner tickBuffer={tickBuffer} />
        <TickSpeedMonitor tickBuffer={tickBuffer} />
        <DigitPressureBalance lastDigits={lastDigits} />
      </div>

      {/* Section 2 — Pattern Intelligence (Middle Row) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PatternRecognitionEngine lastDigits={lastDigits} />
        <DigitCycleDetector lastDigits={lastDigits} />
      </div>

      {/* Section 3 — Prediction Intelligence (Bottom Row) */}
      <ProbabilityProjectionEngine lastDigits={lastDigits} />

      {/* Section 4 — Institutional Analysis Terminal */}
      <InstitutionTools tickBuffer={tickBuffer} lastDigits={lastDigits} />
    </div>
  );
};

export default AnalysisTab;
