import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { tickBuffer } from "@/services/tick-buffer";
import { eventBus, TradingEvents } from "@/services/event-bus";

interface VolatilityData {
  volatility: number; // 0-1
  level: "LOW" | "MEDIUM" | "HIGH" | "EXTREME";
  changeCount: number;
  totalTicks: number;
  recommendation: string;
}

interface VolatilityIndicatorProps {
  market: string;
  lookbackPeriod?: number;
}

const VolatilityIndicator: React.FC<VolatilityIndicatorProps> = ({ market, lookbackPeriod = 50 }) => {
  const [volatility, setVolatility] = useState<VolatilityData | null>(null);
  const [history, setHistory] = useState<number[]>([]);

  useEffect(() => {
    const updateVolatility = () => {
      const ticks = tickBuffer.getLastTicks(market, lookbackPeriod);
      if (ticks.length < 2) return;

      // Count digit changes
      let changeCount = 0;
      for (let i = 1; i < ticks.length; i++) {
        if (ticks[i].digit !== ticks[i - 1].digit) {
          changeCount++;
        }
      }

      const volatilityScore = changeCount / (ticks.length - 1);
      let level: "LOW" | "MEDIUM" | "HIGH" | "EXTREME";
      let recommendation: string;

      if (volatilityScore < 0.3) {
        level = "LOW";
        recommendation = "🟢 Conservative trading - Low volatility, stable market";
      } else if (volatilityScore < 0.5) {
        level = "MEDIUM";
        recommendation = "🟡 Balanced trading - Moderate volatility, good opportunities";
      } else if (volatilityScore < 0.7) {
        level = "HIGH";
        recommendation = "🟠 Aggressive trading - High volatility, increased risk";
      } else {
        level = "EXTREME";
        recommendation = "🔴 Extreme caution - Very high volatility, use tight SL";
      }

      setVolatility({
        volatility: volatilityScore,
        level,
        changeCount,
        totalTicks: ticks.length,
        recommendation,
      });

      // Update history
      setHistory((prev) => [...prev.slice(-49), volatilityScore]);
    };

    updateVolatility();

    const handleTick = () => {
      updateVolatility();
    };

    eventBus.on(TradingEvents.TICK_RECEIVED, handleTick);

    return () => {
      eventBus.off(TradingEvents.TICK_RECEIVED, handleTick);
    };
  }, [market, lookbackPeriod]);

  const getVolatilityColor = (level: string): string => {
    switch (level) {
      case "LOW":
        return "text-green-500";
      case "MEDIUM":
        return "text-yellow-500";
      case "HIGH":
        return "text-orange-500";
      case "EXTREME":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getVolatilityBgColor = (level: string): string => {
    switch (level) {
      case "LOW":
        return "bg-green-500/20 border-green-500";
      case "MEDIUM":
        return "bg-yellow-500/20 border-yellow-500";
      case "HIGH":
        return "bg-orange-500/20 border-orange-500";
      case "EXTREME":
        return "bg-red-500/20 border-red-500";
      default:
        return "bg-secondary/20 border-border";
    }
  };

  if (!volatility) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Volatility Indicator</h3>

      {/* Main Volatility Gauge */}
      <motion.div
        className={`p-4 rounded-lg border-2 ${getVolatilityBgColor(volatility.level)}`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-muted-foreground">Volatility Level</span>
          <span className={`text-lg font-bold ${getVolatilityColor(volatility.level)}`}>
            {volatility.level}
          </span>
        </div>

        {/* Gauge Bar */}
        <div className="w-full h-4 bg-secondary rounded-full overflow-hidden mb-3">
          <motion.div
            className={`h-full ${
              volatility.level === "LOW"
                ? "bg-green-500"
                : volatility.level === "MEDIUM"
                  ? "bg-yellow-500"
                  : volatility.level === "HIGH"
                    ? "bg-orange-500"
                    : "bg-red-500"
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${volatility.volatility * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Percentage */}
        <div className="text-sm font-bold text-foreground mb-2">
          {(volatility.volatility * 100).toFixed(1)}%
        </div>

        {/* Details */}
        <div className="text-xs text-muted-foreground space-y-1">
          <div>Changes: {volatility.changeCount} / {volatility.totalTicks - 1}</div>
          <div>Change Rate: {((volatility.volatility) * 100).toFixed(1)}%</div>
        </div>
      </motion.div>

      {/* Recommendation */}
      <motion.div
        className="p-3 bg-secondary/30 rounded-lg text-sm"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {volatility.recommendation}
      </motion.div>

      {/* Volatility History Chart */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground">Volatility History</h4>
        <div className="flex items-end gap-0.5 h-12 p-2 bg-secondary/20 rounded-lg">
          {history.map((vol, idx) => (
            <motion.div
              key={idx}
              className={`flex-1 rounded-t ${
                vol < 0.3
                  ? "bg-green-500"
                  : vol < 0.5
                    ? "bg-yellow-500"
                    : vol < 0.7
                      ? "bg-orange-500"
                      : "bg-red-500"
              }`}
              initial={{ height: 0 }}
              animate={{ height: `${vol * 100}%` }}
              transition={{ duration: 0.2 }}
            />
          ))}
        </div>
      </div>

      {/* Trading Strategy Suggestion */}
      <div className="text-xs text-muted-foreground p-2 bg-secondary/20 rounded space-y-1">
        <div className="font-semibold">💡 Strategy Suggestion:</div>
        {volatility.level === "LOW" && (
          <div>
            • Use wider SL/TP ranges<br/>
            • Increase stake for more profit<br/>
            • Focus on trend following
          </div>
        )}
        {volatility.level === "MEDIUM" && (
          <div>
            • Balanced SL/TP settings<br/>
            • Standard stake size<br/>
            • Mix of trend and range trading
          </div>
        )}
        {volatility.level === "HIGH" && (
          <div>
            • Tighter SL/TP ranges<br/>
            • Reduce stake size<br/>
            • Focus on quick scalps
          </div>
        )}
        {volatility.level === "EXTREME" && (
          <div>
            • Very tight SL (2-3%)<br/>
            • Minimize stake size<br/>
            • Consider pausing trading
          </div>
        )}
      </div>
    </div>
  );
};

export default VolatilityIndicator;
