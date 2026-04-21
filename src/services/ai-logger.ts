// ── Global AI Event Logger ───────────────────────────────────────
// Singleton bus for ALL AI engines (ELIT, Deriv Brain, Balanced, etc.)
// Subscribed to by FloatingAILogPanel for transparent execution visibility.

export type AILogLevel = "info" | "warn" | "success" | "error" | "debug";
export type AIEngine = "ELIT" | "Brain" | "Balanced" | "Aggressive" | "Conservative" | "System";

export interface AILogEntry {
  id: string;
  ts: number;
  engine: AIEngine;
  level: AILogLevel;
  message: string;
}

export interface AITradeEntry {
  id: string;
  ts: number;
  engine: AIEngine;
  contractId: string;
  contractType: string;
  symbol: string;
  entryDigit: number | null;
  exitDigit: number | null;
  stake: number;
  profit: number;
  won: boolean;
}

type Listener = () => void;

class AILoggerStore {
  private logs: AILogEntry[] = [];
  private trades: AITradeEntry[] = [];
  private maxLogs = 200;
  private maxTrades = 100;
  private listeners = new Set<Listener>();

  log(engine: AIEngine, level: AILogLevel, message: string) {
    // De-dup spam: don't push if last entry is identical within 800ms
    const last = this.logs[this.logs.length - 1];
    if (last && last.engine === engine && last.message === message && Date.now() - last.ts < 800) return;

    this.logs.push({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ts: Date.now(),
      engine,
      level,
      message,
    });
    if (this.logs.length > this.maxLogs) this.logs = this.logs.slice(-this.maxLogs);
    this.notify();
  }

  trade(entry: Omit<AITradeEntry, "id" | "ts">) {
    this.trades.unshift({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ts: Date.now(),
      ...entry,
    });
    if (this.trades.length > this.maxTrades) this.trades = this.trades.slice(0, this.maxTrades);
    this.notify();
  }

  getLogs() { return this.logs; }
  getTrades() { return this.trades; }

  clearLogs() { this.logs = []; this.notify(); }
  clearTrades() { this.trades = []; this.notify(); }

  subscribe(l: Listener) {
    this.listeners.add(l);
    return () => { this.listeners.delete(l); };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }
}

export const aiLogger = new AILoggerStore();
