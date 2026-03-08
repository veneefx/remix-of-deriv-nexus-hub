import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Activity, BarChart3, TrendingUp, TrendingDown, Eye, Brain,
  Zap, Target, Gauge, Scan, ArrowUp, ArrowDown, Minus
} from "lucide-react";

interface TickData { quote: number; digit: number; epoch: number; }
interface QuantTerminalProps { lastDigits: number[]; tickBuffer: TickData[]; signalScore?: number; }

// ── 1. Digit Heatmap Matrix ──────────────────────────────────────
const DigitHeatmap = ({ lastDigits }: { lastDigits: number[] }) => {
  const { grid, blockSize } = useMemo(() => {
    const bs = 20;
    const d = lastDigits.slice(-200);
    const blocks: { digit: number; intensity: number }[][] = [];
    for (let b = 0; b < Math.floor(d.length / bs); b++) {
      const slice = d.slice(b * bs, (b + 1) * bs);
      const freq = new Array(10).fill(0);
      slice.forEach(x => freq[x]++);
      const max = Math.max(...freq);
      blocks.push(freq.map((c, i) => ({ digit: i, intensity: max > 0 ? c / max : 0 })));
    }
    return { grid: blocks, blockSize: bs };
  }, [lastDigits]);

  if (grid.length < 2) return null;

  return (
    <div className="p-3 rounded-xl bg-card border border-border">
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 className="w-4 h-4 text-primary" />
        <h3 className="text-xs font-semibold text-foreground">Digit Heatmap Matrix</h3>
        <span className="text-[9px] text-muted-foreground ml-auto">{blockSize}-tick blocks</span>
      </div>
      <div className="overflow-x-auto">
        <div className="flex gap-px" style={{ minWidth: grid.length * 18 }}>
          {/* Y-axis labels */}
          <div className="flex flex-col gap-px mr-1">
            {[0,1,2,3,4,5,6,7,8,9].map(d => (
              <div key={d} className="w-4 h-4 flex items-center justify-center text-[8px] text-muted-foreground font-mono">{d}</div>
            ))}
          </div>
          {grid.map((block, bi) => (
            <div key={bi} className="flex flex-col gap-px">
              {block.map((cell, ci) => (
                <motion.div
                  key={ci}
                  className="w-4 h-4 rounded-sm"
                  style={{
                    backgroundColor: `hsl(var(--primary) / ${Math.max(cell.intensity * 0.8, 0.05)})`,
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: bi * 0.02 }}
                  title={`Digit ${cell.digit}, Block ${bi + 1}: ${(cell.intensity * 100).toFixed(0)}%`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1 mt-1.5 text-[8px] text-muted-foreground">
        <span>Low</span>
        <div className="flex gap-px">
          {[0.1, 0.3, 0.5, 0.7, 0.9].map(v => (
            <div key={v} className="w-3 h-2 rounded-sm" style={{ backgroundColor: `hsl(var(--primary) / ${v * 0.8})` }} />
          ))}
        </div>
        <span>High</span>
        <span className="ml-2">← Time</span>
      </div>
    </div>
  );
};

// ── 2. Digit Flow Analyzer ───────────────────────────────────────
const DigitFlowAnalyzer = ({ lastDigits }: { lastDigits: number[] }) => {
  const flow = useMemo(() => {
    const d = lastDigits.slice(-50);
    if (d.length < 10) return null;

    // Detect ascending/descending/oscillating flow
    let ascending = 0, descending = 0, oscil = 0;
    for (let i = 1; i < d.length; i++) {
      if (d[i] > d[i - 1]) ascending++;
      else if (d[i] < d[i - 1]) descending++;
      else oscil++;
    }
    const total = d.length - 1;
    const ascPct = (ascending / total) * 100;
    const descPct = (descending / total) * 100;

    let direction = "Oscillating";
    let strength = 0;
    if (ascPct > 55) { direction = "Ascending"; strength = ascPct; }
    else if (descPct > 55) { direction = "Descending"; strength = descPct; }
    else { direction = "Oscillating"; strength = Math.max(ascPct, descPct); }

    // Find sequence
    const last10 = d.slice(-10);
    const seq = last10.join(" → ");

    return { direction, strength, seq, ascPct, descPct };
  }, [lastDigits]);

  if (!flow) return null;

  return (
    <div className="p-3 rounded-xl bg-card border border-border">
      <div className="flex items-center gap-2 mb-2">
        <Activity className="w-4 h-4 text-primary" />
        <h3 className="text-xs font-semibold text-foreground">Digit Flow Analyzer</h3>
      </div>
      <div className="flex items-center gap-3 mb-2">
        <div className={`flex items-center gap-1 text-sm font-bold ${flow.direction === "Ascending" ? "text-buy" : flow.direction === "Descending" ? "text-sell" : "text-warning"}`}>
          {flow.direction === "Ascending" ? <ArrowUp className="w-4 h-4" /> : flow.direction === "Descending" ? <ArrowDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
          {flow.direction}
        </div>
        <span className="text-xs text-muted-foreground">Strength: {flow.strength.toFixed(0)}%</span>
      </div>
      <p className="text-[9px] font-mono text-muted-foreground truncate">{flow.seq}</p>
    </div>
  );
};

// ── 3. Pattern Radar ─────────────────────────────────────────────
const PatternRadar = ({ lastDigits }: { lastDigits: number[] }) => {
  const patterns = useMemo(() => {
    const d = lastDigits.slice(-100);
    if (d.length < 20) return [];

    const results: { name: string; strength: number; status: string }[] = [];

    // Double digits
    let doubles = 0;
    for (let i = 0; i < d.length - 1; i++) if (d[i] === d[i + 1]) doubles++;
    const doublePct = (doubles / (d.length - 1)) * 100;
    results.push({ name: "Double Digits", strength: Math.min(doublePct * 5, 100), status: doublePct > 12 ? "Active" : doublePct > 8 ? "Moderate" : "Weak" });

    // Alternating odd/even
    let alt = 0;
    for (let i = 1; i < d.length; i++) if ((d[i] % 2) !== (d[i - 1] % 2)) alt++;
    const altPct = (alt / (d.length - 1)) * 100;
    results.push({ name: "Alternating", strength: Math.min(altPct, 100), status: altPct > 60 ? "Strong" : altPct > 45 ? "Moderate" : "Weak" });

    // Cluster pattern (consecutive high or low)
    let cluster = 0;
    for (let i = 2; i < d.length; i++) {
      const allHigh = d[i] >= 5 && d[i - 1] >= 5 && d[i - 2] >= 5;
      const allLow = d[i] < 5 && d[i - 1] < 5 && d[i - 2] < 5;
      if (allHigh || allLow) cluster++;
    }
    const clusterPct = (cluster / (d.length - 2)) * 100;
    results.push({ name: "Cluster Pattern", strength: Math.min(clusterPct * 4, 100), status: clusterPct > 15 ? "Strong" : clusterPct > 8 ? "Moderate" : "Weak" });

    // Reversal (big jumps)
    let reversals = 0;
    for (let i = 1; i < d.length; i++) if (Math.abs(d[i] - d[i - 1]) >= 7) reversals++;
    const revPct = (reversals / (d.length - 1)) * 100;
    results.push({ name: "Reversal Pattern", strength: Math.min(revPct * 10, 100), status: revPct > 8 ? "Active" : revPct > 4 ? "Moderate" : "Weak" });

    return results;
  }, [lastDigits]);

  if (patterns.length === 0) return null;

  return (
    <div className="p-3 rounded-xl bg-card border border-border">
      <div className="flex items-center gap-2 mb-2">
        <Scan className="w-4 h-4 text-primary" />
        <h3 className="text-xs font-semibold text-foreground">Pattern Radar</h3>
      </div>
      <div className="space-y-2">
        {patterns.map(p => (
          <div key={p.name} className="flex items-center gap-2">
            <span className="text-[10px] text-foreground w-24 truncate">{p.name}</span>
            <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${p.status === "Strong" || p.status === "Active" ? "bg-buy" : p.status === "Moderate" ? "bg-warning" : "bg-muted-foreground/30"}`}
                animate={{ width: `${p.strength}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className={`text-[9px] font-bold w-14 text-right ${p.status === "Strong" || p.status === "Active" ? "text-buy" : p.status === "Moderate" ? "text-warning" : "text-muted-foreground"}`}>
              {p.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── 4. Volatility Intelligence ───────────────────────────────────
const VolatilityIntelligence = ({ tickBuffer }: { tickBuffer: TickData[] }) => {
  const data = useMemo(() => {
    if (tickBuffer.length < 10) return null;
    const recent = tickBuffer.slice(-100);
    let sum = 0;
    for (let i = 1; i < recent.length; i++) sum += Math.abs(recent[i].quote - recent[i - 1].quote);
    const avg = recent.length > 1 ? sum / (recent.length - 1) : 0;
    const score = Math.min(avg * 1000, 100);
    const level = score >= 75 ? "Extreme" : score >= 50 ? "High" : score >= 25 ? "Moderate" : "Low";
    return { score, level, avg };
  }, [tickBuffer]);

  if (!data) return null;

  const color = data.level === "Extreme" ? "text-sell" : data.level === "High" ? "text-warning" : data.level === "Moderate" ? "text-primary" : "text-buy";
  const barColor = data.level === "Extreme" ? "bg-sell" : data.level === "High" ? "bg-warning" : data.level === "Moderate" ? "bg-primary" : "bg-buy";

  return (
    <div className="p-3 rounded-xl bg-card border border-border">
      <div className="flex items-center gap-2 mb-2">
        <Gauge className="w-4 h-4 text-primary" />
        <h3 className="text-xs font-semibold text-foreground">Volatility Intelligence</h3>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="h-2.5 bg-secondary rounded-full overflow-hidden mb-1">
            <motion.div className={`h-full rounded-full ${barColor}`} animate={{ width: `${data.score}%` }} transition={{ duration: 0.3 }} />
          </div>
          <div className="flex justify-between">
            <span className={`text-[10px] font-bold ${color}`}>{data.level}</span>
            <span className="text-[10px] text-muted-foreground">{data.score.toFixed(0)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── 5. Tick Speed Analyzer ───────────────────────────────────────
const TickSpeedAnalyzer = ({ tickBuffer }: { tickBuffer: TickData[] }) => {
  const data = useMemo(() => {
    if (tickBuffer.length < 5) return null;
    const now = tickBuffer[tickBuffer.length - 1].epoch;
    const tps1 = tickBuffer.filter(t => t.epoch > now - 1).length;
    const tps10 = tickBuffer.filter(t => t.epoch > now - 10).length / 10;
    const tps60 = tickBuffer.filter(t => t.epoch > now - 60).length / 60;
    const activity = tps10 >= 3 ? "Very Fast" : tps10 >= 2 ? "Fast" : tps10 >= 1 ? "Normal" : "Slow";
    return { tps1, tps10, tps60, activity };
  }, [tickBuffer]);

  if (!data) return null;

  return (
    <div className="p-3 rounded-xl bg-card border border-border">
      <div className="flex items-center gap-2 mb-2">
        <Zap className="w-4 h-4 text-primary" />
        <h3 className="text-xs font-semibold text-foreground">Tick Speed</h3>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xl font-bold text-foreground font-mono">{data.tps10.toFixed(1)}</span>
        <span className="text-[9px] text-muted-foreground">t/s</span>
        <span className={`ml-auto text-[10px] font-bold ${data.activity === "Very Fast" ? "text-sell" : data.activity === "Fast" ? "text-warning" : "text-foreground"}`}>
          {data.activity}
        </span>
      </div>
    </div>
  );
};

// ── 6. Confluence Engine ─────────────────────────────────────────
const ConfluenceEngine = ({ lastDigits, tickBuffer }: { lastDigits: number[]; tickBuffer: TickData[] }) => {
  const data = useMemo(() => {
    if (lastDigits.length < 50 || tickBuffer.length < 20) return null;

    const d = lastDigits.slice(-200);
    const freq = new Array(10).fill(0);
    d.forEach(x => freq[x]++);
    const maxDev = Math.max(...freq.map(c => Math.abs((c / d.length) * 100 - 10)));
    const imbalance = Math.min(maxDev * 5, 100);

    // Momentum
    const recent = d.slice(-25);
    const older = d.slice(-50, -25);
    const rOdd = recent.filter(x => x % 2 !== 0).length;
    const oOdd = older.filter(x => x % 2 !== 0).length;
    const momentum = Math.min(Math.abs(rOdd - oOdd) * 10, 100);

    // Pattern
    let doubles = 0;
    for (let i = 0; i < d.length - 1; i++) if (d[i] === d[i + 1]) doubles++;
    const pattern = Math.min((doubles / (d.length - 1)) * 500, 100);

    // Volatility
    let vol = 0;
    const ticks = tickBuffer.slice(-100);
    for (let i = 1; i < ticks.length; i++) vol += Math.abs(ticks[i].quote - ticks[i - 1].quote);
    const volatility = Math.min((ticks.length > 1 ? vol / (ticks.length - 1) : 0) * 1000, 100);

    // Tick speed
    const now = tickBuffer[tickBuffer.length - 1].epoch;
    const tps = tickBuffer.filter(t => t.epoch > now - 5).length / 5;
    const speed = Math.min(tps * 30, 100);

    // Probability bias
    const sorted = [...freq].sort((a, b) => b - a);
    const probBias = Math.min(((sorted[0] - sorted[9]) / d.length) * 500, 100);

    const score = Math.min(Math.round(
      imbalance * 0.20 + momentum * 0.20 + pattern * 0.20 + volatility * 0.15 + speed * 0.15 + probBias * 0.10
    ), 100);

    const strength = score >= 70 ? "Strong" : score >= 50 ? "Moderate" : score >= 30 ? "Developing" : "Weak";

    return { score, strength, imbalance, momentum, pattern, volatility, speed, probBias };
  }, [lastDigits, tickBuffer]);

  if (!data) return null;

  const color = data.strength === "Strong" ? "text-buy" : data.strength === "Moderate" ? "text-warning" : "text-muted-foreground";

  return (
    <div className="p-3 rounded-xl bg-card border border-border">
      <div className="flex items-center gap-2 mb-2">
        <Eye className="w-4 h-4 text-primary" />
        <h3 className="text-xs font-semibold text-foreground">Market Confluence</h3>
        <span className={`ml-auto text-lg font-bold ${color}`}>{data.score}%</span>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {[
          { label: "Imbalance", value: data.imbalance },
          { label: "Momentum", value: data.momentum },
          { label: "Pattern", value: data.pattern },
          { label: "Volatility", value: data.volatility },
          { label: "Speed", value: data.speed },
          { label: "Prob Bias", value: data.probBias },
        ].map(m => (
          <div key={m.label} className="text-center">
            <div className="h-6 bg-secondary rounded relative overflow-hidden">
              <motion.div
                className={`absolute bottom-0 w-full rounded ${m.value >= 50 ? "bg-buy/40" : m.value >= 30 ? "bg-warning/40" : "bg-muted-foreground/20"}`}
                animate={{ height: `${m.value}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="text-[7px] text-muted-foreground">{m.label}</span>
          </div>
        ))}
      </div>
      <p className={`text-[10px] font-bold mt-2 text-center ${color}`}>Signal: {data.strength}</p>
    </div>
  );
};

// ── 7. AI Insight Panel ──────────────────────────────────────────
const AIInsightPanel = ({ lastDigits, tickBuffer, signalScore = 0 }: QuantTerminalProps) => {
  const insights = useMemo(() => {
    if (lastDigits.length < 50) return [];
    const d = lastDigits.slice(-200);
    const result: { text: string; type: "bullish" | "bearish" | "neutral" }[] = [];

    // Momentum
    const recent = d.slice(-25);
    const older = d.slice(-50, -25);
    const rOdd = recent.filter(x => x % 2 !== 0).length;
    const oOdd = older.filter(x => x % 2 !== 0).length;
    if (rOdd > oOdd + 2) result.push({ text: "Odd digits gaining momentum", type: "bullish" });
    else if (rOdd < oOdd - 2) result.push({ text: "Even digits gaining momentum", type: "bullish" });

    // Dominant digit
    const freq = new Array(10).fill(0);
    d.forEach(x => freq[x]++);
    const dominant = freq.indexOf(Math.max(...freq));
    result.push({ text: `Digit ${dominant} currently dominant (${((freq[dominant] / d.length) * 100).toFixed(1)}%)`, type: "neutral" });

    // Pattern
    let doubles = 0;
    for (let i = 0; i < d.length - 1; i++) if (d[i] === d[i + 1]) doubles++;
    if (doubles > d.length * 0.12) result.push({ text: "Double digits appearing frequently", type: "bearish" });

    // Volatility
    if (tickBuffer.length > 20) {
      let vol = 0;
      const recent = tickBuffer.slice(-50);
      for (let i = 1; i < recent.length; i++) vol += Math.abs(recent[i].quote - recent[i - 1].quote);
      const avg = vol / (recent.length - 1);
      if (avg * 1000 > 50) result.push({ text: "High volatility detected — increased trading opportunities", type: "bullish" });
      else result.push({ text: "Low volatility — stable market conditions", type: "neutral" });
    }

    // Signal
    if (signalScore >= 0.3) result.push({ text: `Strong signal detected (${(signalScore * 100).toFixed(0)}%)`, type: "bullish" });

    // Suggested contract
    const oddPct = (d.filter(x => x % 2 !== 0).length / d.length) * 100;
    if (oddPct > 55) result.push({ text: "Suggested: ODD contracts", type: "bullish" });
    else if (oddPct < 45) result.push({ text: "Suggested: EVEN contracts", type: "bullish" });

    return result;
  }, [lastDigits, tickBuffer, signalScore]);

  if (insights.length === 0) return null;

  return (
    <div className="p-3 rounded-xl bg-card border border-border">
      <div className="flex items-center gap-2 mb-2">
        <Brain className="w-4 h-4 text-primary" />
        <h3 className="text-xs font-semibold text-foreground">DNexus AI Insight</h3>
      </div>
      <div className="space-y-1.5">
        {insights.map((ins, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className={`text-[10px] mt-0.5 ${ins.type === "bullish" ? "text-buy" : ins.type === "bearish" ? "text-sell" : "text-muted-foreground"}`}>
              {ins.type === "bullish" ? "▲" : ins.type === "bearish" ? "▼" : "●"}
            </span>
            <p className="text-[10px] text-foreground">{ins.text}</p>
          </div>
        ))}
      </div>
      <p className="text-[8px] text-muted-foreground mt-2 text-center">Analysis guidance only. Not financial advice.</p>
    </div>
  );
};

// ── Exported Quant Terminal ──────────────────────────────────────
const QuantTerminal = ({ lastDigits, tickBuffer, signalScore }: QuantTerminalProps) => (
  <div className="space-y-3">
    <AIInsightPanel lastDigits={lastDigits} tickBuffer={tickBuffer} signalScore={signalScore} />
    <DigitHeatmap lastDigits={lastDigits} />
    <DigitFlowAnalyzer lastDigits={lastDigits} />
    <PatternRadar lastDigits={lastDigits} />
    <div className="grid grid-cols-2 gap-2">
      <VolatilityIntelligence tickBuffer={tickBuffer} />
      <TickSpeedAnalyzer tickBuffer={tickBuffer} />
    </div>
    <ConfluenceEngine lastDigits={lastDigits} tickBuffer={tickBuffer} />
  </div>
);

export default QuantTerminal;
