import { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Target } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DigitEdgeAnalyticsProps {
  lastDigits: number[];
  currentDigit: number | null;
}

type BufferSize = 100 | 500 | 1000;

const BUFFERS: BufferSize[] = [100, 500, 1000];
const STORAGE_KEY = "dnx_digit_edge_buffer";

const loadBuffer = (): BufferSize => {
  if (typeof window === "undefined") return 1000;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  const parsed = raw ? parseInt(raw, 10) : NaN;
  return (BUFFERS as number[]).includes(parsed) ? (parsed as BufferSize) : 1000;
};

const DigitEdgeAnalytics = ({ lastDigits, currentDigit }: DigitEdgeAnalyticsProps) => {
  const [bufferSize, setBufferSize] = useState<BufferSize>(loadBuffer);
  const [pulseDigit, setPulseDigit] = useState<number | null>(null);
  const lastDigitRef = useRef<number | null>(null);

  // Persist buffer choice
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(bufferSize));
    } catch {
      /* ignore quota / privacy errors */
    }
  }, [bufferSize]);

  // Pulse animation when a new tick arrives
  useEffect(() => {
    if (currentDigit !== null && currentDigit !== lastDigitRef.current) {
      setPulseDigit(currentDigit);
      lastDigitRef.current = currentDigit;
      const t = setTimeout(() => setPulseDigit(null), 400);
      return () => clearTimeout(t);
    }
  }, [currentDigit]);

  const stats = useMemo(() => {
    const slice = lastDigits.slice(-bufferSize);
    const total = slice.length;
    if (total === 0) {
      return {
        percentages: Array(10).fill(0) as number[],
        counts: Array(10).fill(0) as number[],
        highest: -1,
        lowest: -1,
        secondLowest: -1,
        total: 0,
      };
    }
    const counts = Array(10).fill(0) as number[];
    slice.forEach((d) => {
      if (d >= 0 && d <= 9) counts[d]++;
    });
    const percentages = counts.map((c) => (c / total) * 100);

    // Highest %
    let highest = 0;
    percentages.forEach((p, i) => {
      if (p > percentages[highest]) highest = i;
    });

    // Lowest %
    let lowest = 0;
    percentages.forEach((p, i) => {
      if (p < percentages[lowest]) lowest = i;
    });

    // Second lowest (closest to lowest, excluding lowest itself)
    let secondLowest = -1;
    percentages.forEach((p, i) => {
      if (i === lowest) return;
      if (secondLowest === -1 || p < percentages[secondLowest]) {
        secondLowest = i;
      }
    });

    return { percentages, counts, highest, lowest, secondLowest, total };
  }, [lastDigits, bufferSize]);

  // Sparkline data per digit (last 50 ticks → presence as 0/1)
  const sparklines = useMemo(() => {
    const recent = lastDigits.slice(-50);
    const lines: number[][] = Array.from({ length: 10 }, () => []);
    // Build cumulative percentage across windows of 10
    for (let d = 0; d < 10; d++) {
      const window: number[] = [];
      let runningCount = 0;
      recent.forEach((digit, idx) => {
        if (digit === d) runningCount++;
        if ((idx + 1) % 5 === 0 || idx === recent.length - 1) {
          window.push(runningCount);
        }
      });
      lines[d] = window;
    }
    return lines;
  }, [lastDigits]);

  const getColor = (digit: number) => {
    if (digit === stats.highest && stats.total > 0) return "blue";
    if (digit === stats.lowest && stats.total > 0) return "red";
    if (digit === stats.secondLowest && stats.total > 0) return "yellow";
    return "neutral";
  };

  const colorClasses: Record<string, { bar: string; text: string; border: string; glow: string }> = {
    blue: {
      bar: "bg-primary",
      text: "text-primary",
      border: "border-primary/40",
      glow: "shadow-[0_0_12px_hsl(var(--primary)/0.4)]",
    },
    red: {
      bar: "bg-sell",
      text: "text-sell",
      border: "border-sell/40",
      glow: "shadow-[0_0_12px_hsl(var(--sell)/0.4)]",
    },
    yellow: {
      bar: "bg-warning",
      text: "text-warning",
      border: "border-warning/40",
      glow: "shadow-[0_0_12px_hsl(var(--warning)/0.4)]",
    },
    neutral: {
      bar: "bg-muted-foreground/30",
      text: "text-muted-foreground",
      border: "border-border",
      glow: "",
    },
  };

  return (
    <TooltipProvider delayDuration={200}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-2xl bg-card/80 backdrop-blur-sm border border-border shadow-lg"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Digit Edge Analytics</h3>
              <p className="text-[10px] text-muted-foreground">
                Live frequency · {stats.total}/{bufferSize} ticks
              </p>
            </div>
          </div>

          {/* Buffer toggle */}
          <div className="flex gap-0.5 p-0.5 bg-secondary rounded-lg">
            {BUFFERS.map((b) => (
              <button
                key={b}
                onClick={() => setBufferSize(b)}
                className={`px-3 py-1 text-[10px] font-bold rounded transition-all ${
                  bufferSize === b
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* Two-row circular digit grid: 0-4 top / 5-9 bottom */}
        <div className="space-y-2 sm:space-y-3">
          {[0, 5].map((rowStart) => (
            <div
              key={rowStart}
              className="grid grid-cols-5 gap-1.5 sm:gap-3"
            >
              {Array.from({ length: 5 }, (_, i) => {
                const digit = rowStart + i;
                const pct = stats.percentages[digit];
                const color = getColor(digit);
                const cls = colorClasses[color];
                const isLive = currentDigit === digit;
                const isPulsing = pulseDigit === digit;

                return (
                  <Tooltip key={digit}>
                    <TooltipTrigger asChild>
                      <motion.div
                        layout
                        animate={{ scale: isPulsing ? 1.06 : 1 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className={`relative flex flex-col items-center gap-1 p-2 sm:p-3 rounded-2xl bg-background/60 border ${cls.border} ${
                          isLive ? cls.glow : ""
                        } cursor-help transition-shadow`}
                      >
                        {/* Live pointer above the active card */}
                        <AnimatePresence>
                          {isLive && (
                            <motion.div
                              layoutId="tick-pointer"
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              transition={{ type: "spring", stiffness: 400, damping: 25 }}
                              className="absolute -top-3 flex flex-col items-center pointer-events-none"
                            >
                              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary text-primary-foreground text-[8px] font-bold shadow-lg">
                                <Target className="w-2 h-2" />
                                LIVE
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Circular digit — adapts to small screens */}
                        <div
                          className={`flex items-center justify-center w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-card border-2 ${cls.border}`}
                        >
                          <span
                            className={`text-base sm:text-xl md:text-2xl font-black ${cls.text} tabular-nums leading-none`}
                          >
                            {digit}
                          </span>
                        </div>

                        {/* Percentage */}
                        <span className="text-[10px] sm:text-xs text-muted-foreground font-mono tabular-nums">
                          {pct.toFixed(1)}%
                        </span>

                        {/* Animated bar */}
                        <div className="w-full h-1.5 bg-muted/50 rounded-full overflow-hidden mt-0.5">
                          <motion.div
                            className={`h-full ${cls.bar} rounded-full`}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(pct * 4, 100)}%` }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                          />
                        </div>

                        {/* Mini sparkline */}
                        <svg
                          viewBox="0 0 50 12"
                          className="w-full h-2 hidden sm:block"
                          preserveAspectRatio="none"
                        >
                          {sparklines[digit].length > 1 && (
                            <polyline
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1"
                              className={cls.text}
                              opacity={0.6}
                              points={sparklines[digit]
                                .map((v, idx) => {
                                  const x =
                                    (idx / Math.max(sparklines[digit].length - 1, 1)) * 50;
                                  const max = Math.max(...sparklines[digit], 1);
                                  const y = 12 - (v / max) * 10;
                                  return `${x},${y}`;
                                })
                                .join(" ")}
                            />
                          )}
                        </svg>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <div className="space-y-0.5">
                        <p className="font-bold">Digit {digit}</p>
                        <p className="text-muted-foreground">
                          {pct.toFixed(2)}% · {stats.counts[digit]} hits
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Last {bufferSize} ticks
                        </p>
                        {color === "blue" && <p className="text-primary text-[10px]">⬆ Highest</p>}
                        {color === "red" && <p className="text-sell text-[10px]">⬇ Lowest</p>}
                        {color === "yellow" && <p className="text-warning text-[10px]">↘ 2nd Lowest</p>}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-3 mt-3 pt-3 border-t border-border text-[9px] text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary" /> Highest
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-sell" /> Lowest
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-warning" /> 2nd Lowest
          </span>
          {currentDigit !== null && (
            <span className="flex items-center gap-1 ml-auto">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" /> Live: {currentDigit}
            </span>
          )}
        </div>
      </motion.div>
    </TooltipProvider>
  );
};

export default DigitEdgeAnalytics;
