import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import DerivWebSocket from "@/services/deriv-websocket";
import { DerivAccount } from "@/services/deriv-auth";
import { VOLATILITY_MARKETS, CONTRACT_TYPES, DIGIT_BARRIERS, getLastDigit } from "@/lib/trading-constants";
import AnalysisTab from "@/components/trading/AnalysisTab";

interface TradingPanelProps {
  ws: DerivWebSocket | null;
  account: DerivAccount;
}

interface SessionStats {
  totalTrades: number;
  wins: number;
  losses: number;
  totalProfit: number;
  peakBalance: number;
  maxDrawdown: number;
  startBalance: number;
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

  // Bot engine state
  const [mode, setMode] = useState<"Quick" | "Automated">("Automated");
  const [softwareStatus, setSoftwareStatus] = useState<"INACTIVE" | "ACTIVE" | "ANALYZING">("INACTIVE");
  const [executionSpeed, setExecutionSpeed] = useState<"Fast" | "Normal">("Fast");
  const [takeProfit, setTakeProfit] = useState("10");
  const [stopLoss, setStopLoss] = useState("5");
  const [martingale, setMartingale] = useState(false);
  const [martingaleMultiplier, setMartingaleMultiplier] = useState("1.5");
  const [maxMartingaleSteps, setMaxMartingaleSteps] = useState(3);
  const [currentMartingaleStep, setCurrentMartingaleStep] = useState(0);

  const [session, setSession] = useState<SessionStats>({
    totalTrades: 0, wins: 0, losses: 0, totalProfit: 0,
    peakBalance: 0, maxDrawdown: 0, startBalance: 0,
  });

  const [activeTab, setActiveTab] = useState<"trading" | "analysis">("trading");
  const prevMarketRef = useRef(selectedMarket);
  const botRunning = useRef(false);
  const consecutiveLosses = useRef(0);
  const currentStake = useRef(parseFloat("0.35"));

  // Subscribe to ticks
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

    return () => { unsub(); };
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

  const executeTrade = useCallback(() => {
    if (!ws || !proposalId || isTrading) return;
    setIsTrading(true);
    setTradeResult(null);
    ws.buyContract(proposalId, parseFloat(stake));

    const unsubBuy = ws.on("buy", (data) => {
      if (data.buy) ws.subscribeOpenContract();
      unsubBuy();
    });

    const unsubContract = ws.on("proposal_open_contract", (data) => {
      if (data.proposal_open_contract?.is_sold) {
        const profit = data.proposal_open_contract.profit;
        const won = profit > 0;
        setTradeResult({ profit, won });
        setIsTrading(false);

        setSession((prev) => {
          const newProfit = prev.totalProfit + profit;
          const newPeak = Math.max(prev.peakBalance, newProfit);
          const dd = newPeak > 0 ? ((newPeak - newProfit) / newPeak) * 100 : 0;
          return {
            ...prev,
            totalTrades: prev.totalTrades + 1,
            wins: prev.wins + (won ? 1 : 0),
            losses: prev.losses + (won ? 0 : 1),
            totalProfit: newProfit,
            peakBalance: newPeak,
            maxDrawdown: Math.max(prev.maxDrawdown, dd),
          };
        });

        if (won) {
          consecutiveLosses.current = 0;
          currentStake.current = parseFloat(stake);
        } else {
          consecutiveLosses.current++;
          if (martingale && consecutiveLosses.current < maxMartingaleSteps) {
            currentStake.current *= parseFloat(martingaleMultiplier);
          }
        }

        // Check TP/SL
        const tp = parseFloat(takeProfit);
        const sl = parseFloat(stopLoss);
        if (session.totalProfit + profit >= tp || session.totalProfit + profit <= -sl) {
          stopBot();
        }

        unsubContract();
      }
    });
  }, [ws, proposalId, stake, isTrading, martingale, martingaleMultiplier, maxMartingaleSteps, session.totalProfit, takeProfit, stopLoss]);

  const startBot = () => {
    if (mode === "Quick") {
      executeTrade();
      return;
    }
    setSoftwareStatus("ACTIVE");
    botRunning.current = true;
    consecutiveLosses.current = 0;
    currentStake.current = parseFloat(stake);
    setSession({ totalTrades: 0, wins: 0, losses: 0, totalProfit: 0, peakBalance: 0, maxDrawdown: 0, startBalance: 0 });
  };

