import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity, Target, TrendingUp, TrendingDown, Zap, RefreshCw, Minus,
  ChevronDown, ArrowLeft, BarChart3, Gauge, Scan, Eye, Brain, Shield,
  Flame, Filter,
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip as ReTooltip, ResponsiveContainer, Legend } from "recharts";
import { MARKET_CATEGORIES, VOLATILITY_MARKETS, type MarketItem } from "@/lib/trading-constants";

const DERIV_WS_URL = "wss://ws.derivws.com/websockets/v3";
const APP_ID = "129344";

// Build flat scan list from all categories
const ALL_SCAN_MARKETS: MarketItem[] = VOLATILITY_MARKETS;

interface TickEntry { quote: number; digit: number; epoch: number; }

interface MarketData {
  symbol: string;
  label: string;
  category: string;
  ticks: TickEntry[];
  digits: number[];
  confluenceScore: number;
  suggestedBias: string;
  evenPct: number;
  oddPct: number;
  highPct: number;
  lowPct: number;
  tickSpeed: number;
  volatilityLevel: "Low" | "Moderate" | "High" | "Extreme";
  volatilityValue: number;
  patternStrength: number;
  patternDesc: string;
  momentumBias: string;
  opportunityLevel: "Low" | "Moderate" | "Good" | "High" | "Extreme";
  lastQuote: number | null;
  imbalance: number;
  aggressiveSignal: boolean;
  balancedSignal: boolean;
}

// ── Analysis ──────────────────────────────────────────────────────
function analyzeMarket(ticks: TickEntry[], digits: number[]): Partial<MarketData> {
  const len = digits.length;
  if (len < 30) return { confluenceScore: 0, opportunityLevel: "Low", aggressiveSignal: false, balancedSignal: false };

  const evenCount = digits.filter(x => x % 2 === 0).length;
  const evenPct = (evenCount / len) * 100;
  const oddPct = 100 - evenPct;
  const highCount = digits.filter(x => x >= 5).length;
  const highPct = (highCount / len) * 100;
  const lowPct = 100 - highPct;

  const freq = new Array(10).fill(0);
  digits.forEach(x => freq[x]++);
  let maxDev = 0;
  freq.forEach(c => { maxDev = Math.max(maxDev, Math.abs((c / len) * 100 - 10)); });
  const imbalance = Math.min(maxDev * 3, 100);

  let volSum = 0;
  for (let i = 1; i < Math.min(ticks.length, 100); i++) {
    volSum += Math.abs(ticks[ticks.length - i].quote - ticks[ticks.length - i - 1].quote);
  }
  const volAvg = ticks.length > 1 ? volSum / Math.min(ticks.length - 1, 99) : 0;
  const volNorm = Math.min(volAvg * 1000, 100);
  const volatilityLevel: MarketData["volatilityLevel"] =
    volNorm >= 75 ? "Extreme" : volNorm >= 50 ? "High" : volNorm >= 25 ? "Moderate" : "Low";

  let tickSpeed = 0;
  if (ticks.length >= 3) {
    const now = ticks[ticks.length - 1].epoch;
    const count5 = ticks.filter(t => t.epoch > now - 5).length;
    tickSpeed = +(count5 / 5).toFixed(1);
  }

  let momentumBias = "Neutral";
  if (len >= 50) {
    const recent = digits.slice(-25);
    const older = digits.slice(-50, -25);
    const recentOdd = recent.filter(x => x % 2 !== 0).length;
    const olderOdd = older.filter(x => x % 2 !== 0).length;
    if (recentOdd > olderOdd + 2) momentumBias = "Odd Rising";
    else if (recentOdd < olderOdd - 2) momentumBias = "Even Rising";
    else momentumBias = "Stable";
  }

  let patternStrength = 0;
  let patternDesc = "None";
  const d = digits;
  let maxStreak = 1, curStreak = 1;
  for (let i = d.length - 1; i > Math.max(0, d.length - 100); i--) {
    if (d[i] === d[i - 1]) { curStreak++; maxStreak = Math.max(maxStreak, curStreak); } else curStreak = 1;
  }
  if (maxStreak >= 3) { patternStrength = Math.min(maxStreak * 20, 100); patternDesc = `Streak x${maxStreak}`; }
  if (patternStrength < 50 && len >= 50) {
    const pairs = new Map<string, number>();
    for (let i = d.length - 50; i < d.length - 1; i++) {
      const key = `${d[i]}-${d[i + 1]}`;
      pairs.set(key, (pairs.get(key) || 0) + 1);
    }
    let maxPairCount = 0;
    let maxPair = "";
    pairs.forEach((v, k) => { if (v > maxPairCount) { maxPairCount = v; maxPair = k; } });
    if (maxPairCount >= 4) {
      patternStrength = Math.max(patternStrength, Math.min(maxPairCount * 15, 100));
      patternDesc = `Pair ${maxPair} (x${maxPairCount})`;
    }
  }
  if (patternStrength < 40 && len >= 20) {
    const last20 = d.slice(-20);
    let altCount = 0;
    for (let i = 1; i < last20.length; i++) {
      if ((last20[i] % 2) !== (last20[i - 1] % 2)) altCount++;
    }
    if (altCount >= 15) { patternStrength = Math.max(patternStrength, 60); patternDesc = "Alternating"; }
  }

  const confluenceScore = Math.min(Math.round(
    imbalance * 0.25 +
    (Math.abs(oddPct - 50) * 2) * 0.20 +
    patternStrength * 0.20 +
    volNorm * 0.15 +
    Math.min(tickSpeed * 15, 100) * 0.10 +
    (len >= 100 ? Math.max(...freq.map(c => (c / len) * 100)) : 10) * 0.10
  ), 100);

  const freqScore = Math.min(maxDev / 10, 1);
  const aggressiveSignal = freqScore >= 0.05;
  const balancedSignal = freqScore >= 0.15;

  const suggestedBias = oddPct > 55 ? "ODD" : evenPct > 55 ? "EVEN" : highPct > 55 ? "HIGH" : lowPct > 55 ? "LOW" : "NEUTRAL";
  const opportunityLevel: MarketData["opportunityLevel"] =
    confluenceScore >= 80 ? "Extreme" : confluenceScore >= 65 ? "High" : confluenceScore >= 50 ? "Good" : confluenceScore >= 35 ? "Moderate" : "Low";

  return {
    confluenceScore, suggestedBias, evenPct, oddPct, highPct, lowPct,
    tickSpeed, volatilityLevel, volatilityValue: volNorm,
    patternStrength, patternDesc, momentumBias, opportunityLevel, imbalance,
    aggressiveSignal, balancedSignal,
  };
}

