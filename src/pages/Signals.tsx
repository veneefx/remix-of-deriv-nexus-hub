import { useState } from "react";
import { motion } from "framer-motion";
import { HelpCircle, Power } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const MARKET_CATEGORIES = ["Derived"];

const SYMBOLS = [
  { symbol: "1HZ10V", label: "Volatility 10 (1s) Index", signal: "NEUTRAL" },
  { symbol: "R_10", label: "Volatility 10 Index", signal: "SELL" },
  { symbol: "1HZ100V", label: "Volatility 100 (1s) Index", signal: "NEUTRAL" },
  { symbol: "R_100", label: "Volatility 100 Index", signal: "SELL" },
  { symbol: "1HZ25V", label: "Volatility 25 (1s) Index", signal: "NEUTRAL" },
  { symbol: "R_25", label: "Volatility 25 Index", signal: "NEUTRAL" },
  { symbol: "1HZ50V", label: "Volatility 50 (1s) Index", signal: "NEUTRAL" },
  { symbol: "R_50", label: "Volatility 50 Index", signal: "NEUTRAL" },
  { symbol: "1HZ75V", label: "Volatility 75 (1s) Index", signal: "NEUTRAL" },
  { symbol: "R_75", label: "Volatility 75 Index", signal: "BUY" },
];

const TIMEFRAMES = ["M1", "M5", "M15", "M30", "H1", "H4", "D1"];

const OSCILLATORS = [
  { name: "Relative Strength Index (14)", value: "52.97", signal: "NEUTRAL" },
  { name: "Stochastic %K (14, 3, 3)", value: "55.86", signal: "NEUTRAL" },
  { name: "Commodity Channel Index (20)", value: "-23.00", signal: "NEUTRAL" },
  { name: "Average Directional Index (14)", value: "11.19", signal: "NEUTRAL" },
  { name: "Awesome Oscillator", value: "-0.02", signal: "SELL" },
  { name: "Momentum (10)", value: "0.00", signal: "BUY" },
  { name: "MACD Level (12, 26)", value: "0.31", signal: "SELL" },
  { name: "Stochastic RSI Fast (3, 3, 14, 14)", value: "57.62", signal: "NEUTRAL" },
  { name: "Williams Percent Range (14)", value: "-44.14", signal: "NEUTRAL" },
  { name: "Bull Bear Power", value: "1.34", signal: "NEUTRAL" },
];

const MOVING_AVERAGES = [
  { period: "EMA (20)", value: "9410.70", signal: "BUY" },
  { period: "SMA (20)", value: "9410.91", signal: "BUY" },
  { period: "EMA (50)", value: "9409.86", signal: "BUY" },
  { period: "SMA (50)", value: "9408.78", signal: "BUY" },
  { period: "EMA (200)", value: "9416.66", signal: "SELL" },
  { period: "SMA (200)", value: "9416.11", signal: "SELL" },
];

type SignalType = "STRONG SELL" | "SELL" | "NEUTRAL" | "BUY" | "STRONG BUY";

