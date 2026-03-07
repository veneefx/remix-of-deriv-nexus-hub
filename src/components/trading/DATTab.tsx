import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Info, RefreshCw } from "lucide-react";

interface DATTabProps {
  lastDigits: number[];
  currentTick: number | null;
  marketLabel: string;
}

const DATTab = ({ lastDigits, currentTick, marketLabel }: DATTabProps) => {
  const [tickCount, setTickCount] = useState(100);
  const [overThreshold, setOverThreshold] = useState(4);
  const [underThreshold, setUnderThreshold] = useState(5);
  const [isLoading, setIsLoading] = useState(false);

  // Simulate loading state
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [lastDigits, tickCount, overThreshold, underThreshold]);

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
    return digits.map((d) => (d > overThreshold ? "O" : d < underThreshold ? "U" : "N"));
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <RefreshCw className="w-8 h-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 lg:p-5 overflow-y-auto max-h-[calc(100vh-200px)]">
      {/* Price & Ticks header */}
      <motion.div
        className="grid grid-cols-2 gap-3"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs text-muted-foreground font-medium">Price</span>
            <Info className="w-3 h-3 text-muted-foreground" />
          </div>
          <p className="text-xl font-mono font-bold text-foreground">
            {currentTick !== null ? currentTick.toFixed(2) : "—"}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs text-muted-foreground font-medium">Ticks Analyzed</span>
            <Info className="w-3 h-3 text-muted-foreground" />
          </div>
          <input
            type="number"
            value={tickCount}
            onChange={(e) => setTickCount(Math.max(10, Math.min(1000, parseInt(e.target.value) || 100)))}
            className="w-24 px-2 py-1 bg-secondary border border-border rounded text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </motion.div>

      {/* Thresholds */}
      <motion.div
        className="p-4 rounded-xl bg-card border border-border"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
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
              className="px-2 py-1 bg-secondary border border-border rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
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
              className="px-2 py-1 bg-secondary border border-border rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Distribution Analysis */}
      <motion.div
        className="p-4 rounded-xl bg-card border border-border"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-1.5 mb-3">
          <span className="text-sm font-semibold text-foreground">Distribution Analysis</span>
          <Info className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>Over: {overPct}% ({overCount})</span>
          <span>Under: {underPct}% ({underCount})</span>
        </div>
        <div className="h-5 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-green-500 transition-all"
            style={{ width: `${overPct}%` }}
          />
          <div
            className="h-full bg-red-500 transition-all"
            style={{ width: `${underPct}%` }}
          />
        </div>
      </motion.div>

      {/* Streak Analysis */}
      <motion.div
        className="p-4 rounded-xl bg-card border border-border"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-1.5 mb-4">
          <span className="text-sm font-semibold text-foreground">Streak Analysis</span>
          <Info className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-xs font-medium text-muted-foreground mb-3">Over Streaks</p>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-[10px] text-green-500 font-medium">Max Streak</p>
                <p className="text-2xl font-bold text-foreground">{streaks.maxOver}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-[10px] text-green-500 font-medium">Avg Streak</p>
                <p className="text-2xl font-bold text-foreground">{streaks.avgOver.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="text-center">
            <p className="text-xs font-medium text-muted-foreground mb-3">Under Streaks</p>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-[10px] text-red-500 font-medium">Max Streak</p>
                <p className="text-2xl font-bold text-foreground">{streaks.maxUnder}</p>
              </div>
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-[10px] text-red-500 font-medium">Avg Streak</p>
                <p className="text-2xl font-bold text-foreground">{streaks.avgUnder.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Pattern Grid */}
      <motion.div
        className="p-4 rounded-xl bg-card border border-border"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center gap-1.5 mb-3">
          <span className="text-sm font-semibold text-foreground">Pattern Grid (Last 100)</span>
          <Info className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-500 font-bold">Latest</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-500 font-bold">Under</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-500/20 text-gray-500 font-bold">Neutral</span>
        </div>
        <div className="flex flex-wrap gap-[3px] max-h-32 overflow-y-auto">
          {patterns.slice(-100).reverse().map((p, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.1, delay: i * 0.005 }}
              className={`w-[22px] h-[22px] rounded-full flex items-center justify-center text-[8px] font-bold border ${
                p === "O"
                  ? "bg-green-500/20 text-green-500 border-green-500/30"
                  : p === "U"
                    ? "bg-red-500/20 text-red-500 border-red-500/30"
                    : "bg-secondary text-muted-foreground border-border"
              }`}
              title={`Digit: ${digits[digits.length - 1 - i]}`}
            >
              {p}
            </motion.div>
          ))}
        </div>
        <div className="flex justify-end mt-2">
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-bold">Earliest</span>
        </div>
      </motion.div>

      {/* Common Sequences */}
      <motion.div
        className="p-4 rounded-xl bg-card border border-border"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold text-foreground">Common {seqLength}-Cell Sequences</span>
            <Info className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Length:</span>
            <select
              value={seqLength}
              onChange={(e) => setSeqLength(parseInt(e.target.value))}
              className="px-2 py-1 bg-secondary border border-border rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {[2, 3, 4, 5].map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex items-end gap-2 h-48 overflow-x-auto">
          {sequences.length > 0 ? (
            sequences.map(([seq, count], i) => {
              const heightPct = (count / maxSeqCount) * 100;
              const isMax = count === maxSeqCount;
              return (
                <div key={seq} className="flex-1 flex flex-col items-center gap-1 min-w-[40px]">
                  <span className="text-[9px] text-muted-foreground font-mono">{count}</span>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPct}%` }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    className={`w-full rounded-t ${isMax ? "bg-primary" : "bg-cyan-500/60"}`}
                    style={{ minHeight: 4 }}
                  />
                  <span className="text-[8px] text-muted-foreground font-mono mt-1">{seq}</span>
                </div>
              );
            })
          ) : (
            <div className="text-xs text-muted-foreground">No sequences found</div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default DATTab;
