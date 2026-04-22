import { useState, useEffect, useRef } from "react";
import { ExternalLink, RefreshCw, AlertTriangle, Loader2 } from "lucide-react";

/**
 * Embedded Deriv DTrader template.
 *
 * Uses an iframe to render the official deriv-com/dtrader-template deployment
 * so the page looks/behaves exactly like Deriv's DTrader. Includes loading
 * state, sandbox protections, and a third-party-cookie blocked fallback.
 */
const PRIMARY_URL = "https://dtrader-template.binary.sx/";
const FALLBACK_URL = "https://app.deriv.com/dtrader";

const DTraderView = () => {
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);
  const [src, setSrc] = useState(PRIMARY_URL);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const loadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // If the iframe never loads (CSP / X-Frame-Options / blocked cookies), surface
  // a helpful fallback after 8s instead of leaving the user with a blank screen.
  useEffect(() => {
    setLoading(true);
    setErrored(false);
    if (loadTimer.current) clearTimeout(loadTimer.current);
    loadTimer.current = setTimeout(() => {
      setLoading((isLoading) => {
        if (isLoading) setErrored(true);
        return false;
      });
    }, 8000);
    return () => {
      if (loadTimer.current) clearTimeout(loadTimer.current);
    };
  }, [reloadKey, src]);

  const handleLoad = () => {
    if (loadTimer.current) clearTimeout(loadTimer.current);
    setLoading(false);
    setErrored(false);
  };

  const handleReload = () => {
    setReloadKey((k) => k + 1);
  };

  const switchToFallback = () => {
    setSrc((current) => (current === PRIMARY_URL ? FALLBACK_URL : PRIMARY_URL));
    setReloadKey((k) => k + 1);
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-card/50">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-1.5 h-1.5 rounded-full bg-buy animate-pulse" />
          <span className="text-xs font-bold text-foreground">Deriv</span>
          <span className="text-[10px] text-muted-foreground truncate">
            DTrader · {src === PRIMARY_URL ? "template" : "live"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={switchToFallback}
            className="px-2 py-1 rounded text-[10px] font-medium bg-secondary text-foreground hover:bg-muted transition-colors"
            title="Toggle DTrader source"
          >
            {src === PRIMARY_URL ? "Use Live" : "Use Template"}
          </button>
          <button
            onClick={handleReload}
            className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            title="Reload"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Iframe area */}
      <div className="flex-1 relative bg-background">
        {loading && !errored && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-background/80 backdrop-blur-sm">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <p className="text-xs text-muted-foreground">Loading DTrader…</p>
          </div>
        )}

        {errored && (
          <div className="absolute inset-0 z-10 flex items-center justify-center p-6 bg-background">
            <div className="max-w-sm text-center space-y-3 p-5 rounded-2xl bg-card border border-border shadow-xl">
              <div className="w-10 h-10 mx-auto rounded-full bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <h3 className="text-sm font-bold text-foreground">DTrader couldn't load</h3>
              <p className="text-[11px] text-muted-foreground">
                The embed may be blocked by your browser's third-party cookie or tracking
                protection. Try reloading, switching the source, or opening it in a new tab.
              </p>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  onClick={handleReload}
                  className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3" />
                  Reload
                </button>
                <button
                  onClick={switchToFallback}
                  className="px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-semibold"
                >
                  Switch source
                </button>
                <a
                  href={src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold inline-flex items-center gap-1.5 text-foreground"
                >
                  <ExternalLink className="w-3 h-3" />
                  Open
                </a>
              </div>
            </div>
          </div>
        )}

        <iframe
          ref={iframeRef}
          key={`${src}-${reloadKey}`}
          src={src}
          onLoad={handleLoad}
          className="absolute inset-0 w-full h-full border-none"
          title="Deriv DTrader"
          referrerPolicy="no-referrer-when-downgrade"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; payment"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-popups-to-escape-sandbox allow-modals allow-storage-access-by-user-activation"
        />
      </div>
    </div>
  );
};

export default DTraderView;
