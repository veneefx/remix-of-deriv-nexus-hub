import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, X, ChevronRight, Brain, Target, Activity, Gauge, Scan, Eye, Zap, BarChart3, Flame, Shield, FlaskConical } from "lucide-react";

interface Section {
  title: string;
  icon: React.ReactNode;
  content: string[];
}

const BOOKLET_SECTIONS: Section[] = [
  {
    title: "Balanced Strategy",
    icon: <Target className="w-4 h-4" />,
    content: [
      "The default strategy that balances speed and accuracy.",
      "Uses a weighted confluence score: Frequency (25%), Pressure (30%), Streak (15%), Pattern (15%), Volatility (15%).",
      "Trades when the combined signal score exceeds 15%.",
      "Supports Martingale recovery with configurable multiplier and max steps.",
      "Best for: Steady, consistent trading with moderate risk.",
    ],
  },
  {
    title: "Aggressive Strategy",
    icon: <Flame className="w-4 h-4" />,
    content: [
      "Fires trades at a much lower signal threshold (5%).",
      "Designed for high-frequency execution — trades on nearly every tick.",
      "Supports up to 15 concurrent open contracts.",
      "Best for: Maximizing trade volume in volatile markets.",
      "⚠️ Higher risk — use with proper Stop Loss settings.",
    ],
  },
  {
    title: "ELIT Strategy (Elite)",
    icon: <Brain className="w-4 h-4" />,
    content: [
      "The most intelligent multi-layer digit analysis engine.",
      "Layer 1 — Frequency Analysis: Detects rare (<5%) and dominant (>15%) digits.",
      "Layer 2 — Momentum Shift: Compares odd/even ratio between recent and older tick windows.",
      "Layer 3 — Streak Detection: Identifies repeating digits (streak ≥ 2) for reversal probability.",
      "Layer 4 — Digit Clustering: Detects high-digit (7,8,9) or low-digit (0,1,2) clusters.",
      "Layer 5 — Tick Speed: Measures ticks/sec to weight signal strength.",
      "Scores each layer (max 25+20+20+20+15 = 100). Trades only when confluence ≥ 70%.",
      "Auto-selects contract type based on strongest signal (Odd/Even, Over/Under, Differs).",
      "Best for: Premium users wanting intelligent, data-driven trades.",
    ],
  },
  {
    title: "Conservative Strategy",
    icon: <Shield className="w-4 h-4" />,
    content: [
      "Requires a higher signal threshold (25%) before trading.",
      "Fewer trades, but higher confidence per trade.",
      "Best for: Risk-averse traders who prioritize win rate over volume.",
    ],
  },
  {
    title: "Digit Edge (Live Trading)",
    icon: <Activity className="w-4 h-4" />,
    content: [
      "The main trading interface showing real-time digit analysis.",
      "Digit Circles: Visual history of the last 100 digits with color-coded frequency.",
      "Signal Strength: Live composite score showing trade readiness.",
      "Digit Pressure: Tracks how long each digit has been absent — higher pressure = higher breakout probability.",
      "Live Probability Engine: Predicts next digit probabilities using short-term (50) and long-term (300) tick windows.",
      "Quant Terminal: Includes Heatmap Matrix, Flow Analyzer, Pattern Radar, and AI Insights.",
    ],
  },
  {
    title: "Analysis Terminal",
    icon: <BarChart3 className="w-4 h-4" />,
    content: [
      "Premium-only deep market intelligence dashboard.",
      "Volatility Scanner: Measures price movement intensity (Low → Extreme).",
      "Tick Speed Monitor: Tracks ticks/sec to gauge market activity.",
      "Digit Pressure Balance: Even vs Odd distribution meter.",
      "Pattern Recognition: Detects alternating cycles, pairs, and repeating structures.",
      "Digit Cycle Detector: Identifies dominant odd/even/high/low cycles.",
      "Probability Projection: Full 0-9 probability table from a 300-tick window.",
      "Confluence Radar: Merges all signals into a single trade confidence score.",
      "AI Optimizer: Auto-recommends contract type and timing based on real-time conditions.",
      "Institution Tools: Order flow analysis, tick velocity divergence, and smart money detection.",
    ],
  },
  {
    title: "Live Probability Engine",
    icon: <Eye className="w-4 h-4" />,
    content: [
      "Real-time statistical predictor for the next digit (0–9).",
      "Top 3 Predictions: Shows the three most probable digits with confidence %.",
      "Short-Term vs Long-Term: Compares 50-tick and 300-tick probability windows.",
      "Momentum Indicator: Detects digits with rapidly rising probability.",
      "Rare Digit Alert: Flags digits absent for 20+ ticks (mean reversion signal).",
      "Odd/Even Bias Meter: Shows market bias toward odd or even digits.",
      "High/Low Bias: Tracks dominance of digits 0-4 vs 5-9.",
    ],
  },
  {
    title: "Digit Heatmap Matrix",
    icon: <Scan className="w-4 h-4" />,
    content: [
      "Visualizes digit frequency over time as a color-coded grid.",
      "Vertical axis: Digits 0–9. Horizontal axis: Time blocks (20 ticks each).",
      "Dark cells = high frequency, light cells = low frequency.",
      "Reveals digit clustering patterns invisible in raw data.",
      "Updates in real-time as new ticks arrive.",
    ],
  },
  {
    title: "Confluence Engine",
    icon: <Gauge className="w-4 h-4" />,
    content: [
      "Combines 6 independent signals into one master score (0–100%).",
      "Digit Imbalance (20%): How far digit distribution deviates from expected 10% each.",
      "Momentum Shift (20%): Change in odd/even ratio between recent and older ticks.",
      "Pattern Strength (20%): Frequency of repeating structures (doubles, triples).",
      "Volatility (15%): Average tick-to-tick price change.",
      "Tick Speed (15%): Market activity rate (ticks per second).",
      "Probability Bias (10%): Gap between most and least frequent digits.",
      "Signal Strength: Weak (<30), Developing (30-49), Moderate (50-69), Strong (70+).",
    ],
  },
  {
    title: "Strategy Lab",
    icon: <FlaskConical className="w-4 h-4" />,
    content: [
      "Backtesting simulator for testing strategies on historical tick data.",
      "Loads up to 5,000 historical ticks from any Deriv synthetic market.",
      "Configure entry conditions: dominance, streaks, volatility, imbalance, momentum.",
      "Simulates trades and calculates Win Rate, Max Drawdown, Net Profit.",
      "Playback controls: Play, Pause, Step Forward, Reset with variable speed.",
      "Strategy Score (0–100): Rates strategy on win rate, drawdown, profit, consistency.",
      "Save & Load: Store strategies locally and reload for retesting.",
      "Optimization Suggestions: Auto-generated tips to improve strategy performance.",
    ],
  },
  {
    title: "Market Scanner",
    icon: <Zap className="w-4 h-4" />,
    content: [
      "Scans multiple volatility markets simultaneously for trading opportunities.",
      "Ranks markets by confluence score, volatility, momentum, and pattern strength.",
      "Opportunity levels: 🔥 Hot, ⚡ Active, 💤 Quiet.",
      "Deep Analysis: Click any market for detailed digit distribution, cycles, and projections.",
      "Opportunity Radar: SVG visualization of top 5 markets.",
      "Best for: Finding which market has the strongest trading conditions right now.",
    ],
  },
  {
    title: "Continuous Execution Mode",
    icon: <Zap className="w-4 h-4" />,
    content: [
      "High-frequency trading engine that fires trades on every qualifying tick.",
      "No trade locks, no cooldowns, no loss streak stops.",
      "Supports up to 15 simultaneous open contracts.",
      "Rate limited to 10 trades/second for WebSocket stability.",
      "Trades/sec counter and open contracts display shown in real-time.",
      "Only stops on: User press STOP, Take Profit hit, or Stop Loss hit.",
      "Stake always reads from user configuration — never resets internally.",
    ],
  },
  {
    title: "Risk Management",
    icon: <Shield className="w-4 h-4" />,
    content: [
      "Take Profit: Bot auto-stops when session profit reaches target.",
      "Stop Loss: Bot auto-stops when session loss reaches limit.",
      "Martingale: Doubles stake after losses to recover. Configurable multiplier (default 2.2x).",
      "Max Martingale Steps: Limits recovery depth (default 10 steps).",
      "Smart Risker: Secures partial profits at configurable thresholds.",
      "Frequency-Based Trading: Only trades when digit frequency exceeds threshold.",
      "⚠️ Always set Stop Loss. Never risk more than you can afford to lose.",
    ],
  },
];

