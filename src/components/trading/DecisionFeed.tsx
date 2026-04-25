import { useSyncExternalStore } from "react";
import { Brain, ShieldAlert, Zap } from "lucide-react";
import { decisionFeed } from "@/services/decision-feed";

const actionIcon = { trade: Zap, recovery: ShieldAlert, wait: Brain, block: Brain } as const;

const DecisionFeed = () => {
  const entries = useSyncExternalStore(
    (listener) => decisionFeed.subscribe(listener),
    () => decisionFeed.getSnapshot(),
    () => [],
  );

  return (
    <div className="p-4 rounded-xl bg-card border border-border space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Decision Feed</h3>
        </div>
        <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">LIVE</span>
      </div>
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {entries.length === 0 ? (
          <p className="text-xs text-muted-foreground">Waiting for AI reads…</p>
        ) : entries.slice(0, 18).map((entry) => {
          const Icon = actionIcon[entry.action];
          return (
            <div key={entry.id} className="p-2.5 rounded-lg bg-secondary/50 border border-border">
              <div className="flex items-start gap-2">
                <Icon className={`w-3.5 h-3.5 mt-0.5 ${entry.action === "trade" ? "text-buy" : entry.action === "block" ? "text-sell" : "text-warning"}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-bold text-foreground truncate">{entry.engine} • {entry.score}%</p>
                    <span className="text-[8px] uppercase text-muted-foreground">{entry.action}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{entry.reason}</p>
                  {entry.breakdown && (
                    <div className="mt-2 grid grid-cols-2 gap-1">
                      {Object.entries(entry.breakdown).slice(0, 8).map(([key, value]) => (
                        <span key={key} className="text-[8px] rounded bg-background/70 px-1.5 py-1 text-muted-foreground flex justify-between gap-1">
                          <span className="truncate">{key}</span><b className="text-foreground">{value}</b>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DecisionFeed;