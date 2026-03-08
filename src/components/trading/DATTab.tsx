import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Info, Activity, BarChart3, TrendingUp, TrendingDown, Gauge, Zap, Brain, Target,
  Scan, Eye, ArrowUp, ArrowDown, Minus, RefreshCw, AlertTriangle
} from "lucide-react";
import { MARKET_CATEGORIES, VOLATILITY_MARKETS, getLastDigit } from "@/lib/trading-constants";
import DerivWebSocket from "@/services/deriv-websocket";
import { toast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const DERIV_APP_ID = "129344";

interface DATTabProps {
  ws: DerivWebSocket | null;
  selectedMarket: string;
  onMarketChange: (symbol: string) => void;
}

interface TickEntry {
  quote: number;
  digit: number;
  epoch: number;
}

// ── Tooltip helper ──
const Tip = ({ text, children }: { text: string; children: React.ReactNode }) => (
  <Tooltip>
    <TooltipTrigger asChild>{children}</TooltipTrigger>
    <TooltipContent side="top" className="max-w-[200px] text-[10px]">{text}</TooltipContent>
  </Tooltip>
);

// ── Mini Heatmap (5x10 grid of last 50 ticks) ──
const MiniHeatmap = ({ digits }: { digits: number[] }) => {
  const grid = useMemo(() => {
    const d = digits.slice(-50);
    const blockSize = 10;
    const blocks: number[][] = [];
    for (let b = 0; b < Math.floor(d.length / blockSize); b++) {
      const slice = d.slice(b * blockSize, (b + 1) * blockSize);
      const freq = new Array(10).fill(0);
      slice.forEach(x => freq[x]++);
      blocks.push(freq);
    }
    return blocks;
  }, [digits]);

  if (grid.length < 2) return <div className="text-[9px] text-muted-foreground">Collecting...</div>;

  return (
    <div className="flex gap-px">
      {grid.map((block, bi) => (
        <div key={bi} className="flex flex-col gap-px">
          {block.map((count, ci) => (
            <div
              key={ci}
              className="w-2.5 h-2.5 rounded-[2px]"
              style={{ backgroundColor: `hsl(var(--primary) / ${Math.min(count * 0.35, 0.9)})` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

// ── Sparkline (frequency movement) ──
const Sparkline = ({ digits }: { digits: number[] }) => {
  const points = useMemo(() => {
    const d = digits.slice(-50);
    if (d.length < 5) return "";
    const windowSize = 5;
    const vals: number[] = [];
    for (let i = 0; i <= d.length - windowSize; i++) {
      const odd = d.slice(i, i + windowSize).filter(x => x % 2 !== 0).length;
      vals.push(odd / windowSize);
    }
    const max = Math.max(...vals, 0.001);
    const min = Math.min(...vals);
    const range = max - min || 1;
    return vals.map((v, i) => `${(i / (vals.length - 1)) * 80},${20 - ((v - min) / range) * 16}`).join(" ");
  }, [digits]);

  if (!points) return null;
  return (
    <svg width="80" height="24" viewBox="0 0 80 24" className="overflow-visible">
      <polyline points={points} fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// ── Confluence Mini Bar ──
const ConfluenceMiniBar = ({ digits, ticks }: { digits: number[]; ticks: TickEntry[] }) => {
  const score = useMemo(() => {
    if (digits.length < 30) return 0;
    const d = digits.slice(-200);
    const freq = new Array(10).fill(0);
    d.forEach(x => freq[x]++);
    const maxDev = Math.max(...freq.map(c => Math.abs((c / d.length) * 100 - 10)));
    const imbalance = Math.min(maxDev * 5, 100);

    let momentum = 0;
    if (d.length >= 50) {
      const r = d.slice(-25).filter(x => x % 2 !== 0).length;
      const o = d.slice(-50, -25).filter(x => x % 2 !== 0).length;
      momentum = Math.min(Math.abs(r - o) * 10, 100);
    }

    let vol = 0;
    if (ticks.length > 10) {
      const recent = ticks.slice(-50);
      for (let i = 1; i < recent.length; i++) vol += Math.abs(recent[i].quote - recent[i - 1].quote);
      vol = Math.min((recent.length > 1 ? vol / (recent.length - 1) : 0) * 1000, 100);
    }

    return Math.round(imbalance * 0.4 + momentum * 0.3 + vol * 0.3);
  }, [digits, ticks]);

  const color = score >= 70 ? "bg-buy" : score >= 40 ? "bg-warning" : "bg-muted-foreground/30";
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
        <motion.div className={`h-full rounded-full ${color}`} animate={{ width: `${score}%` }} transition={{ duration: 0.3 }} />
      </div>
      <span className="text-[9px] font-mono font-bold text-foreground">{score}%</span>
    </div>
  );
};

const DATTab = ({ ws, selectedMarket, onMarketChange }: DATTabProps) => {
  const [tickCount, setTickCount] = useState(100);
  const [overThreshold, setOverThreshold] = useState(4);
  const [underThreshold, setUnderThreshold] = useState(5);
  const [lastDigits, setLastDigits] = useState<number[]>([]);
  const [currentTick, setCurrentTick] = useState<number | null>(null);
  const [tickBuffer, setTickBuffer] = useState<TickEntry[]>([]);
  const [lastEpoch, setLastEpoch] = useState<number | null>(null);
  const prevMarket = useRef(selectedMarket);

  // Subscribe to ticks for DAT's own independent tracking
  useEffect(() => {
    if (!ws) return;

    // Reset on market change
    if (prevMarket.current !== selectedMarket) {
      setLastDigits([]);
      setTickBuffer([]);
      setCurrentTick(null);
      setLastEpoch(null);
      toast({ title: `DAT → ${VOLATILITY_MARKETS.find(m => m.symbol === selectedMarket)?.label || selectedMarket}`, description: "Recalculating all metrics…" });
    }
    prevMarket.current = selectedMarket;

    const unsub = ws.on("tick", (data: any) => {
      if (!data.tick || typeof data.tick.quote !== "number") return;
      const quote = data.tick.quote;
      const digit = getLastDigit(quote);
      const epoch = data.tick.epoch || Date.now() / 1000;

      setCurrentTick(quote);
      setLastEpoch(epoch);
      setLastDigits(prev => [...prev.slice(-999), digit]);
      setTickBuffer(prev => [...prev.slice(-999), { quote, digit, epoch }]);
    });

    return () => { unsub(); };
  }, [ws, selectedMarket]);

  const marketLabel = VOLATILITY_MARKETS.find(m => m.symbol === selectedMarket)?.label || selectedMarket;
  const digits = useMemo(() => lastDigits.slice(-tickCount), [lastDigits, tickCount]);
  const total = digits.length;

  // ── Distribution ──
  const overCount = digits.filter(d => d > overThreshold).length;
  const underCount = digits.filter(d => d < underThreshold).length;
  const overPct = total > 0 ? ((overCount / total) * 100).toFixed(1) : "0.0";
  const underPct = total > 0 ? ((underCount / total) * 100).toFixed(1) : "0.0";

  // ── Frequency table ──
  const freqTable = useMemo(() => {
    const freq = new Array(10).fill(0);
    digits.forEach(d => freq[d]++);
    return freq.map((count, digit) => ({
      digit,
      count,
      pct: total > 0 ? (count / total) * 100 : 0,
    }));
  }, [digits, total]);

  // ── Momentum ──
  const momentum = useMemo(() => {
    if (digits.length < 20) return { direction: "Flat" as string, score: 0, oddPct: 50 };
    const recent = digits.slice(-25);
    const older = digits.slice(-50, -25);
    if (older.length < 10) return { direction: "Flat", score: 0, oddPct: 50 };
    const rOdd = recent.filter(x => x % 2 !== 0).length / recent.length;
    const oOdd = older.filter(x => x % 2 !== 0).length / older.length;
    const diff = rOdd - oOdd;
    const direction = diff > 0.1 ? "Odd Rising" : diff < -0.1 ? "Even Rising" : "Flat";
    return { direction, score: Math.min(Math.abs(diff) * 200, 100), oddPct: rOdd * 100 };
  }, [digits]);

  // ── Streaks ──
  const streaks = useMemo(() => {
    let maxOver = 0, maxUnder = 0, curOver = 0, curUnder = 0;
    digits.forEach(d => {
      if (d > overThreshold) { curOver++; maxOver = Math.max(maxOver, curOver); if (curUnder > 0) curUnder = 0; }
      else if (d < underThreshold) { curUnder++; maxUnder = Math.max(maxUnder, curUnder); if (curOver > 0) curOver = 0; }
      else { curOver = 0; curUnder = 0; }
    });
    return { maxOver, maxUnder };
  }, [digits, overThreshold, underThreshold]);

  // ── Pattern detection ──
  const patterns = useMemo(() => {
    if (digits.length < 20) return [];
    const d = digits.slice(-100);
    const results: { name: string; strength: number; status: string }[] = [];

    let doubles = 0;
    for (let i = 0; i < d.length - 1; i++) if (d[i] === d[i + 1]) doubles++;
    const doublePct = (doubles / (d.length - 1)) * 100;
    results.push({ name: "Doubles", strength: Math.min(doublePct * 5, 100), status: doublePct > 12 ? "Active" : doublePct > 8 ? "Moderate" : "Weak" });

    let alt = 0;
    for (let i = 1; i < d.length; i++) if ((d[i] % 2) !== (d[i - 1] % 2)) alt++;
    const altPct = (alt / (d.length - 1)) * 100;
    results.push({ name: "Alternating", strength: Math.min(altPct, 100), status: altPct > 60 ? "Strong" : altPct > 45 ? "Moderate" : "Weak" });

    let cluster = 0;
    for (let i = 2; i < d.length; i++) {
      if ((d[i] >= 5 && d[i - 1] >= 5 && d[i - 2] >= 5) || (d[i] < 5 && d[i - 1] < 5 && d[i - 2] < 5)) cluster++;
    }
    const clusterPct = (cluster / (d.length - 2)) * 100;
    results.push({ name: "Clusters", strength: Math.min(clusterPct * 4, 100), status: clusterPct > 15 ? "Strong" : clusterPct > 8 ? "Moderate" : "Weak" });

    return results;
  }, [digits]);

  // ── Strategy signals ──
  const strategySignals = useMemo(() => {
    if (digits.length < 30) return { aggressive: false, balanced: false, elit: false };
    const freq = new Array(10).fill(0);
    digits.forEach(d => freq[d]++);
    let maxDev = 0;
    freq.forEach(c => { maxDev = Math.max(maxDev, Math.abs((c / total) * 100 - 10)); });
    const freqScore = Math.min(maxDev / 10, 1);
    return {
      aggressive: freqScore >= 0.05,
      balanced: freqScore >= 0.15,
      elit: maxDev >= 5 && momentum.score >= 30,
    };
  }, [digits, total, momentum.score]);

  // ── Volatility ──
  const volatility = useMemo(() => {
    if (tickBuffer.length < 10) return { score: 0, level: "Low" };
    const recent = tickBuffer.slice(-100);
    let sum = 0;
    for (let i = 1; i < recent.length; i++) sum += Math.abs(recent[i].quote - recent[i - 1].quote);
    const avg = recent.length > 1 ? sum / (recent.length - 1) : 0;
    const score = Math.min(avg * 1000, 100);
    const level = score >= 75 ? "Extreme" : score >= 50 ? "High" : score >= 25 ? "Moderate" : "Low";
    return { score, level };
  }, [tickBuffer]);

  // ── AI Signal strength ──
  const aiSignal = useMemo(() => {
    if (digits.length < 50) return 0;
    const d = digits.slice(-200);
    const freq = new Array(10).fill(0);
    d.forEach(x => freq[x]++);
    const sorted = [...freq].sort((a, b) => b - a);
    const bias = ((sorted[0] - sorted[9]) / d.length) * 100;
    return Math.min(Math.round(bias * 5 + momentum.score * 0.3 + volatility.score * 0.2), 100);
  }, [digits, momentum.score, volatility.score]);

  // ── Tick speed ──
  const tickSpeed = useMemo(() => {
    if (tickBuffer.length < 5) return 0;
    const now = tickBuffer[tickBuffer.length - 1].epoch;
    return tickBuffer.filter(t => t.epoch > now - 10).length / 10;
  }, [tickBuffer]);

  // ── Pattern Grid ──
  const patternCells = useMemo(() => {
    return digits.map(d => (d > overThreshold ? "O" : d < underThreshold ? "U" : "N"));
  }, [digits, overThreshold, underThreshold]);

  // ── Sequences ──
  const [seqLength, setSeqLength] = useState(3);
  const sequences = useMemo(() => {
    const seqMap = new Map<string, number>();
    for (let i = 0; i <= patternCells.length - seqLength; i++) {
      const seq = patternCells.slice(i, i + seqLength).join("");
      seqMap.set(seq, (seqMap.get(seq) || 0) + 1);
    }
    return Array.from(seqMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10);
  }, [patternCells, seqLength]);
  const maxSeqCount = sequences.length > 0 ? Math.max(...sequences.map(s => s[1])) : 1;

  return (
    <div className="space-y-4 p-4 lg:p-5 overflow-y-auto h-full">
      {/* ── Header with Market Selector ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-bold text-foreground">Dynamic Analysis Terminal</h2>
        </div>
        <select
          value={selectedMarket}
          onChange={(e) => onMarketChange(e.target.value)}
          className="px-3 py-1.5 bg-secondary border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {MARKET_CATEGORIES.map(cat => (
            <optgroup key={cat.category} label={cat.category}>
              {cat.markets.map(m => (<option key={m.symbol} value={m.symbol}>{m.label}</option>))}
            </optgroup>
          ))}
        </select>
        <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{total} ticks</span>
        {volatility.level !== "Low" && (
          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${volatility.level === "Extreme" ? "bg-sell/10 text-sell" : volatility.level === "High" ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary"}`}>
            ⚡ {volatility.level} Volatility
          </span>
        )}
      </div>

      {/* ── Live Stats Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        {[
          { label: "Price", value: currentTick !== null ? String(currentTick) : "—", icon: <TrendingUp className="w-3.5 h-3.5" />, tip: "Latest tick price from the selected market" },
          { label: "Last Digit", value: lastDigits.length > 0 ? String(lastDigits[lastDigits.length - 1]) : "—", icon: <Target className="w-3.5 h-3.5" />, tip: "The last digit extracted from the current price" },
          { label: "Tick Speed", value: `${tickSpeed.toFixed(1)} t/s`, icon: <Zap className="w-3.5 h-3.5" />, tip: "Ticks per second over the last 10 seconds" },
          { label: "Volatility", value: `${volatility.score.toFixed(0)}%`, icon: <Gauge className="w-3.5 h-3.5" />, tip: "Average price change between ticks. Higher = more movement" },
          { label: "Momentum", value: `${momentum.score.toFixed(0)}%`, icon: <Activity className="w-3.5 h-3.5" />, tip: "How much the odd/even ratio is shifting between recent and older ticks" },
          { label: "AI Signal", value: `${aiSignal}%`, icon: <Brain className="w-3.5 h-3.5" />, tip: "Combined AI score from frequency bias, momentum, and volatility" },
        ].map(s => (
          <Tip key={s.label} text={s.tip}>
            <div className="p-3 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-primary">{s.icon}</span>
                <span className="text-[10px] text-muted-foreground font-medium">{s.label}</span>
              </div>
              <p className="text-lg font-mono font-bold text-foreground">{s.value}</p>
            </div>
          </Tip>
        ))}
      </div>

      {/* ── Strategy Signals ── */}
      <div className="p-4 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Strategy Signals</h3>
          <Tip text="Shows which strategies would fire a trade based on current market conditions">
            <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
          </Tip>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { name: "Aggressive", active: strategySignals.aggressive, desc: "Low threshold, high frequency" },
            { name: "Balanced", active: strategySignals.balanced, desc: "Moderate threshold, steady" },
            { name: "ELIT", active: strategySignals.elit, desc: "Multi-layer confluence ≥70%" },
          ].map(s => (
            <div key={s.name} className={`p-3 rounded-lg border text-center transition-all ${s.active ? "border-buy/30 bg-buy/5" : "border-border bg-secondary/30"}`}>
              <div className={`w-3 h-3 rounded-full mx-auto mb-1.5 ${s.active ? "bg-buy animate-pulse" : "bg-muted-foreground/20"}`} />
              <p className="text-xs font-bold text-foreground">{s.name}</p>
              <p className={`text-[9px] font-bold ${s.active ? "text-buy" : "text-muted-foreground"}`}>{s.active ? "SIGNAL" : "IDLE"}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Extreme Analytics Row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Mini Heatmap */}
        <Tip text="5-block heatmap showing digit frequency intensity across recent ticks. Darker = more frequent.">
          <div className="p-3 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-1.5 mb-2">
              <Scan className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-semibold text-foreground">Digit Heatmap</span>
            </div>
            <MiniHeatmap digits={lastDigits} />
          </div>
        </Tip>

        {/* Sparkline */}
        <Tip text="Line chart showing how the odd/even ratio fluctuates over the last 50 ticks.">
          <div className="p-3 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-1.5 mb-2">
              <Activity className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-semibold text-foreground">Frequency Sparkline</span>
            </div>
            <Sparkline digits={lastDigits} />
          </div>
        </Tip>

        {/* Confluence Mini */}
        <Tip text="Combined market signal from imbalance, momentum, and volatility. Higher = stronger trade opportunity.">
          <div className="p-3 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-1.5 mb-2">
              <Eye className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-semibold text-foreground">Confluence</span>
            </div>
            <ConfluenceMiniBar digits={lastDigits} ticks={tickBuffer} />
          </div>
        </Tip>
      </div>

      {/* ── Digit Frequency Table ── */}
      <div className="p-4 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Digit Frequency</h3>
          <Tip text="How often each digit (0–9) appears. Expected is 10% each. Deviations create trading signals.">
            <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
          </Tip>
          <span className="text-[9px] text-muted-foreground ml-auto">Window: {total} ticks</span>
        </div>
        <div className="space-y-1.5">
          {freqTable.map(f => {
            const deviation = Math.abs(f.pct - 10);
            const isHigh = f.pct > 12;
            const isLow = f.pct < 8;
            return (
              <div key={f.digit} className="flex items-center gap-2">
                <span className={`w-5 text-center text-xs font-mono font-bold ${isHigh ? "text-buy" : isLow ? "text-sell" : "text-foreground"}`}>{f.digit}</span>
                <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${isHigh ? "bg-buy/60" : isLow ? "bg-sell/60" : "bg-primary/40"}`}
                    animate={{ width: `${Math.min(f.pct * 2.5, 100)}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <span className="text-[10px] font-mono text-foreground w-12 text-right">{f.pct.toFixed(1)}%</span>
                <span className="text-[10px] font-mono text-muted-foreground w-6 text-right">{f.count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Momentum & Pattern Radar ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Momentum */}
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Momentum</h3>
            <Tip text="Compares odd digit ratio between recent 25 ticks and previous 25 ticks to detect shifts.">
              <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
            </Tip>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className={`flex items-center gap-1 text-sm font-bold ${momentum.direction === "Odd Rising" ? "text-buy" : momentum.direction === "Even Rising" ? "text-sell" : "text-muted-foreground"}`}>
              {momentum.direction === "Odd Rising" ? <ArrowUp className="w-4 h-4" /> : momentum.direction === "Even Rising" ? <ArrowDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
              {momentum.direction}
            </div>
            <span className="text-xs text-muted-foreground">{momentum.score.toFixed(0)}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <motion.div className={`h-full rounded-full ${momentum.score > 50 ? "bg-buy" : "bg-primary/40"}`} animate={{ width: `${momentum.score}%` }} transition={{ duration: 0.3 }} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">Odd: {momentum.oddPct.toFixed(0)}% | Even: {(100 - momentum.oddPct).toFixed(0)}%</p>
        </div>

        {/* Pattern Radar */}
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Scan className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Pattern Radar</h3>
            <Tip text="Detects recurring digit structures: double digits, alternating odd/even, and high/low clusters.">
              <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
            </Tip>
          </div>
          <div className="space-y-2">
            {patterns.map(p => (
              <div key={p.name} className="flex items-center gap-2">
                <span className="text-[10px] text-foreground w-20">{p.name}</span>
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div className={`h-full rounded-full ${p.status === "Strong" || p.status === "Active" ? "bg-buy" : p.status === "Moderate" ? "bg-warning" : "bg-muted-foreground/30"}`} animate={{ width: `${p.strength}%` }} transition={{ duration: 0.3 }} />
                </div>
                <span className={`text-[9px] font-bold w-14 text-right ${p.status === "Strong" || p.status === "Active" ? "text-buy" : p.status === "Moderate" ? "text-warning" : "text-muted-foreground"}`}>{p.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Thresholds ── */}
      <div className="p-4 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-semibold text-foreground">Thresholds & Distribution</span>
          <Tip text="Set Over/Under thresholds to analyze how often digits fall above or below your chosen values.">
            <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
          </Tip>
        </div>
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Over:</span>
            <select value={overThreshold} onChange={e => setOverThreshold(parseInt(e.target.value))} className="px-2 py-1 bg-secondary border border-border rounded text-xs text-foreground">
              {[0,1,2,3,4,5,6,7,8].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Under:</span>
            <select value={underThreshold} onChange={e => setUnderThreshold(parseInt(e.target.value))} className="px-2 py-1 bg-secondary border border-border rounded text-xs text-foreground">
              {[1,2,3,4,5,6,7,8,9].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Window:</span>
            <input type="number" value={tickCount} onChange={e => setTickCount(Math.max(10, Math.min(1000, parseInt(e.target.value) || 100)))} className="w-16 px-2 py-1 bg-secondary border border-border rounded text-xs font-mono text-foreground" />
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <span className="text-buy font-bold">Over: {overPct}%</span>
          <span className="flex-1" />
          <span className="text-sell font-bold">Under: {underPct}%</span>
        </div>
        <div className="h-4 rounded-full overflow-hidden flex bg-secondary">
          <div className="h-full bg-buy transition-all" style={{ width: `${overPct}%` }} />
          <div className="h-full bg-sell transition-all" style={{ width: `${underPct}%` }} />
        </div>
        <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
          <span>Max Over Streak: <strong className="text-foreground">{streaks.maxOver}</strong></span>
          <span>Max Under Streak: <strong className="text-foreground">{streaks.maxUnder}</strong></span>
        </div>
      </div>

      {/* ── Pattern Grid ── */}
      <div className="p-4 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-semibold text-foreground">Pattern Grid</span>
          <Tip text="Each circle represents a tick. O = Over threshold, U = Under threshold, N = Neutral. Shows visual flow of market behavior.">
            <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
          </Tip>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-buy/20 text-buy font-bold ml-auto">Latest</span>
        </div>
        <div className="flex flex-wrap gap-[3px]">
          {patternCells.slice(-100).reverse().map((p, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.1, delay: i * 0.003 }}
              className={`w-[22px] h-[22px] rounded-full flex items-center justify-center text-[8px] font-bold border ${
                p === "O" ? "bg-buy/10 text-buy border-buy/30" : p === "U" ? "bg-sell/10 text-sell border-sell/30" : "bg-secondary text-muted-foreground border-border"
              }`}
            >
              {p}
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Common Sequences ── */}
      <div className="p-4 rounded-xl bg-card border border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">Common {seqLength}-Cell Sequences</span>
            <Tip text="Shows the most frequently occurring patterns of Over/Under/Neutral sequences. Helps predict next movements.">
              <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
            </Tip>
          </div>
          <select value={seqLength} onChange={e => setSeqLength(parseInt(e.target.value))} className="px-2 py-1 bg-secondary border border-border rounded text-xs text-foreground">
            {[2, 3, 4, 5].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div className="flex items-end gap-2 h-48">
          {sequences.map(([seq, count], i) => {
            const heightPct = (count / maxSeqCount) * 100;
            return (
              <div key={seq} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] text-muted-foreground font-mono">{count}</span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPct}%` }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className={`w-full rounded-t ${count === maxSeqCount ? "bg-primary" : "bg-primary/40"}`}
                  style={{ minHeight: 4 }}
                />
                <span className="text-[8px] text-muted-foreground font-mono mt-1">{seq}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DATTab;