const GaugeChart = ({ label, signal }: { label: string; signal: SignalType }) => {
  const signalMap: Record<SignalType, number> = {
    "STRONG SELL": -90, "SELL": -45, "NEUTRAL": 0, "BUY": 45, "STRONG BUY": 90,
  };
  const rotation = signalMap[signal] || 0;
  const signalColor = signal.includes("BUY") ? "text-buy" : signal.includes("SELL") ? "text-sell" : "text-muted-foreground";

  return (
    <div className="p-6 rounded-xl bg-card border border-border">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-semibold text-foreground">{label}</h3>
        <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
      </div>
      <div className="flex justify-center">
        <div className="relative w-48 h-28">
          {/* Gauge arc */}
          <svg viewBox="0 0 200 110" className="w-full h-full">
            <defs>
              <linearGradient id={`gauge-${label}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--sell))" />
                <stop offset="25%" stopColor="hsl(var(--sell))" />
                <stop offset="50%" stopColor="hsl(var(--muted-foreground))" />
                <stop offset="75%" stopColor="hsl(var(--buy))" />
                <stop offset="100%" stopColor="hsl(var(--buy))" />
              </linearGradient>
            </defs>
            <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke={`url(#gauge-${label})`} strokeWidth="8" strokeLinecap="round" />
            {/* Needle */}
            <g transform={`rotate(${rotation}, 100, 100)`}>
              <line x1="100" y1="100" x2="100" y2="35" stroke="hsl(var(--foreground))" strokeWidth="2" />
              <circle cx="100" cy="100" r="4" fill="hsl(var(--muted-foreground))" />
            </g>
            {/* Labels */}
            <text x="10" y="108" className="text-[8px]" fill="hsl(var(--muted-foreground))">STRONG{"\n"}SELL</text>
            <text x="40" y="50" className="text-[8px]" fill="hsl(var(--muted-foreground))">SELL</text>
            <text x="88" y="30" className="text-[8px]" fill="hsl(var(--muted-foreground))">NEUTRAL</text>
            <text x="150" y="50" className="text-[8px]" fill="hsl(var(--muted-foreground))">BUY</text>
            <text x="155" y="108" className="text-[8px]" fill="hsl(var(--muted-foreground))">STRONG{"\n"}BUY</text>
          </svg>
        </div>
      </div>
      <p className={`text-center text-sm font-bold mt-2 ${signalColor}`}>{signal}</p>
    </div>
  );
};

const Signals = () => {
  const [selectedSymbol, setSelectedSymbol] = useState(SYMBOLS[0]);
  const [selectedTimeframe, setSelectedTimeframe] = useState("M1");

  const getSignalColor = (s: string) => {
    if (s === "BUY" || s === "STRONG BUY") return "text-buy";
    if (s === "SELL" || s === "STRONG SELL") return "text-sell";
    return "text-muted-foreground";
  };

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Navbar />

      <div className="container py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 p-4 rounded-xl bg-card border border-border">
          <h1 className="text-lg font-bold text-foreground">Premium Signals</h1>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-success"><span className="w-2 h-2 rounded-full bg-success" /> Connected</span>
            <HelpCircle className="w-4 h-4 text-muted-foreground cursor-pointer" />
            <Power className="w-4 h-4 text-muted-foreground cursor-pointer" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Market symbols */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Market Categories</h3>
              {MARKET_CATEGORIES.map((c) => (
                <button key={c} className="w-full text-left px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg font-medium">{c}</button>
              ))}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Symbols</h3>
              <div className="grid grid-cols-2 gap-2">
                {SYMBOLS.map((s) => (
                  <button
                    key={s.symbol}
                    onClick={() => setSelectedSymbol(s)}
                    className={`p-2 rounded-lg text-xs text-center border transition-colors ${
                      selectedSymbol.symbol === s.symbol ? "bg-primary/20 border-primary" : "bg-card border-border hover:border-primary/30"
                    }`}
                  >
                    <p className="font-medium text-foreground truncate">{s.label}</p>
                    <p className={`text-[10px] font-bold mt-1 ${getSignalColor(s.signal)}`}>{s.signal}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Selected symbol header */}
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-sm font-bold text-foreground">{selectedSymbol.label} ({selectedSymbol.symbol})</h2>
                <span className="text-xs text-muted-foreground">Next update in 0:01</span>
              </div>
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-2">Timeframes</p>
                <div className="flex gap-2 flex-wrap">
                  {TIMEFRAMES.map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setSelectedTimeframe(tf)}
                      className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                        selectedTimeframe === tf ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Gauges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <GaugeChart label="Summary" signal="NEUTRAL" />
              <GaugeChart label="Oscillators" signal="NEUTRAL" />
              <GaugeChart label="Moving Averages" signal="BUY" />
            </div>

            {/* Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Oscillators */}
              <div className="p-5 rounded-xl bg-card border border-border">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">📈 Oscillators Analysis</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-2 text-xs font-medium text-primary">INDICATOR</th>
                        <th className="text-right py-2 px-2 text-xs font-medium text-primary">VALUE</th>
                        <th className="text-right py-2 px-2 text-xs font-medium text-primary">SIGNAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {OSCILLATORS.map((o) => (
                        <tr key={o.name} className="border-b border-border/50">
                          <td className="py-2 px-2 text-xs text-foreground">{o.name}</td>
                          <td className="py-2 px-2 text-xs text-right text-muted-foreground">{o.value}</td>
                          <td className={`py-2 px-2 text-xs text-right font-bold ${getSignalColor(o.signal)}`}>{o.signal}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Moving Averages */}
              <div className="p-5 rounded-xl bg-card border border-border">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">📊 Moving Averages Analysis</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-2 text-xs font-medium text-primary">PERIOD</th>
                        <th className="text-right py-2 px-2 text-xs font-medium text-primary">VALUE</th>
                        <th className="text-right py-2 px-2 text-xs font-medium text-primary">SIGNAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MOVING_AVERAGES.map((ma) => (
                        <tr key={ma.period} className="border-b border-border/50">
                          <td className="py-2 px-2 text-xs text-foreground">{ma.period}</td>
                          <td className="py-2 px-2 text-xs text-right text-muted-foreground">{ma.value}</td>
                          <td className={`py-2 px-2 text-xs text-right font-bold ${getSignalColor(ma.signal)}`}>{ma.signal}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Signals;
