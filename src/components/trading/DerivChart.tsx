import { useEffect, useRef, useState } from "react";
import { createChart, IChartApi, ISeriesApi, LineData, Time, ColorType } from "lightweight-charts";
import DerivWebSocket from "@/services/deriv-websocket";
import { VOLATILITY_MARKETS } from "@/lib/trading-constants";
import { ChevronDown, Crosshair, TrendingUp, BarChart3, LineChart, PenTool, Download } from "lucide-react";

interface DerivChartProps {
  ws: DerivWebSocket | null;
  selectedMarket: string;
}

const DerivChart = ({ ws, selectedMarket }: DerivChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const areaSeriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [priceChangePercent, setPriceChangePercent] = useState<number>(0);
  const [marketDropdownOpen, setMarketDropdownOpen] = useState(false);
  const [hoverPrice, setHoverPrice] = useState<{ time: string; price: string; symbol: string } | null>(null);
  const firstPriceRef = useRef<number | null>(null);
  const marketLabel = VOLATILITY_MARKETS.find(m => m.symbol === selectedMarket)?.label || selectedMarket;

  const isDark = typeof document !== "undefined" && (document.documentElement.classList.contains("dark") || !document.documentElement.classList.contains("light"));

  // Create chart
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: isDark ? "#0a0e17" : "#ffffff" },
        textColor: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)",
        fontSize: 11,
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.04)" },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)", style: 3, labelVisible: true },
        horzLine: { color: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)", style: 3, labelVisible: true },
      },
      rightPriceScale: {
        borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
        scaleMargins: { top: 0.15, bottom: 0.1 },
      },
      timeScale: {
        borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
        timeVisible: true,
        secondsVisible: true,
      },
      handleScroll: true,
      handleScale: true,
    });

    const series = chart.addAreaSeries({
      lineColor: isDark ? "rgba(100, 150, 255, 0.8)" : "rgba(50, 100, 220, 0.9)",
      topColor: isDark ? "rgba(100, 150, 255, 0.15)" : "rgba(50, 100, 220, 0.12)",
      bottomColor: isDark ? "rgba(100, 150, 255, 0.01)" : "rgba(50, 100, 220, 0.01)",
      lineWidth: 2,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
      crosshairMarkerBorderColor: isDark ? "#6496ff" : "#3264dc",
      crosshairMarkerBackgroundColor: isDark ? "#0a0e17" : "#ffffff",
    });

    chartRef.current = chart;
    areaSeriesRef.current = series;

    // Crosshair move handler for tooltip
    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !param.point) {
        setHoverPrice(null);
        return;
      }
      const data = param.seriesData.get(series);
      if (data && 'value' in data) {
        const t = param.time as number;
        const d = new Date(t * 1000);
        setHoverPrice({
          time: d.toLocaleString("en-GB", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          price: (data as any).value.toFixed(3),
          symbol: marketLabel.toUpperCase(),
        });
      }
    });

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);
    handleResize();

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      areaSeriesRef.current = null;
    };
  }, [isDark, marketLabel]);

  // Handle tick data
  useEffect(() => {
    if (!ws || !areaSeriesRef.current) return;
    firstPriceRef.current = null;

    const unsub = ws.on("tick", (data) => {
      if (!data.tick || !areaSeriesRef.current) return;
      const price = data.tick.quote;
      const epoch = data.tick.epoch;

      if (firstPriceRef.current === null) firstPriceRef.current = price;

      setCurrentPrice(price);
      const change = price - (firstPriceRef.current || price);
      setPriceChange(change);
      setPriceChangePercent(firstPriceRef.current ? (change / firstPriceRef.current) * 100 : 0);

      try {
        areaSeriesRef.current?.update({
          time: epoch as Time,
          value: price,
        });
      } catch {
        // ignore update errors
      }
    });

    return () => { unsub(); };
  }, [ws, selectedMarket]);

  // Clear data on market change
  useEffect(() => {
    areaSeriesRef.current?.setData([]);
    firstPriceRef.current = null;
  }, [selectedMarket]);

  const changeIsUp = priceChange >= 0;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Market selector header */}
      <div className="flex items-center gap-4 px-4 py-2.5 border-b border-border bg-card/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-foreground">{marketLabel}</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            {currentPrice && (
              <div className="flex items-center gap-2 text-xs">
                <span className="font-mono text-foreground">{currentPrice.toFixed(3)}</span>
                <span className={changeIsUp ? "text-buy" : "text-sell"}>
                  {changeIsUp ? "+" : ""}{priceChange.toFixed(3)} ({changeIsUp ? "+" : ""}{priceChangePercent.toFixed(2)}%)
                </span>
                {!changeIsUp && <span className="text-sell">▼</span>}
                {changeIsUp && <span className="text-buy">▲</span>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chart with left toolbar */}
      <div className="flex-1 flex">
        {/* Drawing tools sidebar */}
        <div className="w-9 border-r border-border bg-card/30 flex flex-col items-center py-2 gap-1.5">
          {[
            { icon: "1m", isText: true },
          ].map((_, i) => (
            <button key={i} className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors text-[10px] font-bold">
              1m
            </button>
          ))}
          <div className="w-5 border-t border-border my-1" />
          {[Crosshair, TrendingUp, BarChart3, LineChart, PenTool, Download].map((Icon, i) => (
            <button key={i} className="w-7 h-7 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>

        {/* Chart */}
        <div className="flex-1 relative">
          <div ref={containerRef} className="absolute inset-0" />
          {!currentPrice && (
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
              <div className="text-center space-y-2">
                <div className="w-8 h-8 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">Connecting to live data stream...</p>
              </div>
            </div>
          )}
          {/* Hover tooltip */}
          {hoverPrice && (
            <div className="absolute top-4 left-4 bg-card/90 border border-border rounded-lg px-3 py-2 text-xs z-20 pointer-events-none shadow-lg backdrop-blur-sm">
              <p className="text-muted-foreground">{hoverPrice.time}</p>
              <p className="font-bold text-foreground">{hoverPrice.symbol}</p>
              <p className="text-primary font-mono text-sm">{hoverPrice.price}</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-1.5 border-t border-border bg-card/50 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-buy" /> Live</span>
        </div>
        <span>{new Date().toUTCString().replace("GMT", "GMT")}</span>
      </div>
    </div>
  );
};

export default DerivChart;
