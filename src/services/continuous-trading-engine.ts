// Continuous Trading Engine: Never stops, trades back-to-back unless SL/TP hit
import { eventBus, TradingEvents } from "./event-bus";
import { tickBuffer } from "./tick-buffer";
import { signalEngine } from "./signal-engine";
import { smartProfitManager } from "./smart-profit-manager";

interface ContinuousTradeConfig {
  market: string;
  baseStake: number;
  maxParallelTrades: number;
  aggressiveMode: boolean;
  autoRecover: boolean;
  stopLoss: number; // percentage
  takeProfit: number; // percentage
}

interface ActiveTrade {
  tradeId: string;
  entryPrice: number;
  stake: number;
  direction: "UP" | "DOWN";
  openedAt: number;
  recoveryAttempt: number;
}

class ContinuousTradingEngine {
  private isRunning: boolean = false;
  private config: ContinuousTradeConfig | null = null;
  private activeTrades: Map<string, ActiveTrade> = new Map();
  private tradeExecutionInterval: NodeJS.Timeout | null = null;
  private lastTradeTime: number = 0;
  private consecutiveLosses: number = 0;
  private currentStake: number = 0;
  private totalProfit: number = 0;

  /**
   * Start continuous trading - never stops until manually stopped or SL/TP hit
   */
  start(config: ContinuousTradeConfig): void {
    if (this.isRunning) {
      console.warn("Trading engine is already running");
      return;
    }

    this.isRunning = true;
    this.config = config;
    this.currentStake = config.baseStake;
    this.consecutiveLosses = 0;
    this.totalProfit = 0;
    this.activeTrades.clear();

    // Initialize profit manager
    smartProfitManager.initialize(config.baseStake);

    // Update signal engine for continuous mode
    signalEngine.updateStrategy({
      maxOpenTrades: config.maxParallelTrades,
      minTradeInterval: config.aggressiveMode ? 500 : 1000, // 500ms aggressive, 1s normal
      signalThreshold: config.aggressiveMode ? 45 : 60, // Lower threshold for aggressive
    });

    // Start continuous execution loop
    this.startContinuousLoop();

    eventBus.emit(TradingEvents.BOT_STARTED, {
      mode: "CONTINUOUS",
      market: config.market,
      baseStake: config.baseStake,
      maxParallelTrades: config.maxParallelTrades,
      aggressiveMode: config.aggressiveMode,
      timestamp: Date.now(),
    });

    console.log("🚀 CONTINUOUS TRADING ENGINE STARTED - Never stops until SL/TP or manual stop");
  }

  /**
   * Stop trading - only manual stop or SL/TP hit
   */
  stop(reason: string = "manual"): void {
    if (!this.isRunning) {
      console.warn("Trading engine is not running");
      return;
    }

    this.isRunning = false;
    this.stopContinuousLoop();

    eventBus.emit(TradingEvents.BOT_STOPPED, {
      reason,
      totalProfit: this.totalProfit,
      activeTrades: this.activeTrades.size,
      timestamp: Date.now(),
    });

    console.log(`⛔ CONTINUOUS TRADING ENGINE STOPPED - Reason: ${reason}`);
  }

  /**
   * Start the continuous execution loop
   */
  private startContinuousLoop(): void {
    if (this.tradeExecutionInterval) {
      clearInterval(this.tradeExecutionInterval);
    }

    // Execute trades back-to-back with minimal delay
    this.tradeExecutionInterval = setInterval(() => {
      this.executeContinuousTrade();
    }, this.config?.aggressiveMode ? 500 : 1000);
  }

  /**
   * Stop the continuous loop
   */
  private stopContinuousLoop(): void {
    if (this.tradeExecutionInterval) {
      clearInterval(this.tradeExecutionInterval);
      this.tradeExecutionInterval = null;
    }
  }

  /**
   * Execute continuous trade - back-to-back without waiting
   */
  private executeContinuousTrade(): void {
    if (!this.isRunning || !this.config) return;

    // Check if we can open more trades
    if (this.activeTrades.size >= this.config.maxParallelTrades) {
      return;
    }

    // Check if enough time has passed since last trade
    if (Date.now() - this.lastTradeTime < (this.config.aggressiveMode ? 500 : 1000)) {
      return;
    }

    // Evaluate signal
    const signal = signalEngine.evaluateSignal(this.config.market);
    if (!signal) {
      return;
    }

    // Execute trade immediately
    this.openTrade(signal.signal);
  }

