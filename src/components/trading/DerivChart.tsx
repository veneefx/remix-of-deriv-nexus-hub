import { useEffect, useRef, useState } from "react";
import DerivWebSocket from "@/services/deriv-websocket";
import { VOLATILITY_MARKETS } from "@/lib/trading-constants";

interface DerivChartProps {
  ws: DerivWebSocket | null;
  selectedMarket: string;
}

const DerivChart = ({ ws, selectedMarket }: DerivChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [prices, setPrices] = useState<{ price: number; time: number }[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [hoverInfo, setHoverInfo] = useState<{ x: number; y: number; price: number; time: number } | null>(null);
  const marketLabel = VOLATILITY_MARKETS.find(m => m.symbol === selectedMarket)?.label || selectedMarket;

  useEffect(() => {
    if (!ws) return;
    setPrices([]);
    setCurrentPrice(null);

    const unsub = ws.on("tick", (data) => {
      if (data.tick) {
        const price = data.tick.quote;
        const time = data.tick.epoch * 1000;
        setCurrentPrice(prev => {
          if (prev !== null) setPriceChange(price - prev);
          return price;
        });
        setPrices(prev => {
          const updated = [...prev, { price, time }];
          return updated.length > 500 ? updated.slice(-500) : updated;
        });
      }
    });
    return () => { unsub(); };
  }, [ws, selectedMarket]);

  // Draw line chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || prices.length < 2) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width;
    const H = rect.height;

    const isDark = document.documentElement.classList.contains("dark") || !document.documentElement.classList.contains("light");
    ctx.fillStyle = isDark ? "hsl(216, 28%, 7%)" : "hsl(0, 0%, 98%)";
    ctx.fillRect(0, 0, W, H);

    const minP = Math.min(...prices.map(p => p.price));
    const maxP = Math.max(...prices.map(p => p.price));
    const range = maxP - minP || 1;
    const padL = 10;
    const padR = 70;
    const padT = 20;
    const padB = 30;

    const toX = (i: number) => padL + (i / (prices.length - 1)) * (W - padL - padR);
    const toY = (p: number) => padT + (1 - (p - minP) / range) * (H - padT - padB);

    // Grid
    const gridColor = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)";
    const textColor = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.35)";
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 5; i++) {
      const y = padT + i * ((H - padT - padB) / 5);
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W - padR, y); ctx.stroke();
      const price = maxP - (i / 5) * range;
      ctx.fillStyle = textColor;
      ctx.font = "10px Inter";
      ctx.textAlign = "left";
      ctx.fillText(price.toFixed(3), W - padR + 4, y + 3);
    }

    // Area fill
    ctx.beginPath();
    ctx.moveTo(toX(0), H - padB);
    prices.forEach((p, i) => ctx.lineTo(toX(i), toY(p.price)));
    ctx.lineTo(toX(prices.length - 1), H - padB);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    const lineColor = isDark ? "rgba(59, 130, 246, 0.15)" : "rgba(59, 130, 246, 0.1)";
    grad.addColorStop(0, lineColor);
    grad.addColorStop(1, "transparent");
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    prices.forEach((p, i) => {
      if (i === 0) ctx.moveTo(toX(i), toY(p.price));
      else ctx.lineTo(toX(i), toY(p.price));
    });
    ctx.strokeStyle = isDark ? "rgba(59, 130, 246, 0.8)" : "rgba(59, 130, 246, 0.9)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Dot at last price
    if (prices.length > 0) {
      const lastIdx = prices.length - 1;
      const lx = toX(lastIdx);
      const ly = toY(prices[lastIdx].price);
      ctx.beginPath();
      ctx.arc(lx, ly, 3, 0, Math.PI * 2);
      ctx.fillStyle = "hsl(217, 91%, 60%)";
      ctx.fill();
    }

    // Time labels
    ctx.fillStyle = textColor;
    ctx.font = "9px Inter";
    ctx.textAlign = "center";
    const step = Math.max(1, Math.floor(prices.length / 8));
    for (let i = 0; i < prices.length; i += step) {
      const d = new Date(prices[i].time);
      ctx.fillText(`${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`, toX(i), H - 5);
    }
  }, [prices]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || prices.length < 2) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const padL = 10;
    const padR = 70;
    const idx = Math.round((x - padL) / (rect.width - padL - padR) * (prices.length - 1));
    if (idx >= 0 && idx < prices.length) {
      setHoverInfo({ x: e.clientX - rect.left, y: e.clientY - rect.top, price: prices[idx].price, time: prices[idx].time });
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 p-3 border-b border-border bg-card/50">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">📊</div>
          <div>
            <p className="text-sm font-semibold text-foreground">{marketLabel}</p>
            {currentPrice && (
              <p className="text-xs text-muted-foreground font-mono">
                {currentPrice.toFixed(3)}{" "}
                <span className={priceChange >= 0 ? "text-buy" : "text-sell"}>
                  {priceChange >= 0 ? "▲" : "▼"} {Math.abs(priceChange).toFixed(3)} ({((priceChange / currentPrice) * 100).toFixed(2)}%)
                </span>
              </p>
            )}
          </div>
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
            style={{ left: Math.min(hoverInfo.x + 10, (containerRef.current?.clientWidth || 300) - 180), top: hoverInfo.y - 40 }}
          >
            <p className="text-muted-foreground">{new Date(hoverInfo.time).toLocaleString()}</p>
            <p className="font-bold text-foreground">{marketLabel}</p>
            <p className="text-primary font-mono">{hoverInfo.price.toFixed(3)}</p>
          </div>
        )}
        {prices.length < 2 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-2">
              <div className="w-8 h-8 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Connecting to live data stream...</p>
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

export default DerivChart;
