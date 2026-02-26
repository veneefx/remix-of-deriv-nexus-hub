import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { HelpCircle, Power, Wifi, WifiOff, RefreshCw } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DerivWebSocket from "@/services/deriv-websocket";
import { getLastDigit } from "@/lib/trading-constants";
import { supabase } from "@/integrations/supabase/client";

const MARKET_CATEGORIES = ["Derived"];

const SYMBOLS = [
  { symbol: "1HZ10V", label: "Volatility 10 (1s) Index" },
  { symbol: "R_10", label: "Volatility 10 Index" },
  { symbol: "1HZ100V", label: "Volatility 100 (1s) Index" },
  { symbol: "R_100", label: "Volatility 100 Index" },
  { symbol: "1HZ25V", label: "Volatility 25 (1s) Index" },
  { symbol: "R_25", label: "Volatility 25 Index" },
  { symbol: "1HZ50V", label: "Volatility 50 (1s) Index" },
  { symbol: "R_50", label: "Volatility 50 Index" },
  { symbol: "1HZ75V", label: "Volatility 75 (1s) Index" },
  { symbol: "R_75", label: "Volatility 75 Index" },
];

const TIMEFRAMES = ["M1", "M5", "M15", "M30", "H1", "H4", "D1"];

type SignalType = "STRONG SELL" | "SELL" | "NEUTRAL" | "BUY" | "STRONG BUY";

// Calculate RSI from prices
const calcRSI = (prices: number[], period = 14): number => {
  if (prices.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = prices.length - period; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff > 0) gains += diff; else losses -= diff;
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
};

// Simple Moving Average
const calcSMA = (prices: number[], period: number): number => {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  const slice = prices.slice(-period);
  return slice.reduce((s, v) => s + v, 0) / period;
};

// Exponential Moving Average
const calcEMA = (prices: number[], period: number): number => {
  if (prices.length < period) return calcSMA(prices, prices.length);
  const k = 2 / (period + 1);
  let ema = calcSMA(prices.slice(0, period), period);
  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  return ema;
};

// Stochastic %K
const calcStochastic = (prices: number[], period = 14): number => {
  if (prices.length < period) return 50;
  const slice = prices.slice(-period);
  const high = Math.max(...slice);
  const low = Math.min(...slice);
  if (high === low) return 50;
  return ((prices[prices.length - 1] - low) / (high - low)) * 100;
};

// CCI
const calcCCI = (prices: number[], period = 20): number => {
  if (prices.length < period) return 0;
  const tp = prices.slice(-period);
  const mean = tp.reduce((s, v) => s + v, 0) / period;
  const meanDev = tp.reduce((s, v) => s + Math.abs(v - mean), 0) / period;
  if (meanDev === 0) return 0;
  return (prices[prices.length - 1] - mean) / (0.015 * meanDev);
};

// Momentum
const calcMomentum = (prices: number[], period = 10): number => {
  if (prices.length < period + 1) return 0;
  return prices[prices.length - 1] - prices[prices.length - 1 - period];
};

// MACD
const calcMACD = (prices: number[]): number => {
  return calcEMA(prices, 12) - calcEMA(prices, 26);
};

// Awesome Oscillator
const calcAO = (prices: number[]): number => {
  return calcSMA(prices, 5) - calcSMA(prices, 34);
};

const getSignalFromValue = (name: string, value: number): string => {
  if (name.includes("RSI")) return value > 70 ? "SELL" : value < 30 ? "BUY" : "NEUTRAL";
  if (name.includes("Stochastic")) return value > 80 ? "SELL" : value < 20 ? "BUY" : "NEUTRAL";
  if (name.includes("CCI")) return value > 100 ? "BUY" : value < -100 ? "SELL" : "NEUTRAL";
  if (name.includes("Momentum")) return value > 0 ? "BUY" : value < 0 ? "SELL" : "NEUTRAL";
  if (name.includes("MACD")) return value > 0 ? "BUY" : value < 0 ? "SELL" : "NEUTRAL";
  if (name.includes("Awesome")) return value > 0 ? "BUY" : value < 0 ? "SELL" : "NEUTRAL";
  if (name.includes("Williams")) return value < -80 ? "BUY" : value > -20 ? "SELL" : "NEUTRAL";
  return "NEUTRAL";
};

const getMASignal = (price: number, maValue: number): string => {
  return price > maValue ? "BUY" : price < maValue ? "SELL" : "NEUTRAL";
};