  const stopBot = () => {
    setSoftwareStatus("INACTIVE");
    botRunning.current = false;
  };

  // Auto-trade loop for automated mode
  useEffect(() => {
    if (softwareStatus !== "ACTIVE" || !botRunning.current || isTrading || mode !== "Automated") return;
    const delay = executionSpeed === "Fast" ? 1500 : 4000;
    const timer = setTimeout(() => {
      if (botRunning.current && !isTrading) executeTrade();
    }, delay);
    return () => clearTimeout(timer);
  }, [softwareStatus, isTrading, mode, executionSpeed, executeTrade]);

  const marketLabel = VOLATILITY_MARKETS.find((m) => m.symbol === selectedMarket)?.label || selectedMarket;
  const needsBarrier = contractType === "DIGITOVER" || contractType === "DIGITUNDER";
  const winRate = session.totalTrades > 0 ? ((session.wins / session.totalTrades) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-card rounded-lg border border-border w-fit">
        <button
          onClick={() => setActiveTab("trading")}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === "trading" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          Trading
        </button>
        <button
          onClick={() => setActiveTab("analysis")}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === "analysis" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          Analysis
        </button>
      </div>

      {activeTab === "analysis" ? (
        <AnalysisTab lastDigits={lastDigits} session={session} marketLabel={marketLabel} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account banner */}
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

            {/* Session stats */}
            {session.totalTrades > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Trades", value: session.totalTrades },
                  { label: "Win Rate", value: `${winRate}%` },
                  { label: "Profit", value: `$${session.totalProfit.toFixed(2)}` },
                  { label: "Max DD", value: `${session.maxDrawdown.toFixed(1)}%` },
                ].map((s) => (
                  <div key={s.label} className="p-3 rounded-lg bg-card border border-border text-center">
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="text-sm font-bold text-foreground mt-1">{s.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Success Stories */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.2em] text-center">
                Success Stories
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { text: "Digit Edge has completely transformed my trading strategy. The insights are incredibly accurate and have helped me increase my profits significantly.", name: "Eric", role: "Trader", initials: "JS" },
                  { text: "The fast execution mixed with the Digit Edge is a must have if you want an edge in option trading. Nice job guys", name: "Tess", role: "Trader", initials: "MJ" },
                  { text: "As a Dev who looks up to you guys, you repeatedly motivate me in implementing tech in my trading. Keep doing what you do", name: "Dave", role: "Quant Trader", initials: "DL" },
                ].map((story) => (
                  <div key={story.name} className="p-5 rounded-xl bg-card border border-border">
                    <div className="text-2xl text-muted-foreground mb-3">"</div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{story.text}</p>
                    <div className="flex items-center gap-3 mt-4">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">{story.initials}</span>
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
                      digit === null ? "bg-secondary text-muted-foreground" : digit >= 5 ? "bg-buy/20 text-buy" : "bg-sell/20 text-sell"
                    }`}
                  >
                    {digit ?? "-"}
                  </div>
                ))}
              </div>

              {/* Digit frequency circles */}
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
            <div className="p-4 rounded-xl bg-card border border-border space-y-4">
              <div>
                <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">Market <span className="text-primary">●</span></label>
                <select value={selectedMarket} onChange={(e) => setSelectedMarket(e.target.value)} className="mt-1 w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                  {VOLATILITY_MARKETS.map((m) => (<option key={m.symbol} value={m.symbol}>{m.label}</option>))}
                </select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">Trade Type <span className="text-primary">●</span></label>
                <select value={contractType} onChange={(e) => setContractType(e.target.value)} className="mt-1 w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                  {CONTRACT_TYPES.map((c) => (<option key={c.type} value={c.type}>{c.label}</option>))}
                </select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">Stake <span className="text-primary">●</span></label>
                <input type="number" value={stake} onChange={(e) => setStake(e.target.value)} min="0.35" step="0.01" className="mt-1 w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">Duration <span className="text-primary">●</span></label>
                <div className="mt-1 flex gap-2">
                  <input type="number" value={duration} onChange={(e) => setDuration(parseInt(e.target.value) || 1)} min="1" className="flex-1 px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                  <select value={durationUnit} onChange={(e) => setDurationUnit(e.target.value)} className="px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="t">Ticks</option>
                    <option value="s">Seconds</option>
                    <option value="m">Minutes</option>
                  </select>
                </div>
              </div>

              {needsBarrier && (
                <div>
                  <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">Last Digit Prediction <span className="text-primary">●</span></label>
                  <select value={barrier} onChange={(e) => setBarrier(e.target.value)} className="mt-1 w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                    {DIGIT_BARRIERS.map((d) => (<option key={d} value={d}>{d}</option>))}
                  </select>
                </div>
              )}
            </div>

            {/* Mode & Controls */}
            <div className="p-4 rounded-xl bg-card border border-border space-y-4">
              <div className="flex gap-4 text-sm">
                {(["Quick", "Automated"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`pb-1 font-medium transition-colors ${mode === m ? "text-foreground border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* Software status */}
              <div className="text-center space-y-3">
                <p className="text-xs text-muted-foreground">Software Status</p>
                <p className={`text-lg font-bold ${softwareStatus === "ACTIVE" ? "text-success" : softwareStatus === "ANALYZING" ? "text-warning" : "text-primary"}`}>
                  {softwareStatus}
                </p>

                <button
                  onClick={softwareStatus === "ACTIVE" ? stopBot : startBot}
                  disabled={isTrading && mode === "Quick"}
                  className="w-full py-2.5 bg-gradient-brand text-primary-foreground font-semibold rounded-lg disabled:opacity-50 transition-opacity"
                >
                  {softwareStatus === "ACTIVE" ? "Stop" : isTrading ? "Trading..." : "Start"}
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

            {/* Contract type selector */}
            <div className="p-4 rounded-xl bg-card border border-border space-y-3">
              <div>
                <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">Contract Type <span className="text-primary">●</span></label>
                <select value={contractType} onChange={(e) => setContractType(e.target.value)} className="mt-1 w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                  {CONTRACT_TYPES.map((c) => (<option key={c.type} value={c.type}>{c.label} - {c.description}</option>))}
                </select>
              </div>

              <div>
                <label className="text-xs text-muted-foreground font-medium flex items-center gap-1">Execution Speed <span className="text-primary">●</span></label>
                <select value={executionSpeed} onChange={(e) => setExecutionSpeed(e.target.value as "Fast" | "Normal")} className="mt-1 w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="Fast">Fast</option>
                  <option value="Normal">Normal</option>
                </select>
              </div>
            </div>

            {/* Risk Management */}
            <div className="p-4 rounded-xl bg-card border border-border space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-foreground">🛡 Risk Management Settings</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">Take Profit ($)</label>
                  <input type="number" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} className="mt-1 w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Stop Loss ($)</label>
                  <input type="number" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} className="mt-1 w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground">Martingale</label>
                <button
                  onClick={() => setMartingale(!martingale)}
                  className={`w-10 h-5 rounded-full transition-colors ${martingale ? "bg-primary" : "bg-secondary"}`}
                >
                  <div className={`w-4 h-4 bg-foreground rounded-full transition-transform ${martingale ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>

              {martingale && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Multiplier</label>
                    <input type="number" value={martingaleMultiplier} onChange={(e) => setMartingaleMultiplier(e.target.value)} step="0.1" className="mt-1 w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Max Steps</label>
                    <input type="number" value={maxMartingaleSteps} onChange={(e) => setMaxMartingaleSteps(parseInt(e.target.value) || 3)} className="mt-1 w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                  </div>
                </div>
              )}
            </div>

            {/* Current Tick */}
            {currentTick !== null && (
              <div className="p-4 rounded-xl bg-card border border-border text-center">
                <p className="text-xs text-muted-foreground">Current Tick</p>
                <p className="text-2xl font-mono font-bold text-foreground mt-1">{currentTick}</p>
                <p className="text-sm font-mono mt-1">
                  Last digit: <span className={`font-bold ${getLastDigit(currentTick) >= 5 ? "text-buy" : "text-sell"}`}>{getLastDigit(currentTick)}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TradingPanel;
