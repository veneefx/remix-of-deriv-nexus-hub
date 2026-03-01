import { useState, useEffect, useRef } from "react";
import DerivWebSocket from "@/services/deriv-websocket";

const FOREX_SYMBOLS = [
  { symbol: "frxEURUSD", ticker: "EURUSD" },
  { symbol: "frxGBPUSD", ticker: "GBPUSD" },
  { symbol: "frxUSDJPY", ticker: "USDJPY" },
  { symbol: "frxAUDCAD", ticker: "AUDCAD" },
  { symbol: "frxEURGBP", ticker: "EURGBP" },
];

interface MarketRow {
  ticker: string;
  price: number;
  prevPrice: number;
  high: number;
  low: number;
  bid: number;
  ask: number;
}

const DERIV_APP_ID = "129344";

const MarketTracker = () => {
  const [data, setData] = useState<Record<string, MarketRow>>({});
  const wsRef = useRef<DerivWebSocket | null>(null);

  useEffect(() => {
    const ws = new DerivWebSocket(DERIV_APP_ID);
    wsRef.current = ws;

    ws.connect().then(() => {
      FOREX_SYMBOLS.forEach(({ symbol }) => {
        ws.subscribeTicks(symbol);
      });
    });

    ws.on("tick", (msg) => {
      if (msg.tick) {
        const tick = msg.tick;
        const sym = FOREX_SYMBOLS.find(s => s.symbol === tick.symbol);
        if (!sym) return;
        setData(prev => {
          const existing = prev[sym.ticker];
          return {
            ...prev,
            [sym.ticker]: {
              ticker: sym.ticker,
              price: tick.quote,
              prevPrice: existing?.price || tick.quote,
              high: Math.max(existing?.high || 0, tick.quote),
              low: existing?.low ? Math.min(existing.low, tick.quote) : tick.quote,
              bid: tick.quote - 0.00004,
              ask: tick.quote + 0.00003,
            }
          };
        });
      }
    });

    return () => { ws.disconnect(); };
  }, []);

  const rows = FOREX_SYMBOLS.map(s => data[s.ticker]).filter(Boolean);

  return (
    <div className="p-1 rounded-xl bg-card border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              {["TICKER", "PRICE", "CHG %", "BID", "ASK", "HIGH", "LOW", "STATUS"].map(h => (
                <th key={h} className="py-3 px-4 text-xs font-semibold text-muted-foreground text-left font-sans">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              FOREX_SYMBOLS.map(s => (
                <tr key={s.ticker} className="border-b border-border/50">
                  <td className="py-3 px-4 text-xs font-medium text-primary font-sans">{s.ticker}</td>
                  <td colSpan={7} className="py-3 px-4 text-xs text-muted-foreground font-sans">Connecting...</td>
                </tr>
              ))
            ) : (
              rows.map(row => {
                const chg = row.price - row.prevPrice;
                const chgPct = row.prevPrice ? ((chg / row.prevPrice) * 100) : 0;
                const isUp = chg >= 0;
                return (
                  <tr key={row.ticker} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                    <td className="py-3 px-4 text-xs font-medium text-primary font-sans">{row.ticker}</td>
                    <td className="py-3 px-4 text-xs text-foreground font-mono font-sans">{row.price.toFixed(5)}</td>
                    <td className={`py-3 px-4 text-xs font-sans ${isUp ? "text-buy" : "text-sell"}`}>{isUp ? "+" : ""}{chgPct.toFixed(3)}%</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground font-sans">{row.bid.toFixed(5)}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground font-sans">{row.ask.toFixed(5)}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground font-sans">{row.high.toFixed(5)}</td>
                    <td className="py-3 px-4 text-xs text-muted-foreground font-sans">{row.low.toFixed(5)}</td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isUp ? "bg-buy/20 text-buy" : "bg-sell/20 text-sell"}`}>
                        {isUp ? "● Live" : "● Live"}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MarketTracker;
