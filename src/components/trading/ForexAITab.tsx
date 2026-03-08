import { useState, useEffect, useRef, useMemo } from "react";
import { Brain, TrendingUp, TrendingDown, Minus, Activity, Target, Zap, BarChart3, Globe, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import DerivWebSocket from "@/services/deriv-websocket";

const ALL_FOREX = [
  { symbol: "frxEURUSD", ticker: "EUR/USD", category: "Major" },
  { symbol: "frxGBPUSD", ticker: "GBP/USD", category: "Major" },
  { symbol: "frxUSDJPY", ticker: "USD/JPY", category: "Major" },
  { symbol: "frxUSDCHF", ticker: "USD/CHF", category: "Major" },
  { symbol: "frxAUDUSD", ticker: "AUD/USD", category: "Major" },
  { symbol: "frxUSDCAD", ticker: "USD/CAD", category: "Major" },
  { symbol: "frxNZDUSD", ticker: "NZD/USD", category: "Major" },
  { symbol: "frxEURGBP", ticker: "EUR/GBP", category: "Cross" },
  { symbol: "frxEURJPY", ticker: "EUR/JPY", category: "Cross" },
  { symbol: "frxGBPJPY", ticker: "GBP/JPY", category: "Cross" },
  { symbol: "frxAUDJPY", ticker: "AUD/JPY", category: "Cross" },
  { symbol: "frxEURAUD", ticker: "EUR/AUD", category: "Cross" },
  { symbol: "frxAUDCAD", ticker: "AUD/CAD", category: "Cross" },
  { symbol: "frxEURCAD", ticker: "EUR/CAD", category: "Cross" },
  { symbol: "frxAUDCHF", ticker: "AUD/CHF", category: "Cross" },
  { symbol: "frxAUDNZD", ticker: "AUD/NZD", category: "Cross" },
  { symbol: "frxEURCHF", ticker: "EUR/CHF", category: "Cross" },
  { symbol: "frxEURNZD", ticker: "EUR/NZD", category: "Cross" },
  { symbol: "frxGBPAUD", ticker: "GBP/AUD", category: "Cross" },
  { symbol: "frxGBPCAD", ticker: "GBP/CAD", category: "Cross" },
  { symbol: "frxGBPCHF", ticker: "GBP/CHF", category: "Cross" },
  { symbol: "frxGBPNZD", ticker: "GBP/NZD", category: "Cross" },
  { symbol: "frxNZDCAD", ticker: "NZD/CAD", category: "Cross" },
  { symbol: "frxNZDJPY", ticker: "NZD/JPY", category: "Cross" },
  { symbol: "frxCADJPY", ticker: "CAD/JPY", category: "Cross" },
  { symbol: "frxCADCHF", ticker: "CAD/CHF", category: "Cross" },
  { symbol: "frxCHFJPY", ticker: "CHF/JPY", category: "Cross" },
];

interface TickStore {
  prices: number[];
  lastPrice: number;
  momentum: number;
  volatility: number;
  strength: number;
  bias: "bullish" | "bearish" | "neutral";
}

const DERIV_APP_ID = "129344";
const PIE_COLORS = [
  "hsl(var(--primary))", "hsl(142, 71%, 45%)", "hsl(48, 96%, 53%)",
  "hsl(200, 98%, 48%)", "hsl(280, 68%, 55%)", "hsl(330, 80%, 55%)",
  "hsl(170, 75%, 41%)", "hsl(25, 95%, 53%)",
];

const ForexAITab = () => {
  const [stores, setStores] = useState<Record<string, TickStore>>({});
  const [connected, setConnected] = useState(false);
  const [selectedPair, setSelectedPair] = useState<string | null>(null);
  const wsRef = useRef<DerivWebSocket | null>(null);

  useEffect(() => {
    const ws = new DerivWebSocket(DERIV_APP_ID);
    wsRef.current = ws;

    ws.on("connection", (msg) => {
      if (msg.status === "connected") {
        setConnected(true);
        ALL_FOREX.forEach(({ symbol }) => ws.subscribeTicks(symbol));
      } else {
        setConnected(false);
      }
    });

    ws.on("tick", (msg) => {
      if (!msg.tick) return;
      const { symbol, quote } = msg.tick;
      const pair = ALL_FOREX.find(f => f.symbol === symbol);
      if (!pair) return;

      setStores(prev => {
        const existing = prev[pair.ticker];
        const prices = [...(existing?.prices || []), quote].slice(-200);

        // Momentum: SMA10 vs SMA30
        let momentum = 0;
        if (prices.length >= 30) {
          const sma10 = prices.slice(-10).reduce((a, b) => a + b, 0) / 10;
          const sma30 = prices.slice(-30).reduce((a, b) => a + b, 0) / 30;
          momentum = ((sma10 - sma30) / sma30) * 10000;
        }

        // Volatility
        let volatility = 0;
        if (prices.length >= 20) {
          let sum = 0;
          for (let i = prices.length - 19; i < prices.length; i++) sum += Math.abs(prices[i] - prices[i - 1]);
          volatility = (sum / 19) * 100000;
        }

        // Strength score
        const strength = Math.min(Math.round(
          Math.min(Math.abs(momentum) * 8, 40) +
          Math.min(volatility * 0.6, 30) +
          Math.min(prices.length / 5, 30)
        ), 100);

        const bias: "bullish" | "bearish" | "neutral" = momentum > 0.5 ? "bullish" : momentum < -0.5 ? "bearish" : "neutral";

        return {
          ...prev,
          [pair.ticker]: { prices, lastPrice: quote, momentum, volatility, strength, bias },
        };
      });
    });

    ws.connect().catch(console.error);
    return () => { ws.disconnect(); };
  }, []);

  const analysis = useMemo(() => {
    const entries = Object.entries(stores).filter(([, s]) => s.prices.length >= 10);
    const bullish = entries.filter(([, s]) => s.bias === "bullish");
    const bearish = entries.filter(([, s]) => s.bias === "bearish");
    const neutral = entries.filter(([, s]) => s.bias === "neutral");

    const top5 = entries.sort((a, b) => b[1].strength - a[1].strength).slice(0, 5);

    const pieData = [
      { name: "Bullish", value: bullish.length, fill: "hsl(142, 71%, 45%)" },
      { name: "Bearish", value: bearish.length, fill: "hsl(0, 84%, 60%)" },
      { name: "Neutral", value: neutral.length, fill: "hsl(var(--muted-foreground))" },
    ].filter(d => d.value > 0);

    const strengthChart = top5.map(([ticker, s]) => ({
      ticker,
      strength: s.strength,
      momentum: Math.abs(s.momentum),
      volatility: s.volatility,
    }));

    return { bullish, bearish, neutral, top5, pieData, strengthChart, total: entries.length };
  }, [stores]);

  const selected = selectedPair ? stores[selectedPair] : null;

  return (
    <div className="p-4 lg:p-6 overflow-y-auto h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Forex AI Analysis</h2>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${connected ? "bg-buy/15 text-buy" : "bg-sell/15 text-sell"}`}>
            {connected ? `● ${analysis.total} pairs live` : "○ Connecting..."}
          </span>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Bullish Pairs", value: analysis.bullish.length, icon: TrendingUp, color: "text-buy" },
          { label: "Bearish Pairs", value: analysis.bearish.length, icon: TrendingDown, color: "text-sell" },
          { label: "Neutral Pairs", value: analysis.neutral.length, icon: Minus, color: "text-muted-foreground" },
          { label: "Total Active", value: analysis.total, icon: Activity, color: "text-primary" },
        ].map(c => (
          <div key={c.label} className="p-3 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-1">
              <c.icon className={`w-4 h-4 ${c.color}`} />
              <span className="text-[10px] text-muted-foreground">{c.label}</span>
            </div>
            <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sentiment Pie */}
        <div className="p-4 rounded-xl bg-card border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" /> Market Sentiment
          </h3>
          {analysis.pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={analysis.pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {analysis.pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                  itemStyle={{ color: "hsl(var(--foreground))" }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-xs text-muted-foreground">Waiting for tick data...</div>
          )}
          <div className="flex items-center justify-center gap-4 mt-2">
            {analysis.pieData.map(d => (
              <span key={d.name} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.fill }} />
                {d.name} ({d.value})
              </span>
            ))}
          </div>
        </div>

        {/* Strength Bar Chart */}
        <div className="p-4 rounded-xl bg-card border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" /> Top 5 Strongest Pairs
          </h3>
          {analysis.strengthChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={analysis.strengthChart} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis dataKey="ticker" type="category" width={65} tick={{ fontSize: 10, fill: "hsl(var(--foreground))" }} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                  itemStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Bar dataKey="strength" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-xs text-muted-foreground">Collecting data...</div>
          )}
        </div>
      </div>

      {/* All Pairs Table */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">All Forex Pairs — AI Signals</span>
        </div>
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="border-b border-border bg-secondary/50">
                {["PAIR", "PRICE", "MOMENTUM", "VOLATILITY", "STRENGTH", "BIAS", "SIGNAL"].map(h => (
                  <th key={h} className="py-2.5 px-3 text-[10px] font-semibold text-muted-foreground text-left uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_FOREX.map(pair => {
                const s = stores[pair.ticker];
                if (!s) return (
                  <tr key={pair.ticker} className="border-b border-border/30">
                    <td className="py-2 px-3 text-xs font-medium text-foreground">{pair.ticker}</td>
                    <td colSpan={6} className="py-2 px-3 text-xs text-muted-foreground">Waiting...</td>
                  </tr>
                );
                const decimals = pair.ticker.includes("JPY") ? 3 : 5;
                const signal = s.strength >= 70 ? (s.bias === "bullish" ? "BUY" : s.bias === "bearish" ? "SELL" : "HOLD") : "HOLD";
                return (
                  <tr
                    key={pair.ticker}
                    onClick={() => setSelectedPair(pair.ticker)}
                    className={`border-b border-border/30 cursor-pointer transition-colors ${selectedPair === pair.ticker ? "bg-primary/10" : "hover:bg-secondary/20"}`}
                  >
                    <td className="py-2 px-3">
                      <span className="text-xs font-semibold text-foreground">{pair.ticker}</span>
                    </td>
                    <td className="py-2 px-3 text-xs font-mono text-foreground">{s.lastPrice.toFixed(decimals)}</td>
                    <td className={`py-2 px-3 text-xs font-semibold ${s.momentum > 0 ? "text-buy" : s.momentum < 0 ? "text-sell" : "text-muted-foreground"}`}>
                      <span className="flex items-center gap-1">
                        {s.momentum > 0 ? <ArrowUpRight className="w-3 h-3" /> : s.momentum < 0 ? <ArrowDownRight className="w-3 h-3" /> : null}
                        {s.momentum.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-xs text-muted-foreground">{s.volatility.toFixed(1)}</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div
                            className={`h-full rounded-full ${s.strength >= 70 ? "bg-buy" : s.strength >= 40 ? "bg-warning" : "bg-muted-foreground"}`}
                            style={{ width: `${s.strength}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground">{s.strength}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        s.bias === "bullish" ? "bg-buy/15 text-buy" : s.bias === "bearish" ? "bg-sell/15 text-sell" : "bg-secondary text-muted-foreground"
                      }`}>
                        {s.bias}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        signal === "BUY" ? "bg-buy/20 text-buy" : signal === "SELL" ? "bg-sell/20 text-sell" : "bg-secondary text-muted-foreground"
                      }`}>
                        {signal}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Pair Deep Analysis */}
      {selected && selectedPair && (
        <div className="p-4 rounded-xl bg-card border border-border space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              {selectedPair} — Deep Analysis
            </h3>
            <button onClick={() => setSelectedPair(null)} className="text-[10px] text-muted-foreground hover:text-foreground">✕ Close</button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { label: "Price", value: selected.lastPrice.toFixed(selectedPair.includes("JPY") ? 3 : 5) },
              { label: "Momentum", value: selected.momentum.toFixed(2) },
              { label: "Volatility", value: selected.volatility.toFixed(2) },
              { label: "Strength", value: `${selected.strength}/100` },
            ].map(m => (
              <div key={m.label} className="p-2 rounded-lg bg-secondary/50 text-center">
                <p className="text-[9px] text-muted-foreground">{m.label}</p>
                <p className="text-sm font-bold text-foreground">{m.value}</p>
              </div>
            ))}
          </div>

          {/* Price history mini-chart using recent prices */}
          {selected.prices.length >= 20 && (
            <div className="space-y-1">
              <p className="text-[10px] text-muted-foreground">Price Trajectory (last 50 ticks)</p>
              <div className="h-16 flex items-end gap-px">
                {selected.prices.slice(-50).map((p, i, arr) => {
                  const min = Math.min(...arr);
                  const max = Math.max(...arr);
                  const range = max - min || 1;
                  const h = ((p - min) / range) * 100;
                  const prev = i > 0 ? arr[i - 1] : p;
                  return (
                    <div
                      key={i}
                      className={`flex-1 rounded-t-sm ${p >= prev ? "bg-buy/60" : "bg-sell/60"}`}
                      style={{ height: `${Math.max(h, 5)}%` }}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* AI Recommendation */}
          <div className={`p-3 rounded-lg border ${
            selected.bias === "bullish" ? "bg-buy/5 border-buy/20" : selected.bias === "bearish" ? "bg-sell/5 border-sell/20" : "bg-secondary/30 border-border"
          }`}>
            <p className="text-[10px] font-bold text-foreground mb-1">AI Recommendation</p>
            <p className="text-xs text-muted-foreground">
              {selected.strength >= 70
                ? `Strong ${selected.bias} signal detected. Momentum at ${selected.momentum.toFixed(1)} pips with ${selected.volatility.toFixed(1)} volatility index. Consider ${selected.bias === "bullish" ? "long" : "short"} position.`
                : selected.strength >= 40
                  ? `Moderate activity. Momentum ${selected.momentum > 0 ? "positive" : "negative"} but below threshold. Wait for confirmation.`
                  : `Low activity on this pair. Insufficient signal strength for trading recommendation.`
              }
            </p>
          </div>
        </div>
      )}

      <p className="text-[9px] text-muted-foreground text-center">
        AI analysis is based on statistical momentum & volatility. Not financial advice. Forex markets active Mon–Fri.
      </p>
    </div>
  );
};

export default ForexAITab;