const StrategyBooklet = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

  return (
    <>
      {/* Floating Booklet Button — bottom-left */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 left-4 z-40 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:shadow-xl"
        whileHover={{ scale: 1.1, rotate: -5 }}
        whileTap={{ scale: 0.9 }}
        animate={{ y: [0, -4, 0] }}
        transition={{ y: { repeat: Infinity, duration: 2.5, ease: "easeInOut" } }}
        title="Strategy Guide"
      >
        <BookOpen className="w-5 h-5" />
      </motion.button>

      {/* Booklet Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-background/40 backdrop-blur-[2px]"
              onClick={() => setIsOpen(false)}
            />

            {/* Booklet */}
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed bottom-4 left-4 right-4 z-50 max-w-lg max-h-[70vh] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-foreground">DNexus Strategy Guide</h2>
                    <p className="text-[10px] text-muted-foreground">How everything works — tap to expand</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
                {BOOKLET_SECTIONS.map((section, idx) => (
                  <div key={idx} className="rounded-xl border border-border overflow-hidden">
                    <button
                      onClick={() => setExpandedSection(expandedSection === idx ? null : idx)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left"
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${expandedSection === idx ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"}`}>
                        {section.icon}
                      </div>
                      <span className="text-xs font-semibold text-foreground flex-1">{section.title}</span>
                      <motion.div
                        animate={{ rotate: expandedSection === idx ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </motion.div>
                    </button>

                    <AnimatePresence initial={false}>
                      {expandedSection === idx && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 space-y-2 border-t border-border pt-3">
                            {section.content.map((line, li) => (
                              <p key={li} className="text-[11px] text-muted-foreground leading-relaxed pl-3 border-l-2 border-primary/20">
                                {line}
                              </p>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}

                {/* Footer note */}
                <p className="text-[9px] text-muted-foreground text-center pt-3 pb-1">
                  ⚠️ All analysis is for guidance only. Not financial advice. Trade responsibly.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default StrategyBooklet;
