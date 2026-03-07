import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { tickBuffer } from "@/services/tick-buffer";
import { eventBus, TradingEvents } from "@/services/event-bus";

interface MomentumData {
  digit: number;
  momentum: number; // -1 to 1
  direction: "UP" | "DOWN" | "NEUTRAL";
  strength: number; // 0-100
}

interface MomentumTrackerProps {
  market: string;
  lookbackPeriod?: number;
}

const MomentumTracker: React.FC<MomentumTrackerProps> = ({ market, lookbackPeriod = 50 }) => {
  const [momentumData, setMomentumData] = useState<MomentumData[]>([]);
  const [overallMomentum, setOverallMomentum] = useState<number>(0);

  useEffect(() => {
    const updateMomentum = () => {
      const ticks = tickBuffer.getLastTicks(market, lookbackPeriod);
      if (ticks.length < 2) return;

      // Calculate momentum for each digit
      const digitMomentum: Record<number, { up: number; down: number }> = {};
      for (let i = 0; i < 10; i++) {
        digitMomentum[i] = { up: 0, down: 0 };
      }

      for (let i = 1; i < ticks.length; i++) {
        const current = ticks[i].digit;
        const previous = ticks[i - 1].digit;

        if (current > previous) {
          digitMomentum[current].up++;
        } else if (current < previous) {
          digitMomentum[current].down++;
        }
      }

      // Calculate momentum score for each digit
      const momentumArray: MomentumData[] = [];
      let totalMomentum = 0;

      for (let i = 0; i < 10; i++) {
        const { up, down } = digitMomentum[i];
        const total = up + down || 1;
        const momentum = (up - down) / total;
        const strength = Math.abs(momentum) * 100;

        momentumArray.push({
          digit: i,
          momentum,
          direction: momentum > 0.2 ? "UP" : momentum < -0.2 ? "DOWN" : "NEUTRAL",
          strength: Math.min(100, strength),
        });

        totalMomentum += momentum;
      }

      setMomentumData(momentumArray);
      setOverallMomentum(totalMomentum / 10);
    };

    updateMomentum();

    const handleTick = () => {
      updateMomentum();
    };

    eventBus.on(TradingEvents.TICK_RECEIVED, handleTick);

    return () => {
      eventBus.off(TradingEvents.TICK_RECEIVED, handleTick);
    };
  }, [market, lookbackPeriod]);

  const getDirectionIcon = (direction: string): string => {
    if (direction === "UP") return "↑";
    if (direction === "DOWN") return "↓";
    return "→";
  };

  const getDirectionColor = (direction: string): string => {
    if (direction === "UP") return "text-green-500";
    if (direction === "DOWN") return "text-red-500";
    return "text-yellow-500";
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Momentum Tracker</h3>

      {/* Overall Momentum */}
      <div className="p-3 bg-secondary/30 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground">Overall Market Momentum</span>
          <span className={`text-sm font-bold ${overallMomentum > 0 ? "text-green-500" : "text-red-500"}`}>
            {overallMomentum > 0 ? "↑" : "↓"} {(Math.abs(overallMomentum) * 100).toFixed(0)}%
          </span>
        </div>
        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${overallMomentum > 0 ? "bg-green-500" : "bg-red-500"}`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.abs(overallMomentum) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Individual Digit Momentum */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground">Per-Digit Momentum</h4>
        <div className="grid grid-cols-2 gap-2">
          {momentumData.map((data) => (
            <motion.div
              key={data.digit}
              className="p-2 bg-secondary/30 rounded border border-border"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: data.digit * 0.05 }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-foreground">{data.digit}</span>
                <span className={`text-lg font-bold ${getDirectionColor(data.direction)}`}>
                  {getDirectionIcon(data.direction)}
                </span>
              </div>
              <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  className={`h-full ${
                    data.direction === "UP" ? "bg-green-500" : data.direction === "DOWN" ? "bg-red-500" : "bg-yellow-500"
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${data.strength}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-1">{data.strength.toFixed(0)}%</div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Momentum Interpretation */}
      <div className="text-xs text-muted-foreground p-2 bg-secondary/20 rounded">
        {overallMomentum > 0.3 ? (
          <span className="text-green-500">📈 Strong Upward Momentum - Consider UP trades</span>
        ) : overallMomentum > 0 ? (
          <span className="text-green-400">📊 Mild Upward Momentum</span>
        ) : overallMomentum < -0.3 ? (
          <span className="text-red-500">📉 Strong Downward Momentum - Consider DOWN trades</span>
        ) : overallMomentum < 0 ? (
          <span className="text-red-400">📊 Mild Downward Momentum</span>
        ) : (
          <span className="text-yellow-500">⚖️ Neutral Momentum - Mixed signals</span>
        )}
      </div>
    </div>
  );
};

export default MomentumTracker;
