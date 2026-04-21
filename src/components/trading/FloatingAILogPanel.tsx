import { useState, useEffect, useSyncExternalStore, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, X, Trash2, Activity, ListChecks, ChevronDown, ChevronUp, Filter } from "lucide-react";
import { aiLogger, AIEngine, AILogLevel } from "@/services/ai-logger";

const LEVEL_COLOR: Record<AILogLevel, string> = {
  info: "text-muted-foreground",
  warn: "text-warning",
  success: "text-buy",
  error: "text-sell",
  debug: "text-primary/60",
};

const ENGINE_COLOR: Record<AIEngine, string> = {
  ELIT: "bg-warning/20 text-warning",
  Brain: "bg-primary/20 text-primary",
  Balanced: "bg-buy/20 text-buy",
  Aggressive: "bg-sell/20 text-sell",
  Conservative: "bg-success/20 text-success",
  System: "bg-muted text-muted-foreground",
};

function formatTime(ts: number) {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`;
}

const subscribe = (cb: () => void) => aiLogger.subscribe(cb);
const getSnapshot = () => aiLogger.getLogs();
const getTradesSnapshot = () => aiLogger.getTrades();

const FloatingAILogPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<"logs" | "trades">("logs");
  const [filter, setFilter] = useState<AIEngine | "All">("All");
  const [collapsed, setCollapsed] = useState(false);

  const logs = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const trades = useSyncExternalStore(subscribe, getTradesSnapshot, getTradesSnapshot);

  const filteredLogs = useMemo(
    () => (filter === "All" ? logs : logs.filter((l) => l.engine === filter)),
    [logs, filter]
  );
  const filteredTrades = useMemo(
    () => (filter === "All" ? trades : trades.filter((t) => t.engine === filter)),
    [trades, filter]
  );

  // Pulse the FAB when new logs arrive
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    if (!isOpen && logs.length > 0) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 1000);
      return () => clearTimeout(t);
    }
  }, [logs.length, isOpen]);

  const engines: (AIEngine | "All")[] = ["All", "Brain", "ELIT", "Balanced", "Aggressive", "System"];

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-32 lg:bottom-24 right-4 z-30 w-14 h-14 rounded-full bg-card border-2 border-primary shadow-xl flex items-center justify-center hover:scale-110 transition-transform ${pulse ? "animate-pulse" : ""}`}
        title="AI Activity Log"
        style={{ display: isOpen ? "none" : "flex" }}
      >
        <Brain className="w-6 h-6 text-primary" />
        {logs.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
            {Math.min(logs.length, 99)}
          </span>
        )}
      </button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-4 right-4 z-40 w-full max-w-[420px] bg-card border border-border rounded-xl shadow-2xl flex flex-col"
            style={{ height: collapsed ? "auto" : "min(60vh, 600px)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">AI Activity</h3>
                  <p className="text-[9px] text-muted-foreground">Live engine logs & trades</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCollapsed((c) => !c)}
                  className="p-1.5 rounded hover:bg-secondary text-muted-foreground"
                  title={collapsed ? "Expand" : "Collapse"}
                >
                  {collapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded hover:bg-secondary text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!collapsed && (
              <>
                {/* Tabs + Filter */}
                <div className="flex items-center gap-1 p-2 border-b border-border">
                  <div className="flex gap-1 p-0.5 bg-secondary rounded-md">
                    <button
                      onClick={() => setTab("logs")}
                      className={`px-3 py-1 text-[10px] font-medium rounded transition-colors flex items-center gap-1 ${tab === "logs" ? "bg-background text-foreground" : "text-muted-foreground"}`}
                    >
                      <Activity className="w-3 h-3" /> Logs ({logs.length})
                    </button>
                    <button
                      onClick={() => setTab("trades")}
                      className={`px-3 py-1 text-[10px] font-medium rounded transition-colors flex items-center gap-1 ${tab === "trades" ? "bg-background text-foreground" : "text-muted-foreground"}`}
                    >
                      <ListChecks className="w-3 h-3" /> Trades ({trades.length})
                    </button>
                  </div>
                  <div className="flex items-center gap-1 ml-auto">
                    <Filter className="w-3 h-3 text-muted-foreground" />
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value as AIEngine | "All")}
                      className="text-[10px] px-1.5 py-0.5 bg-secondary border border-border rounded text-foreground focus:outline-none"
                    >
                      {engines.map((e) => (
                        <option key={e} value={e}>{e}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => (tab === "logs" ? aiLogger.clearLogs() : aiLogger.clearTrades())}
                      className="p-1 rounded hover:bg-secondary text-muted-foreground"
                      title="Clear"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-[10px]">
                  {tab === "logs" ? (
                    filteredLogs.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8 text-xs">No activity yet</div>
                    ) : (
                      [...filteredLogs].reverse().map((l) => (
                        <div key={l.id} className="flex items-start gap-2 p-1.5 rounded hover:bg-secondary/50">
                          <span className="text-muted-foreground shrink-0">{formatTime(l.ts)}</span>
                          <span className={`px-1.5 py-0 rounded text-[8px] font-bold shrink-0 ${ENGINE_COLOR[l.engine]}`}>
                            {l.engine}
                          </span>
                          <span className={`${LEVEL_COLOR[l.level]} break-words`}>{l.message}</span>
                        </div>
                      ))
                    )
                  ) : filteredTrades.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8 text-xs">No trades yet</div>
                  ) : (
                    filteredTrades.map((t) => (
                      <div key={t.id} className={`p-2 rounded border ${t.won ? "bg-buy/5 border-buy/20" : "bg-sell/5 border-sell/20"}`}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-1.5 py-0 rounded text-[8px] font-bold ${ENGINE_COLOR[t.engine]}`}>{t.engine}</span>
                            <span className="text-foreground font-bold">{t.contractType.replace("DIGIT", "")}</span>
                            <span className="text-muted-foreground">{t.symbol}</span>
                          </div>
                          <span className={`font-bold ${t.won ? "text-buy" : "text-sell"}`}>
                            {t.won ? "+" : ""}{t.profit.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <span>Entry: <span className="text-foreground">{t.entryDigit ?? "-"}</span></span>
                          <span>Exit: <span className="text-foreground">{t.exitDigit ?? "-"}</span></span>
                          <span>Stake: <span className="text-foreground">${t.stake.toFixed(2)}</span></span>
                          <span className="ml-auto">{formatTime(t.ts)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingAILogPanel;
