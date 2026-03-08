import { useMemo } from "react";
import { motion } from "framer-motion";
import { Brain, Target, TrendingUp, Clock, Zap, Shield, ChevronRight } from "lucide-react";

interface TickData {
  quote: number;
  digit: number;
  epoch: number;
}

interface AIOptimizerProps {
  lastDigits: number[];
  tickBuffer: TickData[];
  signalScore?: number;
}

interface Recommendation {
  contractType: string;
  contractLabel: string;
  confidence: number;
  reason: string;
  timing: string;
  barrier?: string;
}

const AIOptimizer = ({ lastDigits, tickBuffer, signalScore = 0 }: AIOptimizerProps) => {
  const analysis = useMemo(() => {
    if (lastDigits.length < 50 || tickBuffer.length < 30) return null;

    const d = lastDigits.slice(-200);
    const recent50 = d.slice(-50);
    const recent25 = d.slice(-25);
    const older25 = d.slice(-50, -25);

    // Even/Odd analysis
    const oddCount = recent50.filter(x => x % 2 !== 0).length;
    const oddPct = (oddCount / recent50.length) * 100;
    const evenPct = 100 - oddPct;

    // Momentum
    const recentOdd = recent25.filter(x => x % 2 !== 0).length;
    const olderOdd = older25.filter(x => x % 2 !== 0).length;
    const oddMomentum = recentOdd - olderOdd;

    // High/Low
    const highCount = recent50.filter(x => x >= 5).length;
    const highPct = (highCount / recent50.length) * 100;

    // Digit frequency
    const freq = new Array(10).fill(0);
    d.forEach(x => freq[x]++);
    const total = d.length;
    const probabilities = freq.map((c, i) => ({ digit: i, pct: (c / total) * 100 }));
    const sorted = [...probabilities].sort((a, b) => b.pct - a.pct);
    const dominant = sorted[0];
    const rare = sorted[sorted.length - 1];

    // Volatility
    let volSum = 0;
    const recentTicks = tickBuffer.slice(-100);
    for (let i = 1; i < recentTicks.length; i++) volSum += Math.abs(recentTicks[i].quote - recentTicks[i - 1].quote);
    const volatility = recentTicks.length > 1 ? (volSum / (recentTicks.length - 1)) * 1000 : 0;
    const isHighVol = volatility >= 50;

    // Streak detection
    let currentStreak = 1;
    for (let i = d.length - 1; i > 0; i--) {
      if (d[i] === d[i - 1]) currentStreak++; else break;
    }

    // Pattern: alternating
    let altCount = 0;
    const last20 = d.slice(-20);
    for (let i = 1; i < last20.length; i++) {
      if ((last20[i] % 2) !== (last20[i - 1] % 2)) altCount++;
    }
    const isAlternating = altCount >= 14;

    // Tick speed
    let tickSpeed = 0;
    if (tickBuffer.length >= 10) {
      const now = tickBuffer[tickBuffer.length - 1].epoch;
      tickSpeed = tickBuffer.filter(t => t.epoch > now - 5).length / 5;
    }

    // Generate recommendations
    const recs: Recommendation[] = [];

    // Odd/Even recommendation
    if (oddPct >= 58 && oddMomentum >= 2) {
      recs.push({ contractType: "DIGITODD", contractLabel: "Odd", confidence: Math.min(oddPct + 10, 92), reason: `Odd dominance at ${oddPct.toFixed(0)}% with rising momentum`, timing: "Immediate — strong momentum" });
    } else if (evenPct >= 58 && oddMomentum <= -2) {
      recs.push({ contractType: "DIGITEVEN", contractLabel: "Even", confidence: Math.min(evenPct + 10, 92), reason: `Even dominance at ${evenPct.toFixed(0)}% with rising momentum`, timing: "Immediate — strong momentum" });
    } else if (oddPct >= 55) {
      recs.push({ contractType: "DIGITODD", contractLabel: "Odd", confidence: oddPct, reason: `Moderate odd bias detected (${oddPct.toFixed(0)}%)`, timing: "Wait for momentum confirmation" });
    } else if (evenPct >= 55) {
      recs.push({ contractType: "DIGITEVEN", contractLabel: "Even", confidence: evenPct, reason: `Moderate even bias detected (${evenPct.toFixed(0)}%)`, timing: "Wait for momentum confirmation" });
    }

    // Over/Under recommendation
    if (dominant.pct >= 13) {
      recs.push({ contractType: "DIGITOVER", contractLabel: `Over ${Math.max(dominant.digit - 1, 0)}`, confidence: Math.min(dominant.pct * 5, 85), reason: `Digit ${dominant.digit} showing ${dominant.pct.toFixed(1)}% probability — elevated`, timing: isHighVol ? "Wait for volatility to settle" : "Current conditions favorable", barrier: String(Math.max(dominant.digit - 1, 0)) });
    }
    if (rare.pct <= 7) {
      recs.push({ contractType: "DIGITUNDER", contractLabel: `Under ${Math.min(rare.digit + 1, 9)}`, confidence: Math.min((10 - rare.pct) * 8, 80), reason: `Digit ${rare.digit} underrepresented at ${rare.pct.toFixed(1)}% — avoid this digit`, timing: "Monitor for reversion", barrier: String(Math.min(rare.digit + 1, 9)) });
    }

    // Rise/Fall based on price movement
    if (tickBuffer.length >= 50) {
      const prices = tickBuffer.slice(-50).map(t => t.quote);
      const avg1 = prices.slice(-10).reduce((a, b) => a + b, 0) / 10;
      const avg2 = prices.slice(-30, -20).reduce((a, b) => a + b, 0) / 10;
      if (avg1 > avg2 * 1.0003) {
        recs.push({ contractType: "CALL", contractLabel: "Rise", confidence: Math.min(60 + volatility * 0.3, 82), reason: "Price showing upward momentum over recent ticks", timing: isHighVol ? "High volatility — higher risk" : "Favorable conditions" });
      } else if (avg1 < avg2 * 0.9997) {
        recs.push({ contractType: "PUT", contractLabel: "Fall", confidence: Math.min(60 + volatility * 0.3, 82), reason: "Price showing downward momentum over recent ticks", timing: isHighVol ? "High volatility — higher risk" : "Favorable conditions" });
      }
    }

    // Overall market assessment
    const avgConfidence = recs.length > 0 ? recs.reduce((s, r) => s + r.confidence, 0) / recs.length : 0;
    const marketCondition = isHighVol ? "High Volatility" : tickSpeed >= 2 ? "Active Market" : "Calm Market";
    const overallStrength = avgConfidence >= 70 ? "Strong" : avgConfidence >= 50 ? "Moderate" : "Weak";

    return {
      recommendations: recs.sort((a, b) => b.confidence - a.confidence).slice(0, 4),
      marketCondition,
      overallStrength,
      avgConfidence,
      volatility,
      tickSpeed,
      oddPct,
      evenPct,
      highPct,
      isAlternating,
      currentStreak,
      dominant,
      rare,
    };
  }, [lastDigits, tickBuffer, signalScore]);

  if (!analysis) {
    return (
      <div className="p-4 rounded-xl bg-card border border-border">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">AI Strategy Optimizer</h3>
        </div>
        <p className="text-xs text-muted-foreground text-center py-6">Collecting market data for AI analysis... Need at least 50 ticks.</p>
      </div>
    );
  }

  const strengthColor = analysis.overallStrength === "Strong" ? "text-buy" : analysis.overallStrength === "Moderate" ? "text-warning" : "text-muted-foreground";

  return (
    <div className="p-4 rounded-xl bg-card border border-border space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">AI Strategy Optimizer</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${analysis.overallStrength === "Strong" ? "bg-buy/10 text-buy border border-buy/20" : analysis.overallStrength === "Moderate" ? "bg-warning/10 text-warning border border-warning/20" : "bg-secondary text-muted-foreground border border-border"}`}>
            {analysis.overallStrength} Signal
          </span>
        </div>
      </div>

      {/* Market Assessment */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: "Market", value: analysis.marketCondition, icon: Activity },
          { label: "Tick Speed", value: `${analysis.tickSpeed.toFixed(1)} t/s`, icon: Zap },
          { label: "Odd/Even", value: `${analysis.oddPct.toFixed(0)}/${analysis.evenPct.toFixed(0)}`, icon: Target },
          { label: "Streak", value: analysis.currentStreak > 1 ? `x${analysis.currentStreak}` : "None", icon: TrendingUp },
        ].map(m => (
          <div key={m.label} className="p-2 rounded-lg bg-secondary/50 text-center">
            <p className="text-[9px] text-muted-foreground">{m.label}</p>
            <p className="text-xs font-bold text-foreground">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      {analysis.recommendations.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Recommended Trades</p>
          {analysis.recommendations.map((rec, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`p-3 rounded-lg border ${i === 0 ? "bg-buy/5 border-buy/20" : "bg-secondary/30 border-border"}`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {i === 0 && <Zap className="w-3 h-3 text-buy" />}
                  <span className="text-xs font-bold text-foreground">{rec.contractLabel}</span>
                  <span className={`text-[10px] font-bold ${rec.confidence >= 70 ? "text-buy" : rec.confidence >= 50 ? "text-warning" : "text-muted-foreground"}`}>
                    {rec.confidence.toFixed(0)}%
                  </span>
                </div>
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
              </div>
              <p className="text-[10px] text-muted-foreground">{rec.reason}</p>
              <div className="flex items-center gap-1 mt-1">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">{rec.timing}</span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4">
          <Shield className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">No strong signals detected. Market conditions are neutral.</p>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-[9px] text-muted-foreground text-center">
        AI recommendations are based on statistical analysis. Not financial advice. Trade responsibly.
      </p>
    </div>
  );
};

// Need Activity import for the market assessment section
import { Activity } from "lucide-react";

export default AIOptimizer;
