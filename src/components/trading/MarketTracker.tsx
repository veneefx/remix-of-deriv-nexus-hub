import { useState, useEffect, useRef, useMemo } from "react";
import DerivWebSocket from "@/services/deriv-websocket";
import { TrendingUp, TrendingDown, Minus, Wifi, WifiOff, Globe } from "lucide-react";

const ALL_FOREX = [
  // Majors
  { symbol: "frxEURUSD", ticker: "EUR/USD", category: "Major" },
  { symbol: "frxGBPUSD", ticker: "GBP/USD", category: "Major" },
  { symbol: "frxUSDJPY", ticker: "USD/JPY", category: "Major" },
  { symbol: "frxUSDCHF", ticker: "USD/CHF", category: "Major" },
  { symbol: "frxAUDUSD", ticker: "AUD/USD", category: "Major" },
  { symbol: "frxUSDCAD", ticker: "USD/CAD", category: "Major" },
  { symbol: "frxNZDUSD", ticker: "NZD/USD", category: "Major" },
  // Crosses
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

interface MarketRow {
  ticker: string;
  symbol: string;
  category: string;
  price: number;
  prevPrice: number;
  high: number;
  low: number;
  bid: number;
  ask: number;
  spread: number;
  ticks: number;
  connected: boolean;
}

const DERIV_APP_ID = "129344";

const MarketTracker = () => {
  const [data, setData] = useState<Record<string, MarketRow>>({});
  const [wsConnected, setWsConnected] = useState(false);
  const [filter, setFilter] = useState<"All" | "Major" | "Cross">("All");
  const wsRef = useRef<DerivWebSocket | null>(null);
  const retryRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    const connectWs = () => {
      if (cancelled) return;
      const ws = new DerivWebSocket(DERIV_APP_ID);
      wsRef.current = ws;

      ws.on("connection", (msg) => {
        if (msg.status === "connected") {
          setWsConnected(true);
          retryRef.current = 0;
          ALL_FOREX.forEach(({ symbol }) => ws.subscribeTicks(symbol));
        } else {
          setWsConnected(false);
        }
      });

      ws.on("tick", (msg) => {
        if (!msg.tick) return;
        const tick = msg.tick;
        const sym = ALL_FOREX.find(s => s.symbol === tick.symbol);
        if (!sym) return;
        setData(prev => {
          const existing = prev[sym.ticker];
          const spread = tick.quote * 0.00008;
          return {
            ...prev,
            [sym.ticker]: {
              ticker: sym.ticker,
              symbol: sym.symbol,
              category: sym.category,
              price: tick.quote,
              prevPrice: existing?.price || tick.quote,
              high: Math.max(existing?.high || 0, tick.quote),
              low: existing?.low ? Math.min(existing.low, tick.quote) : tick.quote,
              bid: tick.quote - spread / 2,
              ask: tick.quote + spread / 2,
              spread: spread,
              ticks: (existing?.ticks || 0) + 1,
              connected: true,
            }
          };
        });
      });

      ws.on("error", () => {
        setWsConnected(false);
        if (!cancelled && retryRef.current < 3) {
          retryRef.current++;
          setTimeout(connectWs, 3000 * retryRef.current);
        }
      });

      ws.connect().catch(() => {
        if (!cancelled && retryRef.current < 3) {
          retryRef.current++;
          setTimeout(connectWs, 3000 * retryRef.current);
        }
      });
    };

    connectWs();
    return () => { cancelled = true; wsRef.current?.disconnect(); };
  }, []);

  const filtered = useMemo(() => {
    const symbols = filter === "All" ? ALL_FOREX : ALL_FOREX.filter(s => s.category === filter);
    return symbols.map(s => data[s.ticker] || {
      ticker: s.ticker, symbol: s.symbol, category: s.category,
      price: 0, prevPrice: 0, high: 0, low: 0, bid: 0, ask: 0, spread: 0, ticks: 0, connected: false,
    });
  }, [data, filter]);

  const liveCount = Object.values(data).filter(d => d.connected).length;

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-foreground">Forex Markets</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
            {liveCount}/{ALL_FOREX.length} Live
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {(["All", "Major", "Cross"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-[10px] px-2.5 py-1 rounded-md font-medium transition-colors ${
                filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              {f}
            </button>
          ))}
          {wsConnected
            ? <Wifi className="w-3.5 h-3.5 text-buy ml-2" />
            : <WifiOff className="w-3.5 h-3.5 text-sell ml-2" />
          }
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="border-b border-border bg-secondary/50">
              {["PAIR", "PRICE", "CHG %", "SPREAD", "BID", "ASK", "HIGH", "LOW", ""].map(h => (
                <th key={h} className="py-2.5 px-3 text-[10px] font-semibold text-muted-foreground text-left uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(row => {
              const chg = row.price - row.prevPrice;
              const chgPct = row.prevPrice ? ((chg / row.prevPrice) * 100) : 0;
              const isUp = chg > 0;
              const isDown = chg < 0;
              const decimals = row.ticker.includes("JPY") ? 3 : 5;

              return (
                <tr key={row.ticker} className="border-b border-border/30 hover:bg-secondary/20 transition-colors">
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${row.connected ? "bg-buy" : "bg-muted-foreground"}`} />
                      <span className="text-xs font-semibold text-foreground">{row.ticker}</span>
                      <span className="text-[9px] text-muted-foreground">{row.category}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-xs font-mono text-foreground">
                    {row.price ? row.price.toFixed(decimals) : "—"}
                  </td>
                  <td className={`py-2.5 px-3 text-xs font-semibold ${isUp ? "text-buy" : isDown ? "text-sell" : "text-muted-foreground"}`}>
                    <span className="flex items-center gap-1">
                      {isUp ? <TrendingUp className="w-3 h-3" /> : isDown ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                      {row.price ? `${isUp ? "+" : ""}${chgPct.toFixed(3)}%` : "—"}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-xs text-muted-foreground font-mono">
                    {row.spread ? (row.spread * (row.ticker.includes("JPY") ? 100 : 10000)).toFixed(1) : "—"}
                  </td>
                  <td className="py-2.5 px-3 text-xs text-muted-foreground font-mono">{row.bid ? row.bid.toFixed(decimals) : "—"}</td>
                  <td className="py-2.5 px-3 text-xs text-muted-foreground font-mono">{row.ask ? row.ask.toFixed(decimals) : "—"}</td>
                  <td className="py-2.5 px-3 text-xs text-muted-foreground font-mono">{row.high ? row.high.toFixed(decimals) : "—"}</td>
                  <td className="py-2.5 px-3 text-xs text-muted-foreground font-mono">{row.low ? row.low.toFixed(decimals) : "—"}</td>
                  <td className="py-2.5 px-3">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                      row.connected ? "bg-buy/15 text-buy" : "bg-muted text-muted-foreground"
                    }`}>
                      {row.connected ? "● Live" : "○ Wait"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {!wsConnected && (
        <div className="px-4 py-2 bg-warning/10 border-t border-warning/20 text-center">
          <p className="text-[10px] text-warning">
            Forex markets are available Mon–Fri. Connecting to live feed...
          </p>
        </div>
      )}
    </div>
  );
};

export default MarketTracker;
