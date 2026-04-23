// ── Global single-flight trade lock ─────────────────────────────
// Prevents the engine from sending overlapping buy requests when ticks arrive
// faster than the proposal/buy round-trip. ANY engine (Brain, ELIT, Balanced,
// Aggressive, Conservative, Adaptive) must call `tryAcquire()` before issuing
// a buy and `release()` once the trade settles or fails.
//
// The lock auto-releases after a hard timeout so a dropped buy/proposal_open
// callback can never permanently jam the bot.

import { aiLogger } from "./ai-logger";

const HARD_TIMEOUT_MS = 12_000;

class TradeLock {
  private locked = false;
  private acquiredAt = 0;
  private holder: string | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;

  /** Returns true if the lock was acquired, false if another trade is in flight. */
  tryAcquire(holder: string): boolean {
    if (this.locked) {
      // Failsafe: stuck lock past hard timeout → force-release and re-acquire
      if (Date.now() - this.acquiredAt > HARD_TIMEOUT_MS) {
        aiLogger.log("System", "warn", `Trade-lock auto-released (held by ${this.holder} >${HARD_TIMEOUT_MS / 1000}s)`);
        this.forceRelease();
      } else {
        return false;
      }
    }
    this.locked = true;
    this.holder = holder;
    this.acquiredAt = Date.now();
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      if (this.locked) {
        aiLogger.log("System", "warn", `Trade-lock hard timeout (${holder})`);
        this.forceRelease();
      }
    }, HARD_TIMEOUT_MS);
    return true;
  }

  release(holder?: string) {
    if (!this.locked) return;
    if (holder && this.holder && this.holder !== holder) return; // someone else's lock
    this.forceRelease();
  }

  isLocked(): boolean {
    return this.locked;
  }

  private forceRelease() {
    this.locked = false;
    this.holder = null;
    this.acquiredAt = 0;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}

export const tradeLock = new TradeLock();
