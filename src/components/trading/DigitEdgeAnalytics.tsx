import { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Target, TrendingUp, TrendingDown } from "lucide-react";
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

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(bufferSize));
    } catch {
      /* ignore */
    }
  }, [bufferSize]);

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

    let highest = 0;
    percentages.forEach((p, i) => {
      if (p > percentages[highest]) highest = i;
    });

    let lowest = 0;
    percentages.forEach((p, i) => {
      if (p < percentages[lowest]) lowest = i;
    });

    let secondLowest = -1;
    percentages.forEach((p, i) => {
      if (i === lowest) return;
      if (secondLowest === -1 || p < percentages[secondLowest]) {
        secondLowest = i;
      }
    });

    return { percentages, counts, highest, lowest, secondLowest, total };
  }, [lastDigits, bufferSize]);

  const sparklines = useMemo(() => {
    const recent = lastDigits.slice(-50);
    const lines: number[][] = Array.from({ length: 10 }, () => []);
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
    if (digit === stats.highest && stats.total > 0) return "sky";
    if (digit === stats.lowest && stats.total > 0) return "red";
    if (digit === stats.secondLowest && stats.total > 0) return "yellow";
    return "neutral";
  };

  // Premium color palette — true sky blue for highest, deep red for lowest
  const colorClasses: Record<
    string,
    { ring: string; text: string; bg: string; bar: string; glow: string; gradient: string; label: string }
  > = {
    sky: {
      ring: "ring-sky/60",
      text: "text-sky",
      bg: "bg-sky/10",
      bar: "bg-sky",
      glow: "shadow-[0_0_24px_hsl(var(--sky)/0.55)]",
      gradient: "from-sky to-sky/70",
      label: "Highest",
    },
    red: {
      ring: "ring-sell/60",
      text: "text-sell",
      bg: "bg-sell/10",
      bar: "bg-sell",
      glow: "shadow-[0_0_24px_hsl(var(--sell)/0.55)]",
      gradient: "from-sell to-sell/70",
      label: "Lowest",
    },
    yellow: {
      ring: "ring-warning/60",
      text: "text-warning",
      bg: "bg-warning/10",
      bar: "bg-warning",
      glow: "shadow-[0_0_18px_hsl(var(--warning)/0.5)]",
      gradient: "from-warning to-warning/70",
      label: "2nd Lowest",
    },
    neutral: {
      ring: "ring-border",
      text: "text-foreground",
      bg: "bg-card",
      bar: "bg-muted-foreground/30",
      glow: "",
      gradient: "from-secondary to-card",
      label: "",
    },
  };

  return (
    <TooltipProvider delayDuration={150}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-card to-card/60 backdrop-blur-xl border border-border shadow-xl overflow-hidden"
      >
        {/* Decorative top gradient */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky/40 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-sky to-sky/60 flex items-center justify-center shadow-lg shadow-sky/30">
              <Activity className="w-4 h-4 text-sky-foreground" />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-buy border-2 border-card animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground tracking-tight">Digit Edge Analytics</h3>
              <p className="text-[10px] text-muted-foreground tabular-nums">
                Live frequency · {stats.total.toLocaleString()}/{bufferSize.toLocaleString()} ticks
              </p>
            </div>
          </div>

          {/* Buffer toggle */}
          <div className="flex gap-0.5 p-0.5 bg-secondary/60 backdrop-blur rounded-xl border border-border/60">
            {BUFFERS.map((b) => (
              <button
                key={b}
                onClick={() => setBufferSize(b)}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                  bufferSize === b
                    ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* 2-row circular grid: 0-4 / 5-9 */}
        <div className="space-y-3">
          {[0, 5].map((rowStart) => (
            <div key={rowStart} className="grid grid-cols-5 gap-2 sm:gap-4">
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
                        animate={{ scale: isPulsing ? 1.08 : 1 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className={`relative flex flex-col items-center gap-1.5 cursor-help`}
                      >
                        {/* Live pointer */}
                        <AnimatePresence>
                          {isLive && (
                            <motion.div
                              layoutId="tick-pointer"
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              transition={{ type: "spring", stiffness: 400, damping: 25 }}
                              className="absolute -top-4 z-10 flex flex-col items-center pointer-events-none"
                            >
                              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-buy to-buy/80 text-primary-foreground text-[8px] font-bold shadow-lg">
                                <Target className="w-2 h-2" />
                                LIVE
                              </div>
                              <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px] border-t-buy/80" />
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* TRUE CIRCLE — perfect aspect, gradient bg, ring */}
                        <div
                          className={`relative aspect-square w-full max-w-[64px] rounded-full bg-gradient-to-br ${cls.gradient} ring-2 ${cls.ring} ${
                            isLive ? cls.glow : "shadow-md"
                          } flex items-center justify-center transition-shadow`}
                        >
                          <span
                            className={`text-lg sm:text-2xl md:text-3xl font-black ${
                              color === "neutral" ? "text-foreground" : "text-white"
                            } tabular-nums leading-none drop-shadow-sm`}
                          >
                            {digit}
                          </span>
                          {/* Inner glossy ring */}
                          <div className="absolute inset-1 rounded-full ring-1 ring-white/20 pointer-events-none" />
                        </div>

                        {/* Percentage pill */}
                        <span
                          className={`text-[10px] sm:text-xs font-bold ${cls.text} tabular-nums px-2 py-0.5 rounded-full ${cls.bg} border border-current/20`}
                        >
                          {pct.toFixed(1)}%
                        </span>

                        {/* Bar */}
                        <div className="w-full h-1 bg-muted/40 rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full ${cls.bar} rounded-full`}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(pct * 4, 100)}%` }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                          />
                        </div>

                        {/* Sparkline (sm+ only) */}
                        <svg
                          viewBox="0 0 50 12"
                          className="w-full h-2 hidden sm:block opacity-60"
                          preserveAspectRatio="none"
                        >
                          {sparklines[digit].length > 1 && (
                            <polyline
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className={cls.text}
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
                          Last {bufferSize.toLocaleString()} ticks
                        </p>
                        {color !== "neutral" && (
                          <p className={`text-[10px] ${cls.text}`}>{cls.label}</p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-3 mt-4 pt-3 border-t border-border/60 text-[10px] text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky shadow-[0_0_6px_hsl(var(--sky)/0.6)]" />
            <TrendingUp className="w-2.5 h-2.5 text-sky" /> Highest
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sell shadow-[0_0_6px_hsl(var(--sell)/0.6)]" />
            <TrendingDown className="w-2.5 h-2.5 text-sell" /> Lowest
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-warning shadow-[0_0_6px_hsl(var(--warning)/0.6)]" />
            2nd Lowest
          </span>
          {currentDigit !== null && (
            <span className="flex items-center gap-1.5 ml-auto font-bold text-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-buy animate-pulse" />
              Live: {currentDigit}
            </span>
          )}
        </div>
      </motion.div>
    </TooltipProvider>
  );
};

export default DigitEdgeAnalytics;