  /**
   * Open a new trade
   */
  private openTrade(direction: "UP" | "DOWN"): void {
    if (!this.config) return;

    const tradeId = `CONT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const lastTicks = tickBuffer.getLastTicks(this.config.market, 1);
    const entryPrice = lastTicks.length > 0 ? lastTicks[0].price : 0;

    // Create active trade
    const trade: ActiveTrade = {
      tradeId,
      entryPrice,
      stake: this.currentStake,
      direction,
      openedAt: Date.now(),
      recoveryAttempt: this.consecutiveLosses,
    };

    this.activeTrades.set(tradeId, trade);
    this.lastTradeTime = Date.now();
    signalEngine.recordTrade();

    // Emit trade opened event
    eventBus.emit(TradingEvents.TRADE_OPENED, {
      tradeId,
      market: this.config.market,
      direction,
      stake: this.currentStake,
      entryPrice,
      openedAt: Date.now(),
      mode: "CONTINUOUS",
    });

    console.log(
      `📈 [CONTINUOUS] Trade ${tradeId}: ${direction} @ $${entryPrice} (Stake: $${this.currentStake})`
    );

    // Start monitoring this trade
    this.monitorTrade(tradeId);
  }

  /**
   * Monitor trade for SL/TP
   */
  private monitorTrade(tradeId: string): void {
    if (!this.config) return;

    const monitorInterval = setInterval(() => {
      if (!this.isRunning || !this.activeTrades.has(tradeId)) {
        clearInterval(monitorInterval);
        return;
      }

      const trade = this.activeTrades.get(tradeId)!;
      const lastTicks = tickBuffer.getLastTicks(this.config!.market, 1);
      if (lastTicks.length === 0) return;

      const currentPrice = lastTicks[0].price;
      const priceChange = ((currentPrice - trade.entryPrice) / trade.entryPrice) * 100;

      // Check Take Profit
      if (priceChange >= this.config.takeProfit) {
        this.closeTrade(tradeId, trade.stake * (this.config.takeProfit / 100), "WIN");
        clearInterval(monitorInterval);
        return;
      }

      // Check Stop Loss
      if (priceChange <= -this.config.stopLoss) {
        this.closeTrade(tradeId, -trade.stake * (this.config.stopLoss / 100), "LOSS");
        clearInterval(monitorInterval);
        return;
      }
    }, 100); // Check every 100ms for tight SL/TP
  }

  /**
   * Close a trade
   */
  private closeTrade(tradeId: string, profit: number, status: "WIN" | "LOSS"): void {
    const trade = this.activeTrades.get(tradeId);
    if (!trade) return;

    this.activeTrades.delete(tradeId);
    this.totalProfit += profit;

    // Update profit manager
    if (status === "WIN") {
      smartProfitManager.handleWin(profit);
      this.consecutiveLosses = 0;
    } else {
      smartProfitManager.handleLoss(Math.abs(profit));
      this.consecutiveLosses++;

      // Check if recovery should be triggered
      if (this.config?.autoRecover && this.consecutiveLosses >= 2) {
        this.currentStake = smartProfitManager.getCurrentStake();
        eventBus.emit(TradingEvents.RECOVERY_TRIGGERED, {
          consecutiveLosses: this.consecutiveLosses,
          newStake: this.currentStake,
        });
      }
    }

    // Emit trade closed event
    eventBus.emit(TradingEvents.TRADE_CLOSED, {
      tradeId,
      profit,
      status,
      closedAt: Date.now(),
    });

    console.log(
      `${status === "WIN" ? "✅" : "❌"} Trade ${tradeId} closed: ${status} (Profit: $${profit.toFixed(2)})`
    );

    // **CRITICAL**: Engine continues running - opens next trade back-to-back
    // No pause, no reset, just continuous execution
  }

  /**
   * Get engine status
   */
  getStatus(): {
    isRunning: boolean;
    activeTrades: number;
    currentStake: number;
    totalProfit: number;
    consecutiveLosses: number;
    config: ContinuousTradeConfig | null;
  } {
    return {
      isRunning: this.isRunning,
      activeTrades: this.activeTrades.size,
      currentStake: this.currentStake,
      totalProfit: this.totalProfit,
      consecutiveLosses: this.consecutiveLosses,
      config: this.config,
    };
  }

  /**
   * Force close all trades (emergency)
   */
  forceCloseAll(): void {
    this.activeTrades.forEach((trade) => {
      this.closeTrade(trade.tradeId, 0, "LOSS");
    });
  }

  /**
   * Check if engine is running
   */
  isEngineRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get active trades
   */
  getActiveTrades(): ActiveTrade[] {
    return Array.from(this.activeTrades.values());
  }
}

export const continuousTradingEngine = new ContinuousTradingEngine();
