import { useEffect, useRef, useState } from "react";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [timeframe, setTimeframe] = useState("1m");
  const [hoverInfo, setHoverInfo] = useState<{ x: number; y: number; candle: Candle } | null>(null);
  const marketLabel = VOLATILITY_MARKETS.find(m => m.symbol === selectedMarket)?.label || selectedMarket;

  useEffect(() => {
    if (!ws) return;
    setCandles([]);
    setCurrentPrice(null);

    const unsub = ws.on("tick", (data) => {
      if (data.tick) {
        const price = data.tick.quote;
        const time = data.tick.epoch * 1000;
        setCurrentPrice(price);

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
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width;
    const H = rect.height;

    // Background
    const isDark = document.documentElement.classList.contains("dark") || !document.documentElement.classList.contains("light");
    ctx.fillStyle = isDark ? "hsl(216, 28%, 7%)" : "hsl(0, 0%, 98%)";
    ctx.fillRect(0, 0, W, H);

    const visibleCandles = candles.slice(-100);
    if (visibleCandles.length < 2) return;

    const allPrices = visibleCandles.flatMap(c => [c.high, c.low]);
    const minP = Math.min(...allPrices);
    const maxP = Math.max(...allPrices);
    const range = maxP - minP || 1;
    const padL = 10;
    const padR = 80;
    const padT = 30;
    const padB = 30;

    const toY = (p: number) => padT + (1 - (p - minP) / range) * (H - padT - padB);
    const candleW = (W - padL - padR) / visibleCandles.length;

    // Grid lines + price labels
    const gridColor = isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)";
    const textColor = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)";
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 6; i++) {
      const y = padT + i * ((H - padT - padB) / 5);
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(W - padR, y);
      ctx.stroke();
      const price = maxP - (i / 5) * range;
      ctx.fillStyle = textColor;
      ctx.font = "10px Inter";
      ctx.textAlign = "left";
      ctx.fillText(price.toFixed(4), W - padR + 4, y + 3);
    }

    // Candles
    visibleCandles.forEach((c, i) => {
      const x = padL + i * candleW + candleW / 2;
      const isGreen = c.close >= c.open;
      const color = isGreen ? "hsl(142, 76%, 36%)" : "hsl(0, 72%, 51%)";

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
      ctx.strokeStyle = "hsl(0, 72%, 51%)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(W - padR, y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Price tag
      ctx.fillStyle = "hsl(0, 72%, 51%)";
      const tagW = 72;
      ctx.fillRect(W - padR, y - 10, tagW, 20);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 10px Inter";
      ctx.textAlign = "center";
      ctx.fillText(currentPrice.toFixed(4), W - padR + tagW / 2, y + 4);
    }

    // Time labels
    ctx.fillStyle = textColor;
    ctx.font = "9px Inter";
    ctx.textAlign = "center";
    const step = Math.max(1, Math.floor(visibleCandles.length / 8));
    for (let i = 0; i < visibleCandles.length; i += step) {
      const x = padL + i * candleW + candleW / 2;
      const d = new Date(visibleCandles[i].time);
      ctx.fillText(`${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`, x, H - 5);
    }
  }, [candles, currentPrice]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length < 2) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const padL = 10;
    const padR = 80;
    const visibleCandles = candles.slice(-100);
    const candleW = (rect.width - padL - padR) / visibleCandles.length;
    const idx = Math.floor((x - padL) / candleW);
    if (idx >= 0 && idx < visibleCandles.length) {
      setHoverInfo({ x: e.clientX - rect.left, y: e.clientY - rect.top, candle: visibleCandles[idx] });
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-card/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">📊</div>
            <div>
              <p className="text-sm font-semibold text-foreground">{marketLabel}</p>
              {currentPrice && (
                <p className="text-xs text-muted-foreground font-mono">
                  O{currentPrice.toFixed(4)} H{currentPrice.toFixed(4)} L{currentPrice.toFixed(4)} C{currentPrice.toFixed(4)}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-1">
          {["30s", "1m", "5m"].map(tf => (
            <button
              key={tf}
              onClick={() => { setTimeframe(tf); setCandles([]); }}
              className={`px-2.5 py-1 text-[10px] font-medium rounded transition-colors ${timeframe === tf ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div ref={containerRef} className="flex-1 relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverInfo(null)}
        />
        {hoverInfo && (
          <div
            className="absolute bg-card border border-border rounded-lg px-3 py-2 text-xs pointer-events-none z-10 shadow-lg"
            style={{ left: Math.min(hoverInfo.x + 10, (containerRef.current?.clientWidth || 300) - 180), top: hoverInfo.y - 60 }}
          >
            <p className="text-muted-foreground">{new Date(hoverInfo.candle.time).toLocaleString()}</p>
            <p className="font-bold text-foreground">{marketLabel}</p>
            <div className="grid grid-cols-2 gap-x-3 mt-1">
              <span className="text-muted-foreground">O: <span className="text-foreground">{hoverInfo.candle.open.toFixed(4)}</span></span>
              <span className="text-muted-foreground">H: <span className="text-buy">{hoverInfo.candle.high.toFixed(4)}</span></span>
              <span className="text-muted-foreground">L: <span className="text-sell">{hoverInfo.candle.low.toFixed(4)}</span></span>
              <span className="text-muted-foreground">C: <span className="text-foreground">{hoverInfo.candle.close.toFixed(4)}</span></span>
            </div>
          </div>
        )}
        {candles.length < 2 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="w-8 h-8 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Collecting tick data for candlestick chart...</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-border text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-buy" /> Live</span>
        <span>{new Date().toUTCString()}</span>
      </div>
    </div>
  );
};

export default TradingViewChart;
