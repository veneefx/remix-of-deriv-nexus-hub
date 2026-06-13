import { Bug, CheckCircle2, AlertTriangle, Wifi } from "lucide-react";
import type { TokenValidationDebug } from "@/services/deriv-auth";

const formatJson = (value: unknown) => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const TokenDebugPanel = ({ debug }: { debug: TokenValidationDebug | null }) => {
  if (!debug) return null;

  const ok = debug.connectionState === "message" || debug.connectionState === "closed";

  return (
    <div className="rounded-xl border border-border bg-secondary/30 p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Bug className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Token Debug</h3>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${ok ? "bg-buy/10 text-buy" : "bg-warning/10 text-warning"}`}>
          <Wifi className="w-3 h-3" />
          {debug.validatorPath}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px]">
        <div className="rounded-lg border border-border bg-card p-2">
          <p className="text-muted-foreground uppercase font-bold">Path</p>
          <p className="mt-1 text-foreground font-semibold break-all">{debug.validatorPath}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-2">
          <p className="text-muted-foreground uppercase font-bold">State</p>
          <p className="mt-1 text-foreground font-semibold">{debug.connectionState}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-2">
          <p className="text-muted-foreground uppercase font-bold">Updated</p>
          <p className="mt-1 text-foreground font-semibold">{new Date(debug.timestamp).toLocaleTimeString()}</p>
        </div>
      </div>

      {debug.error && (
        <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
          <AlertTriangle className="w-4 h-4 mt-0.5" />
          <span>{debug.error}</span>
        </div>
      )}

      {!debug.error && debug.response && (
        <div className="flex items-start gap-2 rounded-lg border border-buy/30 bg-buy/10 p-3 text-xs text-buy">
          <CheckCircle2 className="w-4 h-4 mt-0.5" />
          <span>Authorize response received from Deriv.</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        <div>
          <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Authorize Request</p>
          <pre className="max-h-40 overflow-auto rounded-lg border border-border bg-card p-3 text-[10px] text-foreground whitespace-pre-wrap break-all">{formatJson({ url: debug.request.url, payload: debug.request.payload })}</pre>
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Authorize Response</p>
          <pre className="max-h-48 overflow-auto rounded-lg border border-border bg-card p-3 text-[10px] text-foreground whitespace-pre-wrap break-all">{debug.response ? formatJson(debug.response) : "Waiting for response…"}</pre>
        </div>
      </div>
    </div>
  );
};

export default TokenDebugPanel;