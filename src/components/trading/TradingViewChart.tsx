import { useEffect, useRef, useState, useCallback } from "react";
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time, ColorType } from "lightweight-charts";
import DerivWebSocket from "@/services/deriv-websocket";
import { VOLATILITY_MARKETS } from "@/lib/trading-constants";

interface TradingViewChartProps {
  ws: DerivWebSocket | null;
  selectedMarket: string;
}

type Timeframe = "1m" | "2m" | "3m" | "5m" | "10m" | "15m" | "30m" | "1h" | "2h" | "4h" | "8h";

const TIMEFRAMES: { label: string; value: Timeframe; seconds: number }[] = [
  { label: "1m", value: "1m", seconds: 60 },
  { label: "2m", value: "2m", seconds: 120 },
  { label: "3m", value: "3m", seconds: 180 },
  { label: "5m", value: "5m", seconds: 300 },
  { label: "10m", value: "10m", seconds: 600 },
  { label: "15m", value: "15m", seconds: 900 },
  { label: "30m", value: "30m", seconds: 1800 },
  { label: "1h", value: "1h", seconds: 3600 },
  { label: "2h", value: "2h", seconds: 7200 },
  { label: "4h", value: "4h", seconds: 14400 },
  { label: "8h", value: "8h", seconds: 28800 },
];

interface OHLCData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

const TradingViewChart = ({ ws, selectedMarket }: TradingViewChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const candlesRef = useRef<Map<number, OHLCData>>(new Map());
  const [timeframe, setTimeframe] = useState<Timeframe>("1m");
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [ohlc, setOhlc] = useState<{ o: number; h: number; l: number; c: number } | null>(null);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [priceChangePercent, setPriceChangePercent] = useState<number>(0);
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
        vertLines: { color: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)" },
        horzLines: { color: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)" },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)", style: 3 },
        horzLine: { color: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)", style: 3 },
      },
      rightPriceScale: {
        borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: true,
      handleScale: true,
    });

    const series = chart.addCandlestickSeries({
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderDownColor: "#ef5350",
      borderUpColor: "#26a69a",
      wickDownColor: "#ef5350",
      wickUpColor: "#26a69a",
    });

    chartRef.current = chart;
    seriesRef.current = series;

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
      seriesRef.current = null;
    };
  }, [isDark]);

  // Handle tick data
  useEffect(() => {
    if (!ws || !seriesRef.current) return;
    candlesRef.current.clear();

    const intervalSeconds = TIMEFRAMES.find(t => t.value === timeframe)?.seconds || 60;

    const unsub = ws.on("tick", (data) => {
      if (!data.tick || !seriesRef.current) return;
      const price = data.tick.quote;
      const epoch = data.tick.epoch;
      const candleTime = Math.floor(epoch / intervalSeconds) * intervalSeconds;

      setCurrentPrice(price);

      const candles = candlesRef.current;
      const existing = candles.get(candleTime);

      if (existing) {
        existing.high = Math.max(existing.high, price);
        existing.low = Math.min(existing.low, price);
        existing.close = price;
      } else {
        candles.set(candleTime, {
          time: candleTime,
          open: price,
          high: price,
          low: price,
          close: price,
        });
        // Keep max 500 candles
        if (candles.size > 500) {
          const firstKey = candles.keys().next().value;
          if (firstKey !== undefined) candles.delete(firstKey);
        }
      }

      const candle = candles.get(candleTime)!;
      setOhlc({ o: candle.open, h: candle.high, l: candle.low, c: candle.close });

      // Calculate change from first candle
      const allCandles = Array.from(candles.values());
      if (allCandles.length > 1) {
        const firstClose = allCandles[0].close;
        setPriceChange(price - firstClose);
        setPriceChangePercent(((price - firstClose) / firstClose) * 100);
      }

      // Update the series
      try {
        seriesRef.current?.update({
          time: candleTime as Time,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
        });
      } catch (e) {
        // If update fails, set all data
        const sorted = allCandles.sort((a, b) => a.time - b.time);
        seriesRef.current?.setData(
          sorted.map(c => ({
            time: c.time as Time,
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
          }))
        );
      }
    });

    return () => { unsub(); };
  }, [ws, selectedMarket, timeframe]);

  // Clear candles when timeframe changes
  useEffect(() => {
    candlesRef.current.clear();
    seriesRef.current?.setData([]);
  }, [timeframe, selectedMarket]);

  const changeColor = priceChange >= 0 ? "text-buy" : "text-sell";

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Top bar - OHLC info */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-border bg-card/50 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-primary font-bold">●</span>
          <span className="font-semibold text-foreground">{marketLabel} · {timeframe}</span>
        </div>
        {ohlc && (
          <div className="flex items-center gap-3 text-muted-foreground">
            <span>O<span className="text-foreground ml-0.5">{ohlc.o.toFixed(4)}</span></span>
            <span>H<span className="text-buy ml-0.5">{ohlc.h.toFixed(4)}</span></span>
            <span>L<span className="text-sell ml-0.5">{ohlc.l.toFixed(4)}</span></span>
            <span>C<span className="text-foreground ml-0.5">{ohlc.c.toFixed(4)}</span></span>
            <span className={changeColor}>
              {priceChange >= 0 ? "+" : ""}{priceChange.toFixed(4)} ({priceChangePercent >= 0 ? "+" : ""}{priceChangePercent.toFixed(2)}%)
            </span>
          </div>
        )}
      </div>

      {/* Chart area */}
      <div className="flex-1 relative">
        <div ref={containerRef} className="absolute inset-0" />
        {candlesRef.current.size < 2 && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className="text-center space-y-2">
              <div className="w-8 h-8 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Collecting tick data...</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar - Timeframes */}
      <div className="flex items-center justify-between px-4 py-1.5 border-t border-border bg-card/50">
        <div className="flex items-center gap-1">
          {TIMEFRAMES.map(tf => (
            <button
              key={tf.value}
              onClick={() => setTimeframe(tf.value)}
              className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors ${
                timeframe === tf.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span>%</span>
          <span>log</span>
          <span>auto</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-buy" />
            {new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })} (UTC)
          </span>
        </div>
      </div>
    </div>
  );
};

export default TradingViewChart;
