

# Trade Speed & Execution Logic Overhaul

## Problems Identified

1. **Proposal bottleneck**: Proposals are re-requested every 3 seconds, but trades fire on every tick. When the bot buys a contract, that proposal ID is consumed — subsequent trades in the same 3s window reuse a stale/consumed ID, causing silent failures.

2. **No proposal queue**: After buying, the code doesn't immediately request a fresh proposal. The `handleTradeResult` does request one, but only after the trade settles — causing a gap where no valid proposal exists.

3. **Listener leak**: `executeTradeContinuous` adds new `ws.on("buy")` and `ws.on("proposal_open_contract")` listeners on every call. These stack up — 10 trades = 10 listeners for `proposal_open_contract`, all firing on every contract update, causing wrong results to be attributed to wrong trades.

4. **Contract result matching**: The `proposal_open_contract` listener has no contract ID filter — it fires for ANY settled contract, meaning trade results can be double-counted or misattributed.

5. **Tick-based execution runs analysis inside the tick handler**: Heavy computation (ELIT analysis, signal scoring) blocks the tick processing path.

## Plan

### 1. Fix proposal lifecycle (critical)
- After each `buyContract` call, immediately nullify `proposalIdRef.current` so no other trade reuses it
- Request a new proposal immediately after buy, not after settlement
- Track proposals with a simple ready/consumed flag

### 2. Fix listener leaks with contract ID matching
- Refactor `executeTradeContinuous` to use a **single persistent** `proposal_open_contract` listener (registered once) that dispatches results by `contract_id`
- Maintain a `Map<contractId, { stake, callback }>` for pending trades
- Single `buy` listener that captures the `contract_id` from the buy response and registers it in the pending map

### 3. Separate trade decision from execution
- Move signal calculation out of the tick handler into a ref-based check
- The tick handler updates data only (digits, pressure, buffer)
- A separate interval (configurable speed) reads the latest signal from refs and decides whether to trade

### 4. Speed modes with proper intervals
- **Normal**: Trade decision every 3-4 seconds (wait for previous trade to settle)
- **Fast**: Trade decision every tick, non-blocking, up to MAX_CONCURRENT parallel trades
- **Turbo** (new): Fire trades as fast as proposals arrive, up to 5/sec

### 5. Instant proposal refresh
- When a proposal is consumed (bought), immediately request a new one
- Add a `proposalReady` ref flag — only trade when `proposalReady === true`
- On proposal response → set ready; on buy → set not ready + request new

## Technical Details

### Files to modify
- **`src/components/trading/TradingPanel.tsx`**: Core refactor of execution engine
  - Add `pendingTrades` ref Map for contract ID tracking
  - Single persistent `proposal_open_contract` listener
  - Proposal lifecycle: ready → consumed → request new → ready
  - Clean separation: tick handler (data only) → decision interval → execution

### Estimated scope
- ~150 lines changed in TradingPanel.tsx (execution engine section, lines ~350-720)
- No new files needed
- No database changes

