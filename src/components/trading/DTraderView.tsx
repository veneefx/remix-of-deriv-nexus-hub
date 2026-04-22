import { useState } from "react";
import { ExternalLink, RefreshCw } from "lucide-react";

/**
 * Embedded Deriv DTrader template.
 * Uses an iframe to render the official deriv-com/dtrader-template deployment
 * so the page looks/behaves exactly like Deriv's DTrader.
 */
const DTRADER_URL = "https://app.deriv.com/dtrader";

const DTraderView = () => {
  const [reloadKey, setReloadKey] = useState(0);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-card/50">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-buy animate-pulse" />
          <span className="text-xs font-bold text-foreground">Deriv</span>
          <span className="text-[10px] text-muted-foreground">DTrader Terminal</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            title="Reload"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <a
            href={DTRADER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Iframe */}
      <div className="flex-1 relative">
        <iframe
          key={reloadKey}
          src={DTRADER_URL}
          className="absolute inset-0 w-full h-full border-none"
          title="Deriv DTrader"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; payment"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-popups-to-escape-sandbox allow-modals"
        />
      </div>
    </div>
  );
};

export default DTraderView;
