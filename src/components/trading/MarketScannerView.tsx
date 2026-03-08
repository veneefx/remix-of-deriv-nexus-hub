import { useState, useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";
import { Activity, Target, TrendingUp, Zap, RefreshCw } from "lucide-react";
import { VOLATILITY_MARKETS } from "@/lib/trading-constants";

const DERIV_WS_URL = "wss://ws.derivws.com/websockets/v3";
const APP_ID = "129344";

interface MarketData {
  symbol: string;
  label: string;
  digits: number[];
  confluenceScore: number;
  suggestedBias: string;
  evenPct: number;
  oddPct: number;
  ticksPerSec: number;
  volatilityLevel: "Low" | "Medium" | "High";
  lastQuote: number | null;
}

// Scan a subset of markets to avoid too many connections
const SCAN_MARKETS = VOLATILITY_MARKETS.slice(0, 8);

const MarketScannerView = () => {
  const [markets, setMarkets] = useState<MarketData[]>(() =>
    SCAN_MARKETS.map((m) => ({
      symbol: m.symbol,
      label: m.label,
      digits: [],
      confluenceScore: 0,
      suggestedBias: "-",
      evenPct: 50,
      oddPct: 50,
      ticksPerSec: 0,
      volatilityLevel: "Low",
      lastQuote: null,
    }))
  );
  const [scanning, setScanning] = useState(false);
  const wsRefs = useRef<WebSocket[]>([]);
  const dataRef = useRef<Map<string, MarketData>>(new Map());

  const startScan = () => {
    stopScan();
    setScanning(true);

    SCAN_MARKETS.forEach((m) => {
      const wsUrl = `${DERIV_WS_URL}?app_id=${APP_ID}`;
      const socket = new WebSocket(wsUrl);
      wsRefs.current.push(socket);

      const md: MarketData = {
        symbol: m.symbol,
        label: m.label,
        digits: [],
        confluenceScore: 0,
        suggestedBias: "-",
        evenPct: 50,
        oddPct: 50,
        ticksPerSec: 0,
        volatilityLevel: "Low",
        lastQuote: null,
      };
      dataRef.current.set(m.symbol, md);

      socket.onopen = () => {
        socket.send(JSON.stringify({ ticks: m.symbol, subscribe: 1 }));
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.tick && typeof data.tick.quote === "number") {
            const quote = data.tick.quote;
            const qStr = quote.toString();
            const digit = parseInt(qStr.charAt(qStr.length - 1), 10);

            const existing = dataRef.current.get(m.symbol);
            if (!existing) return;

            existing.lastQuote = quote;
            existing.digits = [...existing.digits.slice(-299), digit];

            // Calculate metrics
            const d = existing.digits;
            const len = d.length;
            if (len >= 30) {
              const evenCount = d.filter((x) => x % 2 === 0).length;
              existing.evenPct = (evenCount / len) * 100;
              existing.oddPct = 100 - existing.evenPct;

              // Confluence: simple frequency deviation
              const freq = new Array(10).fill(0);
              d.forEach((x) => freq[x]++);
              let maxDev = 0;
              freq.forEach((c) => {
                maxDev = Math.max(maxDev, Math.abs((c / len) * 100 - 10));
              });
              existing.confluenceScore = Math.min(Math.round(maxDev * 5), 100);
              existing.suggestedBias = existing.oddPct > existing.evenPct ? "ODD" : "EVEN";
            }

            dataRef.current.set(m.symbol, existing);
          }
        } catch {}
      };
    });

    // UI update interval
    const uiInterval = setInterval(() => {
      setMarkets(
        SCAN_MARKETS.map((m) => {
          const d = dataRef.current.get(m.symbol);
          return d || {
            symbol: m.symbol, label: m.label, digits: [], confluenceScore: 0,
            suggestedBias: "-", evenPct: 50, oddPct: 50, ticksPerSec: 0, volatilityLevel: "Low", lastQuote: null,
          };
        })
      );
    }, 1000);

    // Store interval ref for cleanup
    (wsRefs.current as any)._uiInterval = uiInterval;
  };

  const stopScan = () => {
    wsRefs.current.forEach((ws) => {
      try { ws.close(); } catch {}
    });
    const interval = (wsRefs.current as any)?._uiInterval;
    if (interval) clearInterval(interval);
    wsRefs.current = [];
    setScanning(false);
  };

  useEffect(() => {
    return () => stopScan();
  }, []);

  const bestMarket = useMemo(() => {
    return markets.reduce((best, m) =>
      m.confluenceScore > (best?.confluenceScore || 0) && m.digits.length > 30 ? m : best,
      markets[0]
    );
  }, [markets]);

  return (
    <div className="p-4 lg:p-6 overflow-y-auto h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Market Scanner</h2>
        </div>
        <button
          onClick={scanning ? stopScan : startScan}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            scanning
              ? "bg-sell/10 text-sell border border-sell/30 hover:bg-sell/20"
              : "bg-buy/10 text-buy border border-buy/30 hover:bg-buy/20"
          }`}
        >
          {scanning ? (
            <>
              <RefreshCw className="w-3 h-3 animate-spin" /> Stop Scan
            </>
          ) : (
            <>
              <Zap className="w-3 h-3" /> Start Scan
            </>
          )}
        </button>
      </div>

      {/* Best Opportunity */}
      {scanning && bestMarket && bestMarket.digits.length > 30 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-buy/10 border border-buy/30"
        >
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-buy" />
            <h3 className="text-sm font-bold text-buy">Best Opportunity</h3>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Market</p>
              <p className="text-sm font-bold text-foreground">{bestMarket.label}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Signal</p>
              <p className="text-sm font-bold text-buy">{bestMarket.suggestedBias}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Confluence</p>
              <p className="text-sm font-bold text-buy">{bestMarket.confluenceScore}%</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Market Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {markets.map((m) => (
          <motion.div
            key={m.symbol}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-4 rounded-xl bg-card border transition-all ${
              m.symbol === bestMarket?.symbol && m.confluenceScore > 30
                ? "border-buy/40 shadow-lg"
                : "border-border"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-foreground truncate">{m.label}</h4>
              {m.digits.length > 0 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-buy/10 text-buy">
                  {m.digits.length} ticks
                </span>
              )}
            </div>

            {m.digits.length > 30 ? (
              <div className="space-y-2">
                <div className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground">Confluence</span>
                  <span
                    className={`font-bold ${
                      m.confluenceScore >= 50 ? "text-buy" : m.confluenceScore >= 30 ? "text-warning" : "text-muted-foreground"
                    }`}
                  >
                    {m.confluenceScore}%
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      m.confluenceScore >= 50 ? "bg-buy" : m.confluenceScore >= 30 ? "bg-warning" : "bg-muted-foreground/30"
                    }`}
                    animate={{ width: `${m.confluenceScore}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground">Bias</span>
                  <span className="font-bold text-foreground">{m.suggestedBias}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-muted-foreground">Even/Odd</span>
                  <span className="text-foreground">{m.evenPct.toFixed(0)}% / {m.oddPct.toFixed(0)}%</span>
                </div>
                {m.lastQuote && (
                  <div className="text-[10px] text-muted-foreground text-center font-mono">
                    {m.lastQuote}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-3">
                {scanning ? (
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Collecting...
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Start scan to analyze</p>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {!scanning && (
        <div className="text-center py-8">
          <Activity className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Click <span className="text-buy font-bold">Start Scan</span> to analyze all markets simultaneously
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            The scanner opens separate connections to monitor multiple indices
          </p>
        </div>
      )}
    </div>
  );
};

export default MarketScannerView;
