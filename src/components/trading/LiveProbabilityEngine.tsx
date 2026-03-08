import { useMemo, useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target, TrendingUp, TrendingDown, Minus, AlertTriangle,
  Activity, BarChart3, Zap, Eye, Brain, Gauge
} from "lucide-react";

interface TickData {
  quote: number;
  digit: number;
  epoch: number;
}

interface LiveProbabilityEngineProps {
  lastDigits: number[];
  tickBuffer: TickData[];
}

const LiveProbabilityEngine = ({ lastDigits, tickBuffer }: LiveProbabilityEngineProps) => {
  // Short-term (50) and long-term (300) probabilities
  const { shortTerm, longTerm, top3, rareDigits, oddBias, evenBias, highBias, lowBias, momentum } = useMemo(() => {
    const short = lastDigits.slice(-50);
    const long = lastDigits.slice(-300);

    const calcProb = (digits: number[]) => {
      const freq = new Array(10).fill(0);
      digits.forEach(d => freq[d]++);
      return freq.map((c, i) => ({ digit: i, pct: digits.length > 0 ? (c / digits.length) * 100 : 10 }));
    };

    const st = calcProb(short);
    const lt = calcProb(long);

    // Top 3 predictions
    const sorted = [...lt].sort((a, b) => b.pct - a.pct);
    const t3 = sorted.slice(0, 3);

    // Rare digit detection (not seen in last 20 ticks)
    const last20 = new Set(lastDigits.slice(-20));
    const rare = [0,1,2,3,4,5,6,7,8,9].filter(d => !last20.has(d));

    // Odd/Even bias
    const oddCount = long.filter(d => d % 2 !== 0).length;
    const oddB = long.length > 0 ? (oddCount / long.length) * 100 : 50;
    const evenB = 100 - oddB;

    // High/Low bias
    const highCount = long.filter(d => d >= 5).length;
    const highB = long.length > 0 ? (highCount / long.length) * 100 : 50;
    const lowB = 100 - highB;

    // Momentum detection
    const mom: { digit: number; shortPct: number; longPct: number; rising: boolean }[] = [];
    for (let d = 0; d < 10; d++) {
      const sp = st.find(x => x.digit === d)?.pct || 0;
      const lp = lt.find(x => x.digit === d)?.pct || 0;
      if (Math.abs(sp - lp) > 4) {
        mom.push({ digit: d, shortPct: sp, longPct: lp, rising: sp > lp });
      }
    }

    return { shortTerm: st, longTerm: lt, top3: t3, rareDigits: rare, oddBias: oddB, evenBias: evenB, highBias: highB, lowBias: lowB, momentum: mom };
  }, [lastDigits]);

  if (lastDigits.length < 30) {
    return (
      <div className="p-4 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Next Digit Probability</h3>
        </div>
        <p className="text-xs text-muted-foreground text-center py-4">Collecting tick data...</p>
      </div>
    );
  }

  const maxLong = Math.max(...longTerm.map(d => d.pct));
  const minLong = Math.min(...longTerm.map(d => d.pct));

  return (
    <div className="space-y-3">
      {/* Top 3 Predictions */}
      <div className="p-3 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-semibold text-foreground">Next Digit Predictions</h3>
        </div>
        <div className="flex gap-2">
          {top3.map((d, i) => (
            <motion.div
              key={d.digit}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className={`flex-1 p-2 rounded-lg text-center ${i === 0 ? "bg-buy/10 border border-buy/20" : "bg-secondary"}`}
            >
              <p className="text-[9px] text-muted-foreground">{i === 0 ? "1st" : i === 1 ? "2nd" : "3rd"}</p>
              <p className={`text-lg font-bold ${i === 0 ? "text-buy" : "text-foreground"}`}>{d.digit}</p>
              <p className={`text-[10px] font-mono ${i === 0 ? "text-buy" : "text-muted-foreground"}`}>{d.pct.toFixed(1)}%</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Probability Bars */}
      <div className="p-3 rounded-xl bg-card border border-border">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-semibold text-foreground">Digit Probability</h3>
          </div>
          <div className="flex gap-2 text-[9px]">
            <span className="text-primary">■ Short (50)</span>
            <span className="text-muted-foreground">■ Long (300)</span>
          </div>
        </div>
        <div className="space-y-1.5">
          {longTerm.sort((a, b) => b.pct - a.pct).map(d => {
            const stVal = shortTerm.find(s => s.digit === d.digit)?.pct || 0;
            const isMax = d.pct === maxLong;
            const isMin = d.pct === minLong;
            return (
              <div key={d.digit} className="flex items-center gap-2">
                <span className={`w-4 text-xs font-bold text-center ${isMax ? "text-buy" : isMin ? "text-sell" : "text-foreground"}`}>{d.digit}</span>
                <div className="flex-1 h-3 bg-secondary/50 rounded-full overflow-hidden relative">
                  <motion.div
                    className="absolute top-0 left-0 h-full rounded-full bg-muted-foreground/30"
                    animate={{ width: `${d.pct * 5}%` }}
                    transition={{ duration: 0.2 }}
                  />
                  <motion.div
                    className={`absolute top-0 left-0 h-full rounded-full ${isMax ? "bg-buy/60" : isMin ? "bg-sell/60" : "bg-primary/40"}`}
                    animate={{ width: `${stVal * 5}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
                <span className={`w-10 text-[10px] font-mono text-right ${isMax ? "text-buy" : isMin ? "text-sell" : "text-muted-foreground"}`}>{d.pct.toFixed(1)}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rare Digit Alert */}
      {rareDigits.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-2.5 rounded-lg bg-warning/5 border border-warning/20 flex items-center gap-2"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0" />
          <p className="text-[10px] text-warning font-medium">
            Rare Digit Alert: {rareDigits.join(", ")} not seen in last 20 ticks
          </p>
        </motion.div>
      )}

      {/* Momentum Indicators */}
      {momentum.length > 0 && (
        <div className="p-3 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-primary" />
            <h3 className="text-xs font-semibold text-foreground">Probability Momentum</h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {momentum.map(m => (
              <span key={m.digit} className={`text-[10px] px-2 py-1 rounded-full font-medium flex items-center gap-1 ${m.rising ? "bg-buy/10 text-buy" : "bg-sell/10 text-sell"}`}>
                {m.rising ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                Digit {m.digit} {m.rising ? "↑" : "↓"} {m.shortPct.toFixed(0)}%
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Bias Meters */}
      <div className="grid grid-cols-2 gap-2">
        {/* Odd/Even */}
        <div className="p-3 rounded-xl bg-card border border-border">
          <p className="text-[9px] text-muted-foreground mb-1.5">Odd / Even Bias</p>
          <div className="flex gap-0.5 h-2.5 rounded-full overflow-hidden mb-1">
            <div className="bg-warning/60 rounded-l-full" style={{ width: `${oddBias}%` }} />
            <div className="bg-primary/60 rounded-r-full" style={{ width: `${evenBias}%` }} />
          </div>
          <div className="flex justify-between text-[9px]">
            <span className="text-warning font-bold">Odd {oddBias.toFixed(0)}%</span>
            <span className="text-primary font-bold">Even {evenBias.toFixed(0)}%</span>
          </div>
        </div>
        {/* High/Low */}
        <div className="p-3 rounded-xl bg-card border border-border">
          <p className="text-[9px] text-muted-foreground mb-1.5">High / Low Bias</p>
          <div className="flex gap-0.5 h-2.5 rounded-full overflow-hidden mb-1">
            <div className="bg-buy/60 rounded-l-full" style={{ width: `${highBias}%` }} />
            <div className="bg-sell/60 rounded-r-full" style={{ width: `${lowBias}%` }} />
          </div>
          <div className="flex justify-between text-[9px]">
            <span className="text-buy font-bold">High {highBias.toFixed(0)}%</span>
            <span className="text-sell font-bold">Low {lowBias.toFixed(0)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveProbabilityEngine;