const getSummarySignal = (signals: string[]): SignalType => {
  const buy = signals.filter((s) => s === "BUY").length;
  const sell = signals.filter((s) => s === "SELL").length;
  const total = signals.length;
  if (buy > total * 0.6) return "STRONG BUY";
  if (buy > total * 0.4) return "BUY";
  if (sell > total * 0.6) return "STRONG SELL";
  if (sell > total * 0.4) return "SELL";
  return "NEUTRAL";
};

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
      </div>
      <div className="flex justify-center">
        <div className="relative w-48 h-28">
          <svg viewBox="0 0 200 110" className="w-full h-full">
            <defs>
              <linearGradient id={`gauge-${label.replace(/\s/g, "")}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--sell))" />
                <stop offset="25%" stopColor="hsl(var(--sell))" />
                <stop offset="50%" stopColor="hsl(var(--muted-foreground))" />
                <stop offset="75%" stopColor="hsl(var(--buy))" />
                <stop offset="100%" stopColor="hsl(var(--buy))" />
              </linearGradient>
            </defs>
            <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke={`url(#gauge-${label.replace(/\s/g, "")})`} strokeWidth="8" strokeLinecap="round" />
            <g transform={`rotate(${rotation}, 100, 100)`}>
              <line x1="100" y1="100" x2="100" y2="35" stroke="hsl(var(--foreground))" strokeWidth="2" />
              <circle cx="100" cy="100" r="4" fill="hsl(var(--muted-foreground))" />
            </g>
            <text x="5" y="108" className="text-[7px]" fill="hsl(var(--muted-foreground))">STRONG SELL</text>
            <text x="42" y="50" className="text-[8px]" fill="hsl(var(--muted-foreground))">SELL</text>
            <text x="82" y="30" className="text-[8px]" fill="hsl(var(--muted-foreground))">NEUTRAL</text>
            <text x="150" y="50" className="text-[8px]" fill="hsl(var(--muted-foreground))">BUY</text>
            <text x="148" y="108" className="text-[7px]" fill="hsl(var(--muted-foreground))">STRONG BUY</text>
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
  const [prices, setPrices] = useState<number[]>([]);
  const [connected, setConnected] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [appId, setAppId] = useState<string>("68014");
  const wsRef = useRef<DerivWebSocket | null>(null);

  // Fetch app ID from backend
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("deriv-proxy", {
          body: { action: "get_config" },
        });
        if (data?.app_id) setAppId(data.app_id);
      } catch {}
    };
    fetchConfig();
  }, []);

  // Connect to WebSocket for tick data
  useEffect(() => {
    const ws = new DerivWebSocket(appId);
    wsRef.current = ws;

    ws.connect().then(() => {
      setConnected(true);
      ws.subscribeTicks(selectedSymbol.symbol);
    }).catch(() => setConnected(false));

    ws.on("tick", (data) => {
      if (data.tick?.quote) {
        setPrices((prev) => {
          const next = [...prev, data.tick.quote];
          return next.length > 500 ? next.slice(-500) : next;
        });
      }
    });

    ws.on("connection", (data) => {
      setConnected(data.status === "connected");
    });

    return () => {
      ws.disconnect();
    };
  }, [selectedSymbol.symbol, appId]);

  // Reset prices on symbol change
  useEffect(() => {
    setPrices([]);
  }, [selectedSymbol.symbol]);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => (prev <= 0 ? 60 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate indicators from live prices
  const oscillators = useMemo(() => {
    if (prices.length < 20) return [];
    const rsi = calcRSI(prices, 14);
    const stoch = calcStochastic(prices, 14);
    const cci = calcCCI(prices, 20);
    const momentum = calcMomentum(prices, 10);
    const macd = calcMACD(prices);
    const ao = calcAO(prices);
    const williamsR = -(100 - calcStochastic(prices, 14));
    const stochRSI = calcStochastic(
      Array.from({ length: Math.min(prices.length, 50) }, (_, i) => calcRSI(prices.slice(0, prices.length - 50 + i + 14), 14)),
      14
    );

    return [
      { name: "Relative Strength Index (14)", value: rsi.toFixed(2), signal: getSignalFromValue("RSI", rsi) },
      { name: "Stochastic %K (14, 3, 3)", value: stoch.toFixed(2), signal: getSignalFromValue("Stochastic", stoch) },
      { name: "Commodity Channel Index (20)", value: cci.toFixed(2), signal: getSignalFromValue("CCI", cci) },
      { name: "Awesome Oscillator", value: ao.toFixed(4), signal: getSignalFromValue("Awesome", ao) },
      { name: "Momentum (10)", value: momentum.toFixed(4), signal: getSignalFromValue("Momentum", momentum) },
      { name: "MACD Level (12, 26)", value: macd.toFixed(4), signal: getSignalFromValue("MACD", macd) },
      { name: "Williams Percent Range (14)", value: williamsR.toFixed(2), signal: getSignalFromValue("Williams", williamsR) },
    ];
  }, [prices]);

  const movingAverages = useMemo(() => {
    if (prices.length < 20) return [];
    const currentPrice = prices[prices.length - 1];
    return [
      { period: "EMA (10)", value: calcEMA(prices, 10).toFixed(2), signal: getMASignal(currentPrice, calcEMA(prices, 10)) },
      { period: "SMA (10)", value: calcSMA(prices, 10).toFixed(2), signal: getMASignal(currentPrice, calcSMA(prices, 10)) },
      { period: "EMA (20)", value: calcEMA(prices, 20).toFixed(2), signal: getMASignal(currentPrice, calcEMA(prices, 20)) },
      { period: "SMA (20)", value: calcSMA(prices, 20).toFixed(2), signal: getMASignal(currentPrice, calcSMA(prices, 20)) },
      { period: "EMA (50)", value: calcEMA(prices, Math.min(50, prices.length)).toFixed(2), signal: getMASignal(currentPrice, calcEMA(prices, Math.min(50, prices.length))) },
      { period: "SMA (50)", value: calcSMA(prices, Math.min(50, prices.length)).toFixed(2), signal: getMASignal(currentPrice, calcSMA(prices, Math.min(50, prices.length))) },
    ];
  }, [prices]);

  const oscSignals = oscillators.map((o) => o.signal);
  const maSignals = movingAverages.map((m) => m.signal);
  const allSignals = [...oscSignals, ...maSignals];

  const summarySignal = getSummarySignal(allSignals);
  const oscSummary = getSummarySignal(oscSignals);
  const maSummary = getSummarySignal(maSignals);

  // Per-symbol quick signal
  const symbolSignals = useMemo(() => {
    const map: Record<string, string> = {};
    SYMBOLS.forEach((s) => {
      if (s.symbol === selectedSymbol.symbol) {
        map[s.symbol] = summarySignal;
      } else {
        map[s.symbol] = "NEUTRAL";
      }
    });
    return map;
  }, [selectedSymbol.symbol, summarySignal]);

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
            <span className={`flex items-center gap-1.5 text-xs ${connected ? "text-success" : "text-sell"}`}>
              {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {connected ? "Live" : "Disconnected"}
            </span>
            <span className="text-xs text-muted-foreground">{prices.length} ticks</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
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
                    <p className={`text-[10px] font-bold mt-1 ${getSignalColor(symbolSignals[s.symbol] || "NEUTRAL")}`}>
                      {symbolSignals[s.symbol] || "NEUTRAL"}
                    </p>
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
                <div>
                  <h2 className="text-sm font-bold text-foreground">{selectedSymbol.label} ({selectedSymbol.symbol})</h2>
                  {prices.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Current: <span className="text-foreground font-semibold">{prices[prices.length - 1]?.toFixed(2)}</span>
                    </p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <RefreshCw className={`w-3 h-3 ${connected ? "animate-spin" : ""}`} style={{ animationDuration: "3s" }} />
                  {countdown}s
                </span>
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

            {/* Loading state */}
            {prices.length < 20 && (
              <div className="p-8 rounded-xl bg-card border border-border text-center">
                <RefreshCw className="w-8 h-8 text-primary mx-auto mb-3 animate-spin" />
                <p className="text-sm text-foreground font-semibold">Collecting tick data...</p>
                <p className="text-xs text-muted-foreground mt-1">{prices.length}/20 ticks received. Indicators will appear shortly.</p>
              </div>
            )}

            {/* Gauges */}
            {prices.length >= 20 && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <GaugeChart label="Summary" signal={summarySignal} />
                  <GaugeChart label="Oscillators" signal={oscSummary} />
                  <GaugeChart label="Moving Averages" signal={maSummary} />
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
                          {oscillators.map((o) => (
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
                          {movingAverages.map((ma) => (
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
              </>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Signals;
