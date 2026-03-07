import { EventEmitter } from "events";
import { DigitPressure, SignalDetails } from "@/components/trading/TradingPanel";

export interface Tick {
  quote: number;
  digit: number;
  epoch: number;
}

export interface EngineState {
  isTrading: boolean;
  maxOpenTrades: number;
  currentStake: number;
  martingaleMultiplier: number;
  consecutiveLosses: number;
}

class TradingEngine extends EventEmitter {
  private tickBuffer: Tick[] = [];
  private maxBufferSize = 1000;
  private digitPressure: DigitPressure = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
  private state: EngineState = {
    isTrading: false,
    maxOpenTrades: 1,
    currentStake: 3,
    martingaleMultiplier: 2.2,
    consecutiveLosses: 0,
  };

  constructor() {
    super();
    this.on("tick_received", this.processTick.bind(this));
  }

  private processTick(tick: Tick) {
    // 1. Update Tick Buffer
    this.tickBuffer = [...this.tickBuffer.slice(-(this.maxBufferSize - 1)), tick];

    // 2. Update Digit Pressure
    const newPressure = { ...this.digitPressure };
    newPressure[tick.digit] = 0;
    for (let d = 0; d <= 9; d++) {
      if (d !== tick.digit) newPressure[d] = (newPressure[d] || 0) + 1;
    }
    this.digitPressure = newPressure;

    // 3. Emit Buffer Updated Event
    this.emit("buffer_updated", {
      buffer: this.tickBuffer,
      pressure: this.digitPressure,
      lastDigit: tick.digit
    });

    // 4. Calculate Signals
    const signals = this.calculateSignals();
    this.emit("signal_calculated", signals);

    // 5. Trigger Trade if conditions met
    if (this.state.isTrading && signals.score > 0.15) {
      this.emit("should_trade", signals);
    }
  }

  private calculateSignals(): { score: number; details: SignalDetails } {
    const digits = this.tickBuffer.map(t => t.digit);
    const total = digits.length;
    
    if (total < 30) {
      return { 
        score: 0, 
        details: { frequencyScore: 0, pressureScore: 0, streakScore: 0, patternScore: 0, volatilityScore: 0 } 
      };
    }

    // Frequency Score
    const freq = new Array(10).fill(0);
    digits.forEach(d => freq[d]++);
    let maxDev = 0;
    freq.forEach(c => { maxDev = Math.max(maxDev, Math.abs((c / total) * 100 - 10)); });
    const frequencyScore = Math.min(maxDev / 10, 1);

    // Pressure Score
    let maxP = 0;
    for (let d = 0; d <= 9; d++) maxP = Math.max(maxP, this.digitPressure[d] || 0);
    const pressureScore = Math.min(maxP / 20, 1);

    // Streak Score
    let cs = 1, ms = 1;
    for (let i = digits.length - 1; i > 0; i--) {
      if (digits[i] === digits[i - 1]) { cs++; ms = Math.max(ms, cs); } else cs = 1;
    }
    const streakScore = Math.min(ms / 5, 1);

    // Pattern Score
    const last10 = digits.slice(-10);
    const pats = new Set<string>();
    for (let i = 0; i <= last10.length - 3; i++) pats.add(last10.slice(i, i + 3).join(""));
    const patternScore = Math.min(pats.size / 8, 1);

    // Volatility Score
    const recent = this.tickBuffer.slice(-20);
    let vol = 0;
    for (let i = 1; i < recent.length; i++) vol += Math.abs(recent[i].quote - recent[i - 1].quote);
    const volatilityScore = Math.min(recent.length > 1 ? (vol / (recent.length - 1)) * 100 : 0, 1);

    // Weighted Signal Score
    const score = frequencyScore * 0.25 + pressureScore * 0.30 + streakScore * 0.15 + patternScore * 0.15 + volatilityScore * 0.15;

    return { 
      score, 
      details: { frequencyScore, pressureScore, streakScore, patternScore, volatilityScore } 
    };
  }

  public updateState(newState: Partial<EngineState>) {
    this.state = { ...this.state, ...newState };
  }

  public getTickBuffer() {
    return this.tickBuffer;
  }

  public getDigitPressure() {
    return this.digitPressure;
  }
}

export const tradingEngine = new TradingEngine();
