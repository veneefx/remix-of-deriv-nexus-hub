import { useEffect, useRef, useState, useMemo } from "react";
import DerivWebSocket from "@/services/deriv-websocket";
import { VOLATILITY_MARKETS } from "@/lib/trading-constants";

interface TradingViewChartProps {
  ws: DerivWebSocket | null;
  selectedMarket: string;
}

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

const TradingViewChart = ({ ws, selectedMarket }: TradingViewChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [timeframe, setTimeframe] = useState("1m");
  const tickBuffer = useRef<{ price: number; time: number }[]>([]);
  const marketLabel = VOLATILITY_MARKETS.find(m => m.symbol === selectedMarket)?.label || selectedMarket;

  // Collect ticks and build candles
  useEffect(() => {
    if (!ws) return;
    tickBuffer.current = [];
    setCandles([]);

    const unsub = ws.on("tick", (data) => {
      if (data.tick) {
        const price = data.tick.quote;
        const time = data.tick.epoch * 1000;
        setCurrentPrice(price);
        tickBuffer.current.push({ price, time });

        // Build 1-minute candles from ticks
        const interval = timeframe === "1m" ? 60000 : timeframe === "5m" ? 300000 : 30000;
        const candleTime = Math.floor(time / interval) * interval;

        setCandles(prev => {
          const updated = [...prev];
          const lastCandle = updated[updated.length - 1];
          if (lastCandle && lastCandle.time === candleTime) {
            lastCandle.high = Math.max(lastCandle.high, price);
            lastCandle.low = Math.min(lastCandle.low, price);
            lastCandle.close = price;
          } else {
            updated.push({ time: candleTime, open: price, high: price, low: price, close: price });
            if (updated.length > 200) updated.shift();
          }
          return updated;
        });
      }
    });
    return () => { unsub(); };
  }, [ws, selectedMarket, timeframe]);

  // Draw chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length < 2) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    const W = rect.width;
    const H = rect.height;

    ctx.fillStyle = "hsl(216, 28%, 7%)";
    ctx.fillRect(0, 0, W, H);

    const visibleCandles = candles.slice(-80);
    if (visibleCandles.length < 2) return;

    const allPrices = visibleCandles.flatMap(c => [c.high, c.low]);
    const minP = Math.min(...allPrices);
    const maxP = Math.max(...allPrices);
    const range = maxP - minP || 1;
    const pad = 50;

    const toY = (p: number) => pad + (1 - (p - minP) / range) * (H - pad * 2);
    const candleW = (W - pad * 2) / visibleCandles.length;

    // Grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 5; i++) {
      const y = pad + i * ((H - pad * 2) / 4);
      ctx.beginPath();
      ctx.moveTo(pad, y);
      ctx.lineTo(W - 10, y);
      ctx.stroke();
      const price = maxP - (i / 4) * range;
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "10px Inter";
      ctx.textAlign = "right";
      ctx.fillText(price.toFixed(4), W - 2, y + 3);
    }

    // Candles
    visibleCandles.forEach((c, i) => {
      const x = pad + i * candleW + candleW / 2;
      const isGreen = c.close >= c.open;
      const color = isGreen ? "#22c55e" : "#ef4444";

      // Wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, toY(c.high));
      ctx.lineTo(x, toY(c.low));
      ctx.stroke();

      // Body
      const bodyTop = toY(Math.max(c.open, c.close));
      const bodyBot = toY(Math.min(c.open, c.close));
      const bodyH = Math.max(bodyBot - bodyTop, 1);
      ctx.fillStyle = color;
      ctx.fillRect(x - candleW * 0.35, bodyTop, candleW * 0.7, bodyH);
    });

    // Current price line
    if (currentPrice) {
      const y = toY(currentPrice);
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad, y);
      ctx.lineTo(W - 10, y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#ef4444";
      ctx.fillRect(W - 80, y - 10, 70, 20);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 10px Inter";
      ctx.textAlign = "center";
      ctx.fillText(currentPrice.toFixed(4), W - 45, y + 4);
    }

    // Time labels
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "9px Inter";
    ctx.textAlign = "center";
    for (let i = 0; i < visibleCandles.length; i += Math.floor(visibleCandles.length / 6)) {
      const x = pad + i * candleW + candleW / 2;
      const d = new Date(visibleCandles[i].time);
      ctx.fillText(`${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`, x, H - 5);
    }
  }, [candles, currentPrice]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-card/50">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-foreground">{marketLabel}</span>
          {currentPrice && (
            <span className="text-sm font-mono text-primary">{currentPrice.toFixed(4)}</span>
          )}
        </div>
        <div className="flex gap-1">
          {["30s", "1m", "5m"].map(tf => (
            <button
              key={tf}
              onClick={() => { setTimeframe(tf); setCandles([]); }}
              className={`px-2.5 py-1 text-[10px] font-medium rounded ${timeframe === tf ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>
      
      {/* Chart */}
      <div className="flex-1 relative">
        <canvas ref={canvasRef} className="w-full h-full" />
        {candles.length < 2 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Collecting tick data for candlestick chart...</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-border text-[10px] text-muted-foreground">
        <span>● Live</span>
        <span>{new Date().toUTCString()}</span>
      </div>
    </div>
  );
};

export default TradingViewChart;
