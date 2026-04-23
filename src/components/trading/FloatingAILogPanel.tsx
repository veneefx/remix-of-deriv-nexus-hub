import { useState, useEffect, useSyncExternalStore, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, X, Trash2, Activity, ListChecks, ChevronDown, ChevronUp, Filter,
  TrendingUp, TrendingDown, CircleDot, Clock, Zap, Sparkles
} from "lucide-react";
import { aiLogger, AIEngine, AILogLevel } from "@/services/ai-logger";

const LEVEL_COLOR: Record<AILogLevel, string> = {
  info: "text-muted-foreground",
  warn: "text-warning",
  success: "text-buy",
  error: "text-sell",
  debug: "text-primary/60",
};

const ENGINE_COLOR: Record<AIEngine, string> = {
  ELIT: "bg-warning/20 text-warning border-warning/30",
  Brain: "bg-primary/20 text-primary border-primary/30",
  Balanced: "bg-buy/20 text-buy border-buy/30",
  Aggressive: "bg-sell/20 text-sell border-sell/30",
  Conservative: "bg-success/20 text-success border-success/30",
  System: "bg-muted text-muted-foreground border-border",
};

const ENGINE_ICON: Record<AIEngine, typeof Brain> = {
  Brain: Brain,
  ELIT: Sparkles,
  Balanced: CircleDot,
  Aggressive: Zap,
  Conservative: CircleDot,
  System: Activity,
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
  const [tab, setTab] = useState<"logs" | "trades" | "stats">("logs");
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

  const stats = useMemo(() => {
    const wins = filteredTrades.filter((t) => t.won).length;
    const losses = filteredTrades.filter((t) => !t.won).length;
    const total = filteredTrades.length;
    const profit = filteredTrades.reduce((acc, t) => acc + t.profit, 0);
    const winRate = total > 0 ? (wins / total) * 100 : 0;
    const byEngine: Record<string, { wins: number; total: number; profit: number }> = {};
    filteredTrades.forEach((t) => {
      if (!byEngine[t.engine]) byEngine[t.engine] = { wins: 0, total: 0, profit: 0 };
      byEngine[t.engine].total++;
      if (t.won) byEngine[t.engine].wins++;
      byEngine[t.engine].profit += t.profit;
    });
    return { wins, losses, total, profit, winRate, byEngine };
  }, [filteredTrades]);

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
      {/* FAB — green like wallet, lifted ~3in higher to clear transactions/wallet */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-60 lg:bottom-40 right-4 z-30 w-14 h-14 rounded-full bg-buy text-primary-foreground shadow-xl shadow-buy/30 flex items-center justify-center hover:scale-110 transition-transform border-2 border-buy/60 ${pulse ? "animate-pulse" : ""}`}
        title="AI Activity Log"
        style={{ display: isOpen ? "none" : "flex" }}
      >
        <Brain className="w-6 h-6" />
        {logs.length > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center border border-background">
            {Math.min(logs.length, 99)}
          </span>
        )}
      </button>

      {/* Panel — premium glass card */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-60 lg:bottom-40 right-4 z-40 w-[calc(100vw-2rem)] max-w-[460px] bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ height: collapsed ? "auto" : "min(60vh, 560px)" }}
          >
            {/* Premium header with gradient */}
            <div className="relative overflow-hidden border-b border-border">
              <div className="absolute inset-0 bg-gradient-to-r from-buy/10 via-primary/5 to-transparent pointer-events-none" />
              <div className="relative flex items-center justify-between p-3">
                <div className="flex items-center gap-2.5">
                  <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-buy to-buy/70 flex items-center justify-center shadow-lg">
                    <Brain className="w-5 h-5 text-primary-foreground" />
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-buy border-2 border-card animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      AI Command Center
                      <Sparkles className="w-3 h-3 text-warning" />
                    </h3>
                    <p className="text-[10px] text-muted-foreground">
                      {logs.length} events · {trades.length} trades · {stats.winRate.toFixed(0)}% win
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCollapsed((c) => !c)}
                    className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"
                    title={collapsed ? "Expand" : "Collapse"}
                  >
                    {collapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Mini stats strip */}
              {!collapsed && (
                <div className="relative grid grid-cols-3 gap-2 px-3 pb-3">
                  <div className="p-2 rounded-lg bg-buy/5 border border-buy/20">
                    <div className="flex items-center gap-1 text-buy text-[9px] uppercase font-bold">
                      <TrendingUp className="w-2.5 h-2.5" /> Wins
                    </div>
                    <div className="text-sm font-bold text-foreground">{stats.wins}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-sell/5 border border-sell/20">
                    <div className="flex items-center gap-1 text-sell text-[9px] uppercase font-bold">
                      <TrendingDown className="w-2.5 h-2.5" /> Losses
                    </div>
                    <div className="text-sm font-bold text-foreground">{stats.losses}</div>
                  </div>
                  <div className={`p-2 rounded-lg border ${stats.profit >= 0 ? "bg-buy/5 border-buy/20" : "bg-sell/5 border-sell/20"}`}>
                    <div className={`text-[9px] uppercase font-bold ${stats.profit >= 0 ? "text-buy" : "text-sell"}`}>
                      Net P/L
                    </div>
                    <div className={`text-sm font-bold tabular-nums ${stats.profit >= 0 ? "text-buy" : "text-sell"}`}>
                      {stats.profit >= 0 ? "+" : ""}{stats.profit.toFixed(2)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {!collapsed && (
              <>
                {/* Tabs + Filter */}
                <div className="flex items-center gap-1 p-2 border-b border-border bg-background/40">
                  <div className="flex gap-1 p-0.5 bg-secondary rounded-lg">
                    <button
                      onClick={() => setTab("logs")}
                      className={`px-3 py-1.5 text-[10px] font-semibold rounded-md transition-colors flex items-center gap-1 ${tab === "logs" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      <Activity className="w-3 h-3" /> Logs
                    </button>
                    <button
                      onClick={() => setTab("trades")}
                      className={`px-3 py-1.5 text-[10px] font-semibold rounded-md transition-colors flex items-center gap-1 ${tab === "trades" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      <ListChecks className="w-3 h-3" /> Trades
                    </button>
                    <button
                      onClick={() => setTab("stats")}
                      className={`px-3 py-1.5 text-[10px] font-semibold rounded-md transition-colors flex items-center gap-1 ${tab === "stats" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      <Sparkles className="w-3 h-3" /> Engines
                    </button>
                  </div>
                  <div className="flex items-center gap-1 ml-auto">
                    <Filter className="w-3 h-3 text-muted-foreground" />
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value as AIEngine | "All")}
                      className="text-[10px] px-1.5 py-1 bg-secondary border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {engines.map((e) => (
                        <option key={e} value={e}>{e}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => (tab === "logs" ? aiLogger.clearLogs() : aiLogger.clearTrades())}
                      className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground"
                      title="Clear"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1.5 font-mono text-[10px]">
                  {tab === "logs" ? (
                    filteredLogs.length === 0 ? (
                      <div className="text-center text-muted-foreground py-12 text-xs">
                        <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        Awaiting AI activity…
                      </div>
                    ) : (
                      [...filteredLogs].reverse().map((l) => {
                        const Icon = ENGINE_ICON[l.engine] ?? Activity;
                        return (
                          <div key={l.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-secondary/40 border border-transparent hover:border-border transition-colors">
                            <Clock className="w-3 h-3 text-muted-foreground/60 shrink-0 mt-0.5" />
                            <span className="text-muted-foreground shrink-0">{formatTime(l.ts)}</span>
                            <span className={`px-1.5 py-0 rounded border text-[8px] font-bold shrink-0 inline-flex items-center gap-1 ${ENGINE_COLOR[l.engine]}`}>
                              <Icon className="w-2.5 h-2.5" />
                              {l.engine}
                            </span>
                            <span className={`${LEVEL_COLOR[l.level]} break-words flex-1`}>{l.message}</span>
                          </div>
                        );
                      })
                    )
                  ) : tab === "trades" ? (
                    filteredTrades.length === 0 ? (
                      <div className="text-center text-muted-foreground py-12 text-xs">
                        <ListChecks className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        No trades yet
                      </div>
                    ) : (
                      filteredTrades.map((t) => (
                        <div key={t.id} className={`p-2.5 rounded-lg border ${t.won ? "bg-buy/5 border-buy/20" : "bg-sell/5 border-sell/20"}`}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className={`px-1.5 py-0.5 rounded border text-[8px] font-bold ${ENGINE_COLOR[t.engine]}`}>{t.engine}</span>
                              <span className="text-foreground font-bold">{t.contractType.replace("DIGIT", "")}</span>
                              <span className="text-muted-foreground">{t.symbol}</span>
                            </div>
                            <span className={`font-bold tabular-nums ${t.won ? "text-buy" : "text-sell"}`}>
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
                    )
                  ) : (
                    /* Engine stats tab */
                    Object.keys(stats.byEngine).length === 0 ? (
                      <div className="text-center text-muted-foreground py-12 text-xs">
                        <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        Run a trade to populate engine stats
                      </div>
                    ) : (
                      Object.entries(stats.byEngine).map(([engine, s]) => {
                        const wr = s.total > 0 ? (s.wins / s.total) * 100 : 0;
                        const Icon = ENGINE_ICON[engine as AIEngine] ?? Activity;
                        return (
                          <div key={engine} className="p-2.5 rounded-lg bg-background/60 border border-border">
                            <div className="flex items-center justify-between mb-2">
                              <span className={`px-2 py-0.5 rounded border text-[10px] font-bold inline-flex items-center gap-1 ${ENGINE_COLOR[engine as AIEngine] ?? ENGINE_COLOR.System}`}>
                                <Icon className="w-3 h-3" /> {engine}
                              </span>
                              <span className={`text-xs font-bold tabular-nums ${s.profit >= 0 ? "text-buy" : "text-sell"}`}>
                                {s.profit >= 0 ? "+" : ""}{s.profit.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-muted-foreground">
                              <span>Trades: <span className="text-foreground">{s.total}</span></span>
                              <span>Wins: <span className="text-buy">{s.wins}</span></span>
                              <span>Win rate: <span className="text-foreground">{wr.toFixed(0)}%</span></span>
                            </div>
                            <div className="mt-1.5 h-1 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full ${wr >= 50 ? "bg-buy" : "bg-sell"}`}
                                style={{ width: `${wr}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    )
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
