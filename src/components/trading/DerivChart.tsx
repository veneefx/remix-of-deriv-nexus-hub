import { useState } from "react";
import { VOLATILITY_MARKETS } from "@/lib/trading-constants";
import DerivWebSocket from "@/services/deriv-websocket";

interface DerivChartProps {
  ws: DerivWebSocket | null;
  selectedMarket: string;
}

const CHART_STYLES = [
  { label: "Area", style: "area" },
  { label: "Candle", style: "candles" },
  { label: "Hollow", style: "hollow" },
  { label: "OHLC", style: "ohlc" },
  { label: "Line", style: "line" },
];

const TIMEFRAMES = [
  { label: "1m", granularity: 60 },
  { label: "5m", granularity: 300 },
  { label: "10m", granularity: 600 },
  { label: "15m", granularity: 900 },
  { label: "30m", granularity: 1800 },
  { label: "1h", granularity: 3600 },
  { label: "2h", granularity: 7200 },
  { label: "4h", granularity: 14400 },
  { label: "8h", granularity: 28800 },
  { label: "1d", granularity: 86400 },
];

const DerivChart = ({ ws, selectedMarket }: DerivChartProps) => {
  const [chartStyle, setChartStyle] = useState("area");
  const [timeframe, setTimeframe] = useState("1m");

  const marketLabel = VOLATILITY_MARKETS.find(m => m.symbol === selectedMarket)?.label || selectedMarket;

  // Build SmartCharts URL with params
  const chartUrl = `https://charts.deriv.com/charts?symbol=${selectedMarket}&chartType=${chartStyle}&theme=dark&lang=en&hideShareButton=true`;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-card/50 flex-wrap">
        {/* Market label */}
        <span className="text-xs font-bold text-foreground mr-2">{marketLabel}</span>

        {/* Timeframe buttons */}
        <div className="flex items-center gap-0.5 bg-secondary rounded-md p-0.5">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.label}
              onClick={() => setTimeframe(tf.label)}
              className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
                timeframe === tf.label
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>

        {/* Chart style buttons */}
        <div className="flex items-center gap-0.5 bg-secondary rounded-md p-0.5 ml-auto">
          {CHART_STYLES.map((cs) => (
            <button
              key={cs.style}
              onClick={() => setChartStyle(cs.style)}
              className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
                chartStyle === cs.style
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {cs.label}
            </button>
          ))}
        </div>
      </div>

      {/* SmartCharts iframe */}
      <div className="flex-1 relative">
        <iframe
          key={`${selectedMarket}-${chartStyle}-${timeframe}`}
          src={chartUrl}
          className="absolute inset-0 w-full h-full border-none"
          title="Deriv SmartCharts"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-1.5 border-t border-border bg-card/50 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-buy" /> Deriv SmartCharts
        </span>
        <span>Powered by Deriv API</span>
      </div>
    </div>
  );
};

export default DerivChart;
