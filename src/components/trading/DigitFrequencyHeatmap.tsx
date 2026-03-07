import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { tickBuffer } from "@/services/tick-buffer";
import { eventBus, TradingEvents } from "@/services/event-bus";

interface DigitFrequencyHeatmap {
  digit: number;
  frequency: number;
  percentage: number;
  intensity: number; // 0-1 for color intensity
}

interface DigitFrequencyHeatmapProps {
  market: string;
  historyCount?: number;
}

const DigitFrequencyHeatmapComponent: React.FC<DigitFrequencyHeatmapProps> = ({
  market,
  historyCount = 100,
}) => {
  const [heatmap, setHeatmap] = useState<DigitFrequencyHeatmap[]>([]);
  const [recentDigits, setRecentDigits] = useState<number[]>([]);
  const [hoveredDigit, setHoveredDigit] = useState<number | null>(null);

  useEffect(() => {
    const updateHeatmap = () => {
      const frequency = tickBuffer.getDigitFrequency(market, historyCount);
      const totalTicks = Object.values(frequency).reduce((a, b) => a + b, 0);
      const maxFrequency = Math.max(...Object.values(frequency));

      const heatmapData: DigitFrequencyHeatmap[] = [];
      for (let i = 0; i < 10; i++) {
        const freq = frequency[i];
        heatmapData.push({
          digit: i,
          frequency: freq,
          percentage: totalTicks > 0 ? (freq / totalTicks) * 100 : 0,
          intensity: maxFrequency > 0 ? freq / maxFrequency : 0,
        });
      }
      setHeatmap(heatmapData);

      // Get recent ticks
      const ticks = tickBuffer.getLastTicks(market, 50);
      setRecentDigits(ticks.map(t => t.digit));
    };

    updateHeatmap();

    const handleTick = () => {
      updateHeatmap();
    };

    eventBus.on(TradingEvents.TICK_RECEIVED, handleTick);

    return () => {
      eventBus.off(TradingEvents.TICK_RECEIVED, handleTick);
    };
  }, [market, historyCount]);

  const getHeatmapColor = (intensity: number): string => {
    if (intensity < 0.2) return "bg-blue-900/30";
    if (intensity < 0.4) return "bg-blue-700/50";
    if (intensity < 0.6) return "bg-cyan-600/70";
    if (intensity < 0.8) return "bg-green-500/80";
    return "bg-yellow-400/90";
  };

  const getBorderColor = (intensity: number): string => {
    if (intensity < 0.2) return "border-blue-900";
    if (intensity < 0.4) return "border-blue-700";
    if (intensity < 0.6) return "border-cyan-600";
    if (intensity < 0.8) return "border-green-500";
    return "border-yellow-400";
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Digit Frequency Heatmap (Last {historyCount} Ticks)</h3>

      {/* Heatmap Grid */}
      <div className="grid grid-cols-5 gap-2 p-3 bg-secondary/30 rounded-lg">
        {heatmap.map((item) => (
          <motion.div
            key={item.digit}
            className={`relative aspect-square rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all ${getHeatmapColor(
              item.intensity
            )} ${getBorderColor(item.intensity)}`}
            onMouseEnter={() => setHoveredDigit(item.digit)}
            onMouseLeave={() => setHoveredDigit(null)}
            whileHover={{ scale: 1.1 }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: item.digit * 0.05 }}
          >
            <div className="text-center">
              <div className="text-lg font-bold text-foreground">{item.digit}</div>
              <div className="text-xs text-muted-foreground">{item.percentage.toFixed(0)}%</div>
            </div>

            {/* Tooltip */}
            {hoveredDigit === item.digit && (
              <motion.div
                className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black/90 text-white px-2 py-1 rounded text-xs whitespace-nowrap z-50"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                Count: {item.frequency} | {item.percentage.toFixed(1)}%
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Recent Ticks Strip */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground">Recent Ticks (Last 50)</h4>
        <div className="flex flex-wrap gap-1 p-2 bg-secondary/30 rounded-lg max-h-20 overflow-y-auto">
          {recentDigits.map((digit, idx) => (
            <motion.div
              key={idx}
              className="w-5 h-5 flex items-center justify-center text-xs font-bold rounded bg-primary/40 text-primary border border-primary/60"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.02 }}
            >
              {digit}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="text-xs text-muted-foreground space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-400/90 rounded"></div>
          <span>Very High (80-100%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500/80 rounded"></div>
          <span>High (60-80%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-cyan-600/70 rounded"></div>
          <span>Medium (40-60%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-700/50 rounded"></div>
          <span>Low (20-40%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-900/30 rounded"></div>
          <span>Very Low (0-20%)</span>
        </div>
      </div>
    </div>
  );
};

export default DigitFrequencyHeatmapComponent;
