import type { AIEngine } from "./ai-logger";

export type DecisionAction = "trade" | "wait" | "block" | "recovery";

export interface DecisionFeedEntry {
  id: string;
  ts: number;
  engine: AIEngine;
  action: DecisionAction;
  score: number;
  contractType?: string | null;
  barrier?: string | null;
  reason: string;
  breakdown?: Record<string, number | string>;
}

type Listener = () => void;

class DecisionFeedStore {
  private entries: DecisionFeedEntry[] = [];
  private listeners = new Set<Listener>();
  private max = 120;

  push(entry: Omit<DecisionFeedEntry, "id" | "ts">) {
    const full: DecisionFeedEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ts: Date.now(),
      ...entry,
    };
    this.entries = [full, ...this.entries].slice(0, this.max);
    this.listeners.forEach((listener) => listener());
  }

  getSnapshot() {
    return this.entries;
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const decisionFeed = new DecisionFeedStore();