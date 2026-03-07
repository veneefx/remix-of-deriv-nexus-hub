import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { tickBuffer } from "@/services/tick-buffer";
import { eventBus, TradingEvents } from "@/services/event-bus";

interface StreakData {
  digit: number;
  length: number;
  percentage: number;
  isActive: boolean;
}

interface DigitStreakIndicatorProps {
  market: string;
  historyCount?: number;
}

const DigitStreakIndicator: React.FC<DigitStreakIndicatorProps> = ({ market, historyCount = 100 }) => {
  const [streaks, setStreaks] = useState<StreakData[]>([]);
  const [currentStreak, setCurrentStreak] = useState<StreakData | null>(null);
  const [breakAlert, setBreakAlert] = useState<boolean>(false);

  useEffect(() => {
    let previousCurrentStreak: StreakData | null = null;

    const updateStreaks = () => {
      const streakList = tickBuffer.getStreaks(market, historyCount);
      const maxStreak = Math.max(...streakList.map(s => s.length), 1);

      const streakData: StreakData[] = streakList
        .sort((a, b) => b.length - a.length)
        .slice(0, 5)
        .map((streak) => ({
          digit: streak.digit,
          length: streak.length,
          percentage: (streak.length / maxStreak) * 100,
          isActive: false,
        }));

      // Get current streak (last digit repeated)
      const ticks = tickBuffer.getLastTicks(market, 10);
      if (ticks.length >= 2) {
        let currentStreakLength = 1;
        for (let i = ticks.length - 1; i > 0; i--) {
          if (ticks[i].digit === ticks[i - 1].digit) {
            currentStreakLength++;
          } else {
            break;
          }
        }

        const current: StreakData = {
          digit: ticks[ticks.length - 1].digit,
          length: currentStreakLength,
          percentage: (currentStreakLength / maxStreak) * 100,
          isActive: true,
        };

        // Check if streak broke
        if (previousCurrentStreak && previousCurrentStreak.digit === current.digit && previousCurrentStreak.length > current.length) {
          setBreakAlert(true);
          setTimeout(() => setBreakAlert(false), 2000);
        }

        setCurrentStreak(current);
        previousCurrentStreak = current;
      }

      setStreaks(streakData);
    };

    updateStreaks();

    const handleTick = () => {
      updateStreaks();
    };

    eventBus.on(TradingEvents.TICK_RECEIVED, handleTick);

    return () => {
      eventBus.off(TradingEvents.TICK_RECEIVED, handleTick);
    };
  }, [market, historyCount]);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Digit Streak Indicator</h3>

      {/* Current Streak Alert */}
      <AnimatePresence>
        {breakAlert && (
          <motion.div
            className="p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-500 text-sm font-semibold"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            ⚠️ Streak Broken! Digit {currentStreak?.digit} streak ended
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current Active Streak */}
      {currentStreak && (
        <motion.div
          className="p-3 bg-primary/20 border-2 border-primary rounded-lg"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Current Streak</span>
            <motion.span
              className="text-2xl font-bold text-primary"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              {currentStreak.digit}
            </motion.span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-accent"
                initial={{ width: 0 }}
                animate={{ width: `${currentStreak.percentage}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span className="text-sm font-bold text-primary">{currentStreak.length}x</span>
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            {currentStreak.length >= 5 ? "🔥 Strong Streak!" : currentStreak.length >= 3 ? "⚡ Building..." : "📊 Starting"}
          </div>
        </motion.div>
      )}

      {/* Top Streaks */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground">Top Streaks (Last {historyCount} Ticks)</h4>
        <div className="space-y-2">
          {streaks.map((streak, idx) => (
            <motion.div
              key={idx}
              className="p-2 bg-secondary/30 rounded border border-border"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 flex items-center justify-center rounded-full bg-primary/30 text-primary font-bold text-xs">
                  {streak.digit}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-foreground">{streak.length}x Streak</div>
                  <div className="text-xs text-muted-foreground">{streak.percentage.toFixed(0)}% of max</div>
                </div>
              </div>
              <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${streak.percentage}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Streak Statistics */}
      <div className="text-xs text-muted-foreground p-2 bg-secondary/20 rounded">
        <div>📊 Streaks detected: {streaks.length}</div>
        {streaks.length > 0 && (
          <div>🔝 Longest streak: {streaks[0].digit} ({streaks[0].length}x)</div>
        )}
      </div>
    </div>
  );
};

export default DigitStreakIndicator;
