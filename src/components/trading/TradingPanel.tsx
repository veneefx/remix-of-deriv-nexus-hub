import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import DerivWebSocket from "@/services/deriv-websocket";
import { DerivAccount } from "@/services/deriv-auth";
import { VOLATILITY_MARKETS, CONTRACT_TYPES, DIGIT_BARRIERS, getLastDigit } from "@/lib/trading-constants";

interface TradingPanelProps {
  ws: DerivWebSocket | null;
  account: DerivAccount;
}

const TradingPanel = ({ ws, account }: TradingPanelProps) => {
  const [selectedMarket, setSelectedMarket] = useState<string>(VOLATILITY_MARKETS[0].symbol);
  const [contractType, setContractType] = useState("DIGITOVER");
  const [stake, setStake] = useState("0.35");
  const [duration, setDuration] = useState(1);
  const [durationUnit, setDurationUnit] = useState("t");
  const [barrier, setBarrier] = useState("4");
  const [lastDigits, setLastDigits] = useState<number[]>([]);
  const [currentTick, setCurrentTick] = useState<number | null>(null);
  const [proposalId, setProposalId] = useState<string | null>(null);
  const [payout, setPayout] = useState<number | null>(null);
  const [isTrading, setIsTrading] = useState(false);
  const [tradeResult, setTradeResult] = useState<{ profit: number; won: boolean } | null>(null);
  const [softwareStatus, setSoftwareStatus] = useState<"INACTIVE" | "ACTIVE">("INACTIVE");
  const prevMarketRef = useRef(selectedMarket);

  // Subscribe to ticks when market changes
  useEffect(() => {
    if (!ws) return;

    if (prevMarketRef.current !== selectedMarket) {
      ws.unsubscribeTicks(prevMarketRef.current);
    }
    prevMarketRef.current = selectedMarket;
    ws.subscribeTicks(selectedMarket);

    const unsub = ws.on("tick", (data) => {
      if (data.tick) {
        const quote = data.tick.quote;
        setCurrentTick(quote);
        const digit = getLastDigit(quote);
        setLastDigits((prev) => [...prev.slice(-99), digit]);
      }
    });

    return () => {
      unsub();
    };
  }, [ws, selectedMarket]);

  // Get proposal
  useEffect(() => {
    if (!ws || isTrading) return;

    const needsBarrier = contractType === "DIGITOVER" || contractType === "DIGITUNDER";

    ws.getProposal({
      amount: parseFloat(stake) || 0.35,
      contractType,
      symbol: selectedMarket,
      duration,
      durationUnit,
      ...(needsBarrier && { barrier }),
    });

    const unsub = ws.on("proposal", (data) => {
      if (data.proposal) {
        setProposalId(data.proposal.id);
        setPayout(data.proposal.payout);
      }
    });

    return () => { unsub(); };
  }, [ws, contractType, stake, selectedMarket, duration, durationUnit, barrier, isTrading]);

  // Buy contract
  const handleBuy = () => {
    if (!ws || !proposalId) return;
    setIsTrading(true);
    setTradeResult(null);
    ws.buyContract(proposalId, parseFloat(stake));

    const unsubBuy = ws.on("buy", (data) => {
      if (data.buy) {
        ws.subscribeOpenContract();
      }
      unsubBuy();
    });

    const unsubContract = ws.on("proposal_open_contract", (data) => {
      if (data.proposal_open_contract?.is_sold) {
        const profit = data.proposal_open_contract.profit;
        setTradeResult({ profit, won: profit > 0 });
        setIsTrading(false);
        unsubContract();
      }
    });
  };

  const marketLabel = VOLATILITY_MARKETS.find((m) => m.symbol === selectedMarket)?.label || selectedMarket;
  const needsBarrier = contractType === "DIGITOVER" || contractType === "DIGITUNDER";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main area - Digit Grid & Analysis */}
      <div className="lg:col-span-2 space-y-6">
        {/* Premium banner */}
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="text-xs text-accent font-medium">⭐ Premium Subscription</span>
              <h3 className="text-sm font-semibold text-foreground mt-1">
                {account.is_virtual ? "Demo Account Active" : "Real Account Active"}
              </h3>
            </div>
            <span className={`text-xs px-2 py-1 rounded ${account.is_virtual ? "bg-warning/10 text-warning" : "bg-success/10 text-success"}`}>
              {account.loginid}
            </span>
          </div>
        </div>

        {/* Success Stories */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.2em] text-center">
            Success Stories
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { text: "Digit Edge has completely transformed my trading strategy. The insights are incredibly accurate.", name: "Eric", role: "Trader" },
              { text: "The fast execution mixed with the Digit Edge is a must have if you want an edge in option trading.", name: "Tess", role: "Trader" },
            ].map((story) => (
              <div key={story.name} className="p-5 rounded-xl bg-card border border-border">
                <div className="text-2xl text-muted-foreground mb-3">"</div>
                <p className="text-sm text-muted-foreground leading-relaxed">{story.text}</p>
                <div className="flex items-center gap-3 mt-4">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">{story.name[0]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{story.name}</p>
                    <p className="text-xs text-muted-foreground">{story.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Last Digits Grid */}
        <div className="p-5 rounded-xl bg-card border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-4">Last Digits ({marketLabel})</h3>
          <div className="grid grid-cols-10 gap-1.5">
            {(lastDigits.length > 0 ? lastDigits.slice(-50) : Array(50).fill(null)).map((digit, i) => (
              <div
                key={i}
                className={`w-full aspect-square rounded flex items-center justify-center text-xs font-mono font-bold ${
                  digit === null
                    ? "bg-secondary text-muted-foreground"
                    : digit >= 5
                    ? "bg-buy/20 text-buy"
                    : "bg-sell/20 text-sell"
                }`}
              >
                {digit ?? "-"}
              </div>
            ))}
          </div>

          {/* Digit frequency */}
          <div className="mt-4 grid grid-cols-10 gap-1.5">
            {DIGIT_BARRIERS.map((d) => {
              const count = lastDigits.filter((x) => x === parseInt(d)).length;
              const pct = lastDigits.length > 0 ? (count / lastDigits.length) * 100 : 0;
              return (
                <div key={d} className="text-center">
                  <div className="h-16 bg-secondary rounded-sm relative overflow-hidden">
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-primary/40 rounded-sm transition-all"
                      style={{ height: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground mt-1 block">{d}</span>
                  <span className="text-[10px] text-muted-foreground">{pct.toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Panel - Trading Controls */}
      <div className="space-y-4">
        {/* Market Selection */}
        <div className="p-4 rounded-xl bg-card border border-border space-y-4">
          <div>
            <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              Market <span className="text-primary">●</span>
            </label>
            <select
              value={selectedMarket}
              onChange={(e) => setSelectedMarket(e.target.value)}
              className="mt-1 w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {VOLATILITY_MARKETS.map((m) => (
                <option key={m.symbol} value={m.symbol}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Contract Type */}
          <div>
            <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              Trade Type <span className="text-primary">●</span>
            </label>
            <select
              value={contractType}
              onChange={(e) => setContractType(e.target.value)}
              className="mt-1 w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {CONTRACT_TYPES.map((c) => (
                <option key={c.type} value={c.type}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Stake */}
          <div>
            <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              Stake <span className="text-primary">●</span>
            </label>
            <input
              type="number"
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              min="0.35"
              step="0.01"
              className="mt-1 w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              Duration <span className="text-primary">●</span>
            </label>
            <div className="mt-1 flex gap-2">
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                min="1"
                className="flex-1 px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <select
                value={durationUnit}
                onChange={(e) => setDurationUnit(e.target.value)}
                className="px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="t">Ticks</option>
                <option value="s">Seconds</option>
                <option value="m">Minutes</option>
              </select>
            </div>
          </div>

          {/* Barrier (for Over/Under) */}
          {needsBarrier && (
            <div>
              <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                Last Digit Prediction <span className="text-primary">●</span>
              </label>
              <select
                value={barrier}
                onChange={(e) => setBarrier(e.target.value)}
                className="mt-1 w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {DIGIT_BARRIERS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Quick / Automated tabs */}
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex gap-4 text-sm mb-4">
            <span className="text-muted-foreground cursor-pointer hover:text-foreground">Quick</span>
            <span className="text-foreground font-medium border-b-2 border-primary pb-1">Automated</span>
          </div>

          {/* Software status */}
          <div className="text-center space-y-3">
            <p className="text-xs text-muted-foreground">Software Status</p>
            <p className={`text-lg font-bold ${softwareStatus === "ACTIVE" ? "text-success" : "text-primary"}`}>
              {softwareStatus}
            </p>

            <button
              onClick={handleBuy}
              disabled={isTrading || !proposalId}
              className="w-full py-2.5 bg-gradient-brand text-primary-foreground font-semibold rounded-lg disabled:opacity-50 transition-opacity"
            >
              {isTrading ? "Trading..." : "Start"}
            </button>

            {payout && (
              <p className="text-xs text-muted-foreground">
                Potential payout: <span className="text-success font-medium">{payout.toFixed(2)} USD</span>
              </p>
            )}

            {tradeResult && (
              <div className={`p-3 rounded-lg ${tradeResult.won ? "bg-success/10 text-success" : "bg-sell/10 text-sell"}`}>
                <p className="text-sm font-semibold">
                  {tradeResult.won ? "Won" : "Lost"}: {tradeResult.profit.toFixed(2)} USD
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Current Tick */}
        {currentTick !== null && (
          <div className="p-4 rounded-xl bg-card border border-border text-center">
            <p className="text-xs text-muted-foreground">Current Tick</p>
            <p className="text-2xl font-mono font-bold text-foreground mt-1">{currentTick}</p>
            <p className="text-sm font-mono mt-1">
              Last digit:{" "}
              <span className={`font-bold ${getLastDigit(currentTick) >= 5 ? "text-buy" : "text-sell"}`}>
                {getLastDigit(currentTick)}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TradingPanel;
