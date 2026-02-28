import { useEffect, useRef, useState } from "react";
import DerivWebSocket from "@/services/deriv-websocket";
import { VOLATILITY_MARKETS } from "@/lib/trading-constants";

interface DerivChartProps {
  ws: DerivWebSocket | null;
  selectedMarket: string;
}

const DerivChart = ({ ws, selectedMarket }: DerivChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [prices, setPrices] = useState<{ price: number; time: number }[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [hoverInfo, setHoverInfo] = useState<{ x: number; y: number; price: number; time: number } | null>(null);
  const marketLabel = VOLATILITY_MARKETS.find(m => m.symbol === selectedMarket)?.label || selectedMarket;

  useEffect(() => {
    if (!ws) return;
    setPrices([]);

    const unsub = ws.on("tick", (data) => {
      if (data.tick) {
        const price = data.tick.quote;
        const time = data.tick.epoch * 1000;
        setCurrentPrice(price);
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
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    const W = rect.width;
    const H = rect.height;

    ctx.fillStyle = "hsl(216, 28%, 7%)";
    ctx.fillRect(0, 0, W, H);

    const minP = Math.min(...prices.map(p => p.price));
    const maxP = Math.max(...prices.map(p => p.price));
    const range = maxP - minP || 1;
    const pad = 40;

    const toX = (i: number) => pad + (i / (prices.length - 1)) * (W - pad * 2);
    const toY = (p: number) => pad + (1 - (p - minP) / range) * (H - pad * 2);

    // Grid
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = pad + i * ((H - pad * 2) / 4);
      ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - 10, y); ctx.stroke();
      const price = maxP - (i / 4) * range;
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "9px Inter";
      ctx.textAlign = "right";
      ctx.fillText(price.toFixed(3), W - 2, y + 3);
    }

    // Area fill
    ctx.beginPath();
    ctx.moveTo(toX(0), H - pad);
    prices.forEach((p, i) => ctx.lineTo(toX(i), toY(p.price)));
    ctx.lineTo(toX(prices.length - 1), H - pad);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "rgba(59, 130, 246, 0.15)");
    grad.addColorStop(1, "rgba(59, 130, 246, 0.01)");
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    prices.forEach((p, i) => {
      if (i === 0) ctx.moveTo(toX(i), toY(p.price));
      else ctx.lineTo(toX(i), toY(p.price));
    });
    ctx.strokeStyle = "rgba(59, 130, 246, 0.8)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Time labels
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "9px Inter";
    ctx.textAlign = "center";
    const step = Math.floor(prices.length / 6);
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
    const idx = Math.round((x - 40) / (rect.width - 80) * (prices.length - 1));
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
              <p className="text-xs text-muted-foreground">
                {currentPrice.toFixed(3)} <span className="text-sell">▼</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverInfo(null)}
        />
        {hoverInfo && (
          <div
            className="absolute bg-card border border-border rounded-lg px-3 py-2 text-xs pointer-events-none z-10 shadow-lg"
            style={{ left: hoverInfo.x + 10, top: hoverInfo.y - 40 }}
          >
            <p className="text-muted-foreground">{new Date(hoverInfo.time).toLocaleString()}</p>
            <p className="font-bold text-foreground">{marketLabel}</p>
            <p className="text-primary">{hoverInfo.price.toFixed(3)}</p>
          </div>
        )}
        {prices.length < 2 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Connecting to live data stream...</p>
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
