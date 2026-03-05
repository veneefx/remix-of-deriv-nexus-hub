import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Info } from "lucide-react";

interface DATTabProps {
  lastDigits: number[];
  currentTick: number | null;
  marketLabel: string;
}

const DATTab = ({ lastDigits, currentTick, marketLabel }: DATTabProps) => {
  const [tickCount, setTickCount] = useState(100);
  const [overThreshold, setOverThreshold] = useState(4);
  const [underThreshold, setUnderThreshold] = useState(5);

  const digits = useMemo(() => lastDigits.slice(-tickCount), [lastDigits, tickCount]);
  const total = digits.length;

  // Distribution
  const overCount = digits.filter((d) => d > overThreshold).length;
  const underCount = digits.filter((d) => d < underThreshold).length;
  const overPct = total > 0 ? ((overCount / total) * 100).toFixed(2) : "0.00";
  const underPct = total > 0 ? ((underCount / total) * 100).toFixed(2) : "0.00";

  // Streak analysis
  const streaks = useMemo(() => {
    const overStreaks: number[] = [];
    const underStreaks: number[] = [];
    let currentOverStreak = 0;
    let currentUnderStreak = 0;

    digits.forEach((d) => {
      if (d > overThreshold) {
        currentOverStreak++;
        if (currentUnderStreak > 0) {
          underStreaks.push(currentUnderStreak);
          currentUnderStreak = 0;
        }
      } else if (d < underThreshold) {
        currentUnderStreak++;
        if (currentOverStreak > 0) {
          overStreaks.push(currentOverStreak);
          currentOverStreak = 0;
        }
      } else {
        if (currentOverStreak > 0) overStreaks.push(currentOverStreak);
        if (currentUnderStreak > 0) underStreaks.push(currentUnderStreak);
        currentOverStreak = 0;
        currentUnderStreak = 0;
      }
    });
    if (currentOverStreak > 0) overStreaks.push(currentOverStreak);
    if (currentUnderStreak > 0) underStreaks.push(currentUnderStreak);

    const maxOver = overStreaks.length > 0 ? Math.max(...overStreaks) : 0;
    const avgOver = overStreaks.length > 0 ? (overStreaks.reduce((a, b) => a + b, 0) / overStreaks.length) : 0;
    const maxUnder = underStreaks.length > 0 ? Math.max(...underStreaks) : 0;
    const avgUnder = underStreaks.length > 0 ? (underStreaks.reduce((a, b) => a + b, 0) / underStreaks.length) : 0;

    return { maxOver, avgOver, maxUnder, avgUnder };
  }, [digits, overThreshold, underThreshold]);

  // Pattern grid — U (under) / O (over)
  const patterns = useMemo(() => {
    return digits.map((d) => (d > overThreshold ? "U" : d < underThreshold ? "O" : "N"));
  }, [digits, overThreshold, underThreshold]);

  // Common 3-cell sequences
  const [seqLength, setSeqLength] = useState(3);
  const sequences = useMemo(() => {
    const seqMap = new Map<string, number>();
    for (let i = 0; i <= patterns.length - seqLength; i++) {
      const seq = patterns.slice(i, i + seqLength).join("");
      seqMap.set(seq, (seqMap.get(seq) || 0) + 1);
    }
    return Array.from(seqMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [patterns, seqLength]);

  const maxSeqCount = sequences.length > 0 ? Math.max(...sequences.map(s => s[1])) : 1;

  return (
    <div className="space-y-4 p-4 lg:p-5 overflow-y-auto">
      {/* Price & Ticks header */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs text-muted-foreground font-medium">Price</span>
            <Info className="w-3 h-3 text-muted-foreground" />
          </div>
          <p className="text-xl font-mono font-bold text-foreground">
            {currentTick !== null ? currentTick : "—"}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs text-muted-foreground font-medium">Ticks</span>
            <Info className="w-3 h-3 text-muted-foreground" />
          </div>
          <input
            type="number"
            value={tickCount}
            onChange={(e) => setTickCount(Math.max(10, Math.min(1000, parseInt(e.target.value) || 100)))}
            className="w-24 px-2 py-1 bg-secondary border border-border rounded text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Thresholds */}
      <div className="p-4 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-1.5 mb-3">
          <span className="text-sm font-semibold text-foreground">Thresholds</span>
          <Info className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Over:</span>
            <select
              value={overThreshold}
              onChange={(e) => setOverThreshold(parseInt(e.target.value))}
              className="px-2 py-1 bg-secondary border border-border rounded text-xs text-foreground"
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Under:</span>
            <select
              value={underThreshold}
              onChange={(e) => setUnderThreshold(parseInt(e.target.value))}
              className="px-2 py-1 bg-secondary border border-border rounded text-xs text-foreground"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Distribution Analysis */}
      <div className="p-4 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-1.5 mb-3">
          <span className="text-sm font-semibold text-foreground">Distribution Analysis</span>
          <Info className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>Over:{overPct}% ({overCount})</span>
          <span>Under:{underPct}% ({underCount})</span>
        </div>
        <div className="h-5 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-buy transition-all"
            style={{ width: `${overPct}%` }}
          />
          <div
            className="h-full bg-sell transition-all"
            style={{ width: `${underPct}%` }}
          />
        </div>
      </div>

      {/* Streak Analysis */}
      <div className="p-4 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-1.5 mb-4">
          <span className="text-sm font-semibold text-foreground">Streak Analysis</span>
          <Info className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-xs font-medium text-muted-foreground mb-3">Over Streaks</p>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-buy/5 border border-buy/20">
                <p className="text-[10px] text-buy font-medium">Max Streak</p>
                <p className="text-2xl font-bold text-foreground">{streaks.maxOver}</p>
              </div>
              <div className="p-3 rounded-lg bg-buy/5 border border-buy/20">
                <p className="text-[10px] text-buy font-medium">Avg Streak</p>
                <p className="text-2xl font-bold text-foreground">{streaks.avgOver.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs font-medium text-muted-foreground mb-3">Under Streaks</p>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-sell/5 border border-sell/20">
                <p className="text-[10px] text-sell font-medium">Max Streak</p>
                <p className="text-2xl font-bold text-foreground">{streaks.maxUnder}</p>
              </div>
              <div className="p-3 rounded-lg bg-sell/5 border border-sell/20">
                <p className="text-[10px] text-sell font-medium">Avg Streak</p>
                <p className="text-2xl font-bold text-foreground">{streaks.avgUnder.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pattern Grid */}
      <div className="p-4 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-1.5 mb-3">
          <span className="text-sm font-semibold text-foreground">Pattern Grid</span>
          <Info className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-buy/20 text-buy font-bold">Latest</span>
        </div>
        <div className="flex flex-wrap gap-[3px]">
          {patterns.slice(-100).reverse().map((p, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.1, delay: i * 0.005 }}
              className={`w-[22px] h-[22px] rounded-full flex items-center justify-center text-[8px] font-bold border ${
                p === "U"
                  ? "bg-sell/10 text-sell border-sell/30"
                  : p === "O"
                    ? "bg-buy/10 text-buy border-buy/30"
                    : "bg-secondary text-muted-foreground border-border"
              }`}
            >
              {p}
            </motion.div>
          ))}
        </div>
        <div className="flex justify-end mt-2">
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-bold">Earliest</span>
        </div>
      </div>

      {/* Common Sequences */}
      <div className="p-4 rounded-xl bg-card border border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-foreground">Common {seqLength}-Cell Sequences</span>
            <Info className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Common Sequence Length:</span>
            <select
              value={seqLength}
              onChange={(e) => setSeqLength(parseInt(e.target.value))}
              className="px-2 py-1 bg-secondary border border-border rounded text-xs text-foreground"
            >
              {[2, 3, 4, 5].map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-end gap-2 h-48">
          {sequences.map(([seq, count], i) => {
            const heightPct = (count / maxSeqCount) * 100;
            const isMax = count === maxSeqCount;
            return (
              <div key={seq} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] text-muted-foreground font-mono">{count}</span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPct}%` }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className={`w-full rounded-t ${isMax ? "bg-primary" : "bg-buy/60"}`}
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