// ── Color helpers ─────────────────────────────────────────────────
const oppColor = (level: string) => {
  switch (level) {
    case "Extreme": case "High": return "text-buy";
    case "Good": return "text-warning";
    case "Moderate": return "text-primary";
    default: return "text-muted-foreground";
  }
};
const oppBg = (level: string) => {
  switch (level) {
    case "Extreme": case "High": return "bg-buy/10 border-buy/20";
    case "Good": return "bg-warning/10 border-warning/20";
    default: return "bg-secondary border-border";
  }
};
const oppEmoji = (level: string) => {
  switch (level) { case "Extreme": case "High": return "🔥"; case "Good": return "⚡"; case "Moderate": return "📊"; default: return "💤"; }
};

const PIE_COLORS = [
  "hsl(142, 76%, 36%)", "hsl(48, 96%, 53%)", "hsl(217, 91%, 60%)",
  "hsl(0, 84%, 60%)", "hsl(280, 67%, 52%)", "hsl(190, 95%, 39%)",
  "hsl(25, 95%, 53%)", "hsl(330, 81%, 60%)",
];

// ── Deep Analysis Panel ───────────────────────────────────────────
const DeepAnalysisPanel = ({ market, onClose }: { market: MarketData; onClose: () => void }) => {
  const d = market.digits;
  const len = d.length;

  const freq = useMemo(() => {
    const f = new Array(10).fill(0);
    d.forEach(x => f[x]++);
    return f.map((c, i) => ({ digit: i, count: c, pct: len > 0 ? +((c / len) * 100).toFixed(1) : 0 }));
  }, [d, len]);

  const prob = useMemo(() => {
    const recent = d.slice(-300);
    const total = recent.length;
    const f = new Array(10).fill(0);
    recent.forEach(x => f[x]++);
    return f.map((c, i) => ({ digit: i, pct: total > 0 ? +((c / total) * 100).toFixed(1) : 10 }));
  }, [d]);

  const maxProb = useMemo(() => prob.reduce((a, b) => b.pct > a.pct ? b : a, prob[0]), [prob]);
  const minProb = useMemo(() => prob.reduce((a, b) => b.pct < a.pct ? b : a, prob[0]), [prob]);

  const cycle = useMemo(() => {
    if (d.length < 50) return { type: "None", strength: 0, seq: "" };
    const last50 = d.slice(-50);
    const oddSeq = last50.filter(x => x % 2 !== 0);
    const evenSeq = last50.filter(x => x % 2 === 0);
    const oddCycle = [1, 3, 5, 7, 9];
    const evenCycle = [0, 2, 4, 6, 8];
    let oddCycleMatch = 0, evenCycleMatch = 0;
    for (let i = 0; i < oddSeq.length; i++) if (oddSeq[i] === oddCycle[i % 5]) oddCycleMatch++;
    for (let i = 0; i < evenSeq.length; i++) if (evenSeq[i] === evenCycle[i % 5]) evenCycleMatch++;
    const oddStr = oddSeq.length > 0 ? (oddCycleMatch / oddSeq.length) * 100 : 0;
    const evenStr = evenSeq.length > 0 ? (evenCycleMatch / evenSeq.length) * 100 : 0;
    if (oddStr > evenStr && oddStr > 30) return { type: "Odd rotation", strength: Math.round(oddStr), seq: "1→3→5→7→9" };
    if (evenStr > 30) return { type: "Even rotation", strength: Math.round(evenStr), seq: "0→2→4→6→8" };
    return { type: "None", strength: 0, seq: "" };
  }, [d]);

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }} className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onClose} className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
          <ArrowLeft className="w-4 h-4 text-foreground" />
        </button>
        <div className="flex-1">
          <h3 className="text-base font-bold text-foreground">{market.label}</h3>
          <p className="text-[10px] text-muted-foreground">{market.symbol} • {market.category} • {market.digits.length} ticks</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold ${oppBg(market.opportunityLevel)} border`}>
          {oppEmoji(market.opportunityLevel)} {market.opportunityLevel}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: "Confluence", value: `${market.confluenceScore}%`, color: oppColor(market.opportunityLevel) },
          { label: "Volatility", value: market.volatilityLevel, color: market.volatilityLevel === "Extreme" || market.volatilityLevel === "High" ? "text-sell" : "text-foreground" },
          { label: "Speed", value: `${market.tickSpeed} t/s`, color: "text-foreground" },
          { label: "Bias", value: market.suggestedBias, color: "text-buy" },
          { label: "Aggressive", value: market.aggressiveSignal ? "SIGNAL" : "Idle", color: market.aggressiveSignal ? "text-sell" : "text-muted-foreground" },
          { label: "Balanced", value: market.balancedSignal ? "SIGNAL" : "Idle", color: market.balancedSignal ? "text-buy" : "text-muted-foreground" },
        ].map(s => (
          <div key={s.label} className="p-3 rounded-xl bg-card border border-border text-center">
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-semibold text-foreground">Digit Distribution</h4>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {freq.map(f => (
              <div key={f.digit} className={`p-2 rounded-lg text-center ${f.pct > 12 ? "bg-buy/10 border border-buy/20" : f.pct < 8 ? "bg-sell/10 border border-sell/20" : "bg-secondary"}`}>
                <p className="text-xs font-bold text-foreground">{f.digit}</p>
                <p className="text-[10px] text-muted-foreground">{f.count}</p>
                <p className={`text-[9px] font-bold ${f.pct > 12 ? "text-buy" : f.pct < 8 ? "text-sell" : "text-muted-foreground"}`}>{f.pct}%</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-semibold text-foreground">Momentum & Pressure</h4>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-[10px] text-muted-foreground mb-1">Momentum</p>
              <p className="text-sm font-bold text-foreground flex items-center gap-1">
                {market.momentumBias.includes("Rising") ? <TrendingUp className="w-3 h-3 text-buy" /> : market.momentumBias === "Stable" ? <Minus className="w-3 h-3" /> : <TrendingDown className="w-3 h-3 text-sell" />}
                {market.momentumBias}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground mb-1">Even / Odd</p>
              <div className="flex gap-1 h-3 rounded-full overflow-hidden">
                <div className="bg-primary rounded-l-full" style={{ width: `${market.evenPct}%` }} />
                <div className="bg-warning rounded-r-full" style={{ width: `${market.oddPct}%` }} />
              </div>
              <div className="flex justify-between text-[9px] mt-0.5">
                <span className="text-primary">Even {market.evenPct.toFixed(0)}%</span>
                <span className="text-warning">Odd {market.oddPct.toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Scan className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-semibold text-foreground">Pattern Detection</h4>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-full border-4 border-border flex items-center justify-center">
              <span className={`text-lg font-bold ${market.patternStrength >= 50 ? "text-buy" : "text-muted-foreground"}`}>{market.patternStrength}%</span>
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{market.patternDesc}</p>
              <p className="text-[10px] text-muted-foreground">
                {market.patternStrength >= 60 ? "Strong pattern detected" : market.patternStrength >= 30 ? "Moderate activity" : "No significant patterns"}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-3">
            <RefreshCw className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-semibold text-foreground">Cycle Detection</h4>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-full border-4 border-border flex items-center justify-center">
              <span className={`text-lg font-bold ${cycle.strength >= 40 ? "text-buy" : "text-muted-foreground"}`}>{cycle.strength}%</span>
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{cycle.type}</p>
              {cycle.seq && <p className="text-[10px] text-primary font-mono">{cycle.seq}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-primary" />
          <h4 className="text-sm font-semibold text-foreground">Probability Projection</h4>
          <span className="text-[10px] text-muted-foreground ml-auto">Last {Math.min(d.length, 300)} ticks</span>
        </div>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {prob.map(p => (
            <div key={p.digit} className={`p-2 rounded-lg text-center ${p.digit === maxProb.digit ? "bg-buy/15 border border-buy/30" : p.digit === minProb.digit ? "bg-sell/15 border border-sell/30" : "bg-secondary"}`}>
              <p className="text-xs font-bold text-foreground">{p.digit}</p>
              <p className={`text-[10px] font-bold ${p.digit === maxProb.digit ? "text-buy" : p.digit === minProb.digit ? "text-sell" : "text-muted-foreground"}`}>{p.pct}%</p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          Digit <span className="text-buy font-bold">{maxProb.digit}</span> elevated ({maxProb.pct}%) •
          Digit <span className="text-sell font-bold">{minProb.digit}</span> underrepresented ({minProb.pct}%)
        </p>
      </div>
    </motion.div>
  );
};

// ── Confluence Pie Chart ──────────────────────────────────────────
const ConfluencePieChart = ({
  markets,
  highlightSymbol,
  onSliceClick,
}: {
  markets: MarketData[];
  highlightSymbol: string | null;
  onSliceClick: (symbol: string) => void;
}) => {
  const data = useMemo(() =>
    markets
      .filter(m => m.digits.length > 30 && m.confluenceScore > 0)
      .sort((a, b) => b.confluenceScore - a.confluenceScore)
      .slice(0, 12)
      .map(m => ({
        name: m.label,
        symbol: m.symbol,
        value: m.confluenceScore,
        opportunity: m.opportunityLevel,
        bias: m.suggestedBias,
        aggressive: m.aggressiveSignal,
        balanced: m.balancedSignal,
      })),
    [markets]
  );

  if (data.length === 0) return null;

  const getColor = (entry: typeof data[0], i: number) => {
    if (entry.opportunity === "Extreme" || entry.opportunity === "High") return "hsl(142, 76%, 36%)";
    if (entry.opportunity === "Good") return "hsl(48, 96%, 53%)";
    if (entry.opportunity === "Moderate") return "hsl(217, 91%, 60%)";
    return "hsl(215, 20%, 45%)";
  };

  return (
    <div className="p-4 rounded-xl bg-card border border-border">
      <div className="flex items-center gap-2 mb-3">
        <Eye className="w-4 h-4 text-primary" />
        <h4 className="text-sm font-semibold text-foreground">Market Confluence Distribution</h4>
      </div>
      <div className="flex flex-col md:flex-row items-center gap-4">
        <ResponsiveContainer width="100%" height={260} className="md:max-w-[300px]">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={100}
              innerRadius={45}
              dataKey="value"
              nameKey="name"
              paddingAngle={2}
              onClick={(_, i) => onSliceClick(data[i].symbol)}
              style={{ cursor: "pointer" }}
            >
              {data.map((entry, i) => (
                <Cell
                  key={entry.symbol}
                  fill={getColor(entry, i)}
                  stroke={entry.symbol === highlightSymbol ? "hsl(var(--foreground))" : "transparent"}
                  strokeWidth={entry.symbol === highlightSymbol ? 3 : 0}
                  opacity={highlightSymbol && entry.symbol !== highlightSymbol ? 0.4 : 1}
                />
              ))}
            </Pie>
            <ReTooltip
              content={({ payload }) => {
                if (!payload || payload.length === 0) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-xs">
                    <p className="font-bold text-foreground">{d.name}</p>
                    <p className="text-muted-foreground">Confluence: <span className="text-foreground font-bold">{d.value}%</span></p>
                    <p className="text-muted-foreground">Bias: <span className="text-primary font-bold">{d.bias}</span></p>
                    <div className="flex gap-2 mt-1">
                      {d.aggressive && <span className="text-[9px] px-1.5 py-0.5 rounded bg-sell/10 text-sell font-bold">Aggressive</span>}
                      {d.balanced && <span className="text-[9px] px-1.5 py-0.5 rounded bg-buy/10 text-buy font-bold">Balanced</span>}
                    </div>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-1.5 w-full max-h-[250px] overflow-y-auto">
          {data.map((m, i) => (
            <button
              key={m.symbol}
              onClick={() => onSliceClick(m.symbol)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all ${
                m.symbol === highlightSymbol ? "bg-primary/10 border border-primary/30" : "hover:bg-secondary"
              }`}
            >
              <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: getColor(m, i) }} />
              <span className="text-[10px] text-foreground font-medium flex-1 truncate">{m.name}</span>
              <span className={`text-[10px] font-bold ${oppColor(m.opportunity)}`}>{m.value}%</span>
              {m.aggressive && <Flame className="w-3 h-3 text-sell" />}
              {m.balanced && <Shield className="w-3 h-3 text-buy" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Opportunity Radar SVG ─────────────────────────────────────────
const OpportunityRadar = ({ markets }: { markets: MarketData[] }) => {
  const top5 = useMemo(() =>
    [...markets].filter(m => m.digits.length > 30).sort((a, b) => b.confluenceScore - a.confluenceScore).slice(0, 5),
    [markets]
  );

  if (top5.length === 0) return null;

  const axes = ["Volatility", "Imbalance", "Momentum", "Pattern", "Speed"];
  const cx = 130, cy = 130, r = 100;
  const angleStep = (2 * Math.PI) / axes.length;
  const colors = ["hsl(var(--buy))", "hsl(var(--warning))", "hsl(var(--primary))", "hsl(var(--sell))", "hsl(var(--muted-foreground))"];

  return (
    <div className="p-4 rounded-xl bg-card border border-border">
      <div className="flex items-center gap-2 mb-3">
        <Eye className="w-4 h-4 text-primary" />
        <h4 className="text-sm font-semibold text-foreground">Opportunity Radar</h4>
      </div>
      <div className="flex flex-col md:flex-row items-center gap-4">
        <svg viewBox="0 0 260 260" className="w-56 h-56 shrink-0">
          {[0.25, 0.5, 0.75, 1].map(ring => (
            <polygon key={ring}
              points={axes.map((_, i) => {
                const a = i * angleStep - Math.PI / 2;
                return `${cx + ring * r * Math.cos(a)},${cy + ring * r * Math.sin(a)}`;
              }).join(" ")}
              className="fill-none stroke-border" strokeWidth={0.5}
            />
          ))}
          {axes.map((_, i) => {
            const a = i * angleStep - Math.PI / 2;
            return <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)} className="stroke-border" strokeWidth={0.5} />;
          })}
          {top5.map((m, mi) => {
            const values = [m.volatilityValue / 100, m.imbalance / 100, Math.abs(m.oddPct - 50) / 50, m.patternStrength / 100, Math.min(m.tickSpeed / 3, 1)];
            const pts = values.map((v, i) => {
              const a = i * angleStep - Math.PI / 2;
              return `${cx + v * r * Math.cos(a)},${cy + v * r * Math.sin(a)}`;
            }).join(" ");
            return <polygon key={m.symbol} points={pts} fill={colors[mi]} fillOpacity={0.12} stroke={colors[mi]} strokeWidth={1.5} strokeOpacity={0.7} />;
          })}
          {axes.map((label, i) => {
            const a = i * angleStep - Math.PI / 2;
            return <text key={label} x={cx + (r + 16) * Math.cos(a)} y={cy + (r + 16) * Math.sin(a)} textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground text-[8px]">{label}</text>;
          })}
        </svg>
        <div className="flex-1 space-y-2 w-full">
          {top5.map((m, i) => (
            <div key={m.symbol} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: colors[i] }} />
              <span className="text-[10px] text-foreground font-medium flex-1">{m.label}</span>
              <span className={`text-[10px] font-bold ${oppColor(m.opportunityLevel)}`}>{m.confluenceScore}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Main Market Scanner View ──────────────────────────────────────
const MarketScannerView = () => {
  const [scanning, setScanning] = useState(false);
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [highlightedSlice, setHighlightedSlice] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"confluence" | "volatility" | "speed">("confluence");
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const wsRefs = useRef<WebSocket[]>([]);
  const dataRef = useRef<Map<string, { ticks: TickEntry[]; digits: number[]; lastQuote: number | null }>>(new Map());
  const uiIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Build category lookup
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    MARKET_CATEGORIES.forEach(c => c.markets.forEach(m => map.set(m.symbol, c.category)));
    return map;
  }, []);

  const emptyMarket = useCallback((m: MarketItem): MarketData => ({
    symbol: m.symbol, label: m.label, category: categoryMap.get(m.symbol) || "",
    ticks: [], digits: [], confluenceScore: 0, suggestedBias: "-", evenPct: 50, oddPct: 50,
    highPct: 50, lowPct: 50, tickSpeed: 0, volatilityLevel: "Low", volatilityValue: 0,
    patternStrength: 0, patternDesc: "None", momentumBias: "Neutral",
    opportunityLevel: "Low", lastQuote: null, imbalance: 0,
    aggressiveSignal: false, balancedSignal: false,
  }), [categoryMap]);

  const [markets, setMarkets] = useState<MarketData[]>(() => ALL_SCAN_MARKETS.map(m => emptyMarket(m)));

  const startScan = useCallback(() => {
    stopScan();
    setScanning(true);

    ALL_SCAN_MARKETS.forEach(m => {
      const socket = new WebSocket(`${DERIV_WS_URL}?app_id=${APP_ID}`);
      wsRefs.current.push(socket);
      dataRef.current.set(m.symbol, { ticks: [], digits: [], lastQuote: null });

      socket.onopen = () => {
        socket.send(JSON.stringify({ ticks: m.symbol, subscribe: 1 }));
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.tick && typeof data.tick.quote === "number") {
            const quote = data.tick.quote;
            const qStr = quote.toString();
            const digit = parseInt(qStr.charAt(qStr.length - 1), 10);
            const epoch = data.tick.epoch || Date.now() / 1000;
            const existing = dataRef.current.get(m.symbol);
            if (!existing) return;
            existing.ticks = [...existing.ticks.slice(-499), { quote, digit, epoch }];
            existing.digits = [...existing.digits.slice(-499), digit];
            existing.lastQuote = quote;
          }
        } catch {}
      };
      socket.onerror = () => {};
    });

    uiIntervalRef.current = setInterval(() => {
      setMarkets(ALL_SCAN_MARKETS.map(m => {
        const raw = dataRef.current.get(m.symbol);
        if (!raw) return emptyMarket(m);
        const analysis = analyzeMarket(raw.ticks, raw.digits);
        return { ...emptyMarket(m), ticks: raw.ticks, digits: raw.digits, lastQuote: raw.lastQuote, ...analysis };
      }));
    }, 3000);
  }, [emptyMarket]);

  const stopScan = useCallback(() => {
    wsRefs.current.forEach(ws => { try { ws.close(); } catch {} });
    wsRefs.current = [];
    if (uiIntervalRef.current) clearInterval(uiIntervalRef.current);
    uiIntervalRef.current = null;
    setScanning(false);
  }, []);

  useEffect(() => () => stopScan(), []);

  const bestMarket = useMemo(() =>
    markets.reduce((best, m) =>
      m.confluenceScore > (best?.confluenceScore || 0) && m.digits.length > 30 ? m : best,
      markets[0]
    ), [markets]);

  const filteredMarkets = useMemo(() => {
    let list = markets;
    if (filterCategory !== "All") list = list.filter(m => m.category === filterCategory);
    const sorted = [...list];
    if (sortBy === "confluence") sorted.sort((a, b) => b.confluenceScore - a.confluenceScore);
    else if (sortBy === "volatility") sorted.sort((a, b) => b.volatilityValue - a.volatilityValue);
    else sorted.sort((a, b) => b.tickSpeed - a.tickSpeed);
    return sorted;
  }, [markets, sortBy, filterCategory]);

  const selectedData = useMemo(() => selectedMarket ? markets.find(m => m.symbol === selectedMarket) : null, [markets, selectedMarket]);

  const handleSliceClick = (symbol: string) => {
    setHighlightedSlice(prev => prev === symbol ? null : symbol);
  };

  const handleRowClick = (symbol: string, hasData: boolean) => {
    if (hasData) setSelectedMarket(symbol);
    setHighlightedSlice(symbol);
  };

  const categories = useMemo(() => ["All", ...MARKET_CATEGORIES.map(c => c.category)], []);

  return (
    <div className="p-4 lg:p-6 overflow-y-auto h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Deep Market Scanner</h2>
          {scanning && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-buy/10 text-buy border border-buy/20 animate-pulse">
              LIVE • {ALL_SCAN_MARKETS.length} markets
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {scanning && (
            <>
              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="text-[10px] px-2 py-1 rounded-lg bg-secondary border border-border text-foreground"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="text-[10px] px-2 py-1 rounded-lg bg-secondary border border-border text-foreground"
              >
                <option value="confluence">Sort: Confluence</option>
                <option value="volatility">Sort: Volatility</option>
                <option value="speed">Sort: Speed</option>
              </select>
            </>
          )}
          <button
            onClick={scanning ? stopScan : startScan}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              scanning ? "bg-sell/10 text-sell border border-sell/30 hover:bg-sell/20" : "bg-buy/10 text-buy border border-buy/30 hover:bg-buy/20"
            }`}
          >
            {scanning ? <><RefreshCw className="w-3 h-3 animate-spin" /> Stop Scan</> : <><Zap className="w-3 h-3" /> Start Scan</>}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {selectedData && selectedData.digits.length > 30 ? (
          <DeepAnalysisPanel key="detail" market={selectedData} onClose={() => setSelectedMarket(null)} />
        ) : (
          <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Best Opportunity */}
            {scanning && bestMarket && bestMarket.digits.length > 30 && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-xl border cursor-pointer ${oppBg(bestMarket.opportunityLevel)}`}
                onClick={() => handleRowClick(bestMarket.symbol, true)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-buy" />
                  <h3 className="text-sm font-bold text-buy">Best Market Detected</h3>
                </div>
                <div className="flex flex-wrap items-center gap-6">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Market</p>
                    <p className="text-sm font-bold text-foreground">{bestMarket.label}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Signal</p>
                    <p className="text-sm font-bold text-buy">{bestMarket.suggestedBias}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Confluence</p>
                    <p className="text-sm font-bold text-buy">{bestMarket.confluenceScore}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Strategies</p>
                    <div className="flex gap-1">
                      {bestMarket.aggressiveSignal && <span className="text-[9px] px-1.5 py-0.5 rounded bg-sell/10 text-sell font-bold">AGG</span>}
                      {bestMarket.balancedSignal && <span className="text-[9px] px-1.5 py-0.5 rounded bg-buy/10 text-buy font-bold">BAL</span>}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Level</p>
                    <p className={`text-sm font-bold ${oppColor(bestMarket.opportunityLevel)}`}>{oppEmoji(bestMarket.opportunityLevel)} {bestMarket.opportunityLevel}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Pie Chart */}
            {scanning && markets.some(m => m.digits.length > 30) && (
              <ConfluencePieChart
                markets={markets}
                highlightSymbol={highlightedSlice}
                onSliceClick={handleSliceClick}
              />
            )}

            {/* Market Table */}
            {scanning && (
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-secondary/50 text-muted-foreground">
                        <th className="text-left px-3 py-2 font-semibold">Market</th>
                        <th className="text-center px-2 py-2 font-semibold">Price</th>
                        <th className="text-center px-2 py-2 font-semibold">Digit</th>
                        <th className="text-center px-2 py-2 font-semibold">Momentum</th>
                        <th className="text-center px-2 py-2 font-semibold">Confluence</th>
                        <th className="text-center px-2 py-2 font-semibold">Aggressive</th>
                        <th className="text-center px-2 py-2 font-semibold">Balanced</th>
                        <th className="text-center px-2 py-2 font-semibold">Level</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMarkets.map(m => (
                        <tr
                          key={m.symbol}
                          className={`border-t border-border hover:bg-secondary/30 transition-colors cursor-pointer ${
                            m.symbol === highlightedSlice ? "bg-primary/5 ring-1 ring-primary/20" :
                            m.symbol === bestMarket?.symbol && m.confluenceScore > 30 ? "bg-buy/5" : ""
                          }`}
                          onClick={() => handleRowClick(m.symbol, m.digits.length > 30)}
                        >
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-foreground">{m.label}</span>
                              {m.digits.length > 0 && <span className="text-[9px] text-muted-foreground">{m.digits.length}t</span>}
                            </div>
                            <span className="text-[8px] text-muted-foreground">{m.category}</span>
                          </td>
                          <td className="text-center px-2 py-2.5 font-mono text-foreground text-[10px]">
                            {m.lastQuote !== null ? m.lastQuote : "—"}
                          </td>
                          <td className="text-center px-2 py-2.5 font-mono font-bold text-primary">
                            {m.digits.length > 0 ? m.digits[m.digits.length - 1] : "—"}
                          </td>
                          <td className="text-center px-2 py-2.5">
                            {m.digits.length > 30 ? (
                              <span className={`flex items-center justify-center gap-0.5 ${
                                m.momentumBias.includes("Rising") ? "text-buy" : m.momentumBias === "Stable" ? "text-muted-foreground" : "text-sell"
                              }`}>
                                {m.momentumBias.includes("Odd") ? <TrendingUp className="w-3 h-3" /> :
                                 m.momentumBias.includes("Even") ? <TrendingDown className="w-3 h-3" /> :
                                 <Minus className="w-3 h-3" />}
                                <span className="text-[9px]">{m.momentumBias}</span>
                              </span>
                            ) : "—"}
                          </td>
                          <td className="text-center px-2 py-2.5">
                            <span className={`font-bold ${oppColor(m.opportunityLevel)}`}>
                              {m.digits.length > 30 ? `${m.confluenceScore}%` : "—"}
                            </span>
                          </td>
                          <td className="text-center px-2 py-2.5">
                            {m.digits.length > 30 ? (
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${m.aggressiveSignal ? "bg-sell/10 text-sell" : "text-muted-foreground"}`}>
                                {m.aggressiveSignal ? "YES" : "NO"}
                              </span>
                            ) : "—"}
                          </td>
                          <td className="text-center px-2 py-2.5">
                            {m.digits.length > 30 ? (
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${m.balancedSignal ? "bg-buy/10 text-buy" : "text-muted-foreground"}`}>
                                {m.balancedSignal ? "YES" : "NO"}
                              </span>
                            ) : "—"}
                          </td>
                          <td className="text-center px-2 py-2.5">
                            {m.digits.length > 30 ? (
                              <span className={`text-[10px] font-bold ${oppColor(m.opportunityLevel)}`}>
                                {oppEmoji(m.opportunityLevel)} {m.opportunityLevel}
                              </span>
                            ) : (
                              <RefreshCw className="w-3 h-3 animate-spin text-muted-foreground mx-auto" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Opportunity Radar */}
            {scanning && markets.some(m => m.digits.length > 30) && (
              <OpportunityRadar markets={markets} />
            )}

            {/* Empty state */}
            {!scanning && (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground mb-1">
                  Click <span className="text-buy font-bold">Start Scan</span> to analyze <span className="font-bold text-foreground">{ALL_SCAN_MARKETS.length}</span> markets simultaneously
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Scans all Volatility, Jump, Crash/Boom, Step, Range Break, Drift Switch & DEX indices
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MarketScannerView;
