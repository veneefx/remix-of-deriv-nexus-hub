import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Wallet, List, Table, ChevronRight, Settings, TrendingUp, BarChart3, Shield, Zap } from "lucide-react";
import DerivWebSocket from "@/services/deriv-websocket";
import { DerivAccount } from "@/services/deriv-auth";
import { VOLATILITY_MARKETS, CONTRACT_TYPES, DIGIT_BARRIERS, getLastDigit } from "@/lib/trading-constants";
import AnalysisTab from "@/components/trading/AnalysisTab";

interface TradingPanelProps {
  ws: DerivWebSocket | null;
  account: DerivAccount | null;
}

interface SessionStats {
  totalTrades: number;
  wins: number;
  losses: number;
  totalProfit: number;
  peakBalance: number;
  maxDrawdown: number;
  startBalance: number;
  largestStake: number;
  maxLossStreak: number;
}

interface Transaction {
  id: string;
  contractType: string;
  stake: number;
  profit: number;
  won: boolean;
  description: string;
}

const TradingPanel = ({ ws, account }: TradingPanelProps) => {
  const [selectedMarket, setSelectedMarket] = useState<string>(VOLATILITY_MARKETS[0].symbol);
  const [contractType, setContractType] = useState("DIGITEVEN");
  const [stake, setStake] = useState("3");
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
  const [softwareStatus, setSoftwareStatus] = useState<"INACTIVE" | "ACTIVE">("INACTIVE");
  const [executionSpeed, setExecutionSpeed] = useState<"Fast" | "Normal">("Fast");
  const [takeProfit, setTakeProfit] = useState("1000");
  const [stopLoss, setStopLoss] = useState("100");
  const [martingale, setMartingale] = useState(true);
  const [martingaleMultiplier, setMartingaleMultiplier] = useState("2.2");
  const [maxMartingaleSteps, setMaxMartingaleSteps] = useState(10);
  const [stopAfterMaxMartingale, setStopAfterMaxMartingale] = useState(true);
  const [startMartingaleAfter, setStartMartingaleAfter] = useState(1);
  const [tradeDiffers, setTradeDiffers] = useState(false);

  const [session, setSession] = useState<SessionStats>({
    totalTrades: 0, wins: 0, losses: 0, totalProfit: 0,
    peakBalance: 0, maxDrawdown: 0, startBalance: 0, largestStake: 0, maxLossStreak: 0,
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showTransactions, setShowTransactions] = useState(false);
  const [txViewMode, setTxViewMode] = useState<"list" | "table">("list");
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showTpModal, setShowTpModal] = useState(false);
  const [tpAmount, setTpAmount] = useState(0);

  const [activeTab, setActiveTab] = useState<"trading" | "analysis">("trading");
  const prevMarketRef = useRef(selectedMarket);
  const botRunning = useRef(false);
  const consecutiveLosses = useRef(0);
  const currentStake = useRef(parseFloat("3"));

  const isLoggedIn = !!account;

  // Subscribe to ticks - works even without login for live data
  useEffect(() => {
    if (!ws) return;
    if (prevMarketRef.current !== selectedMarket) ws.unsubscribeTicks(prevMarketRef.current);
    prevMarketRef.current = selectedMarket;
    ws.subscribeTicks(selectedMarket);

    const unsub = ws.on("tick", (data) => {
      if (data.tick) {
        const quote = data.tick.quote;
        setCurrentTick(quote);
        setLastDigits((prev) => [...prev.slice(-99), getLastDigit(quote)]);
      }
    });
    return () => { unsub(); };
  }, [ws, selectedMarket]);

  // Get proposal - only when logged in
  useEffect(() => {
    if (!ws || !isLoggedIn || isTrading) return;
    const needsBarrier = contractType === "DIGITOVER" || contractType === "DIGITUNDER";
    ws.getProposal({
      amount: parseFloat(stake) || 3,
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
  }, [ws, contractType, stake, selectedMarket, duration, durationUnit, barrier, isTrading, isLoggedIn]);

  const marketLabel = VOLATILITY_MARKETS.find((m) => m.symbol === selectedMarket)?.label || selectedMarket;
  const needsBarrier = contractType === "DIGITOVER" || contractType === "DIGITUNDER";
  const winRate = session.totalTrades > 0 ? ((session.wins / session.totalTrades) * 100).toFixed(1) : "0.0";

  const executeTrade = useCallback(() => {
    if (!ws || !proposalId || isTrading || !isLoggedIn) return;
    setIsTrading(true);
    setTradeResult(null);
    const tradeStake = currentStake.current;
    ws.buyContract(proposalId, tradeStake);

    const unsubBuy = ws.on("buy", (data) => {
      if (data.buy) ws.subscribeOpenContract();
      unsubBuy();
    });

    const unsubContract = ws.on("proposal_open_contract", (data) => {
      if (data.proposal_open_contract?.is_sold) {
        const profit = data.proposal_open_contract.profit;
        const won = profit > 0;
        const contractId = data.proposal_open_contract.contract_id;
        setTradeResult({ profit, won });
        setIsTrading(false);

        setTransactions((prev) => [{
          id: contractId || Date.now().toString(),
          contractType,
          stake: tradeStake,
          profit,
          won,
          description: `Win if ${marketLabel} is ${contractType.replace("DIGIT", "").toLowerCase()} after ${duration} ticks.`,
        }, ...prev]);

        setSession((prev) => {
          const newProfit = prev.totalProfit + profit;
          const newPeak = Math.max(prev.peakBalance, newProfit);
          const dd = newPeak > 0 ? ((newPeak - newProfit) / newPeak) * 100 : 0;
          const newLossStreak = won ? 0 : consecutiveLosses.current + 1;
          return {
            ...prev,
            totalTrades: prev.totalTrades + 1,
            wins: prev.wins + (won ? 1 : 0),
            losses: prev.losses + (won ? 0 : 1),
            totalProfit: newProfit,
            peakBalance: newPeak,
            maxDrawdown: Math.max(prev.maxDrawdown, dd),
            largestStake: Math.max(prev.largestStake, tradeStake),
            maxLossStreak: Math.max(prev.maxLossStreak, newLossStreak),
          };
        });

        if (won) {
          consecutiveLosses.current = 0;
          currentStake.current = parseFloat(stake);
        } else {
          consecutiveLosses.current++;
          if (martingale && consecutiveLosses.current >= startMartingaleAfter && consecutiveLosses.current < maxMartingaleSteps) {
            currentStake.current *= parseFloat(martingaleMultiplier);
          } else if (martingale && consecutiveLosses.current >= maxMartingaleSteps) {
            if (stopAfterMaxMartingale) {
              stopBot();
            } else {
              currentStake.current = parseFloat(stake);
              consecutiveLosses.current = 0;
            }
          }
        }

        const tp = parseFloat(takeProfit);
        const sl = parseFloat(stopLoss);
        const totalP = session.totalProfit + profit;
        if (totalP >= tp) {
          setTpAmount(totalP);
          setShowTpModal(true);
          stopBot();
        } else if (totalP <= -sl) {
          stopBot();
        }

        unsubContract();
      }
    });
  }, [ws, proposalId, stake, isTrading, isLoggedIn, martingale, martingaleMultiplier, maxMartingaleSteps, session.totalProfit, takeProfit, stopLoss, contractType, marketLabel, duration, startMartingaleAfter, stopAfterMaxMartingale]);

  const startBot = () => {
    if (!isLoggedIn) return;
    if (mode === "Quick") {
      executeTrade();
      return;
    }
    setShowSessionModal(true);
  };

  const startNewSession = () => {
    setShowSessionModal(false);
    setShowConfirmModal(true);
  };

  const resumeSession = () => {
    setShowSessionModal(false);
    setSoftwareStatus("ACTIVE");
    botRunning.current = true;
  };

  const confirmStart = () => {
    setShowConfirmModal(false);
    setSoftwareStatus("ACTIVE");
    botRunning.current = true;
    consecutiveLosses.current = 0;
    currentStake.current = parseFloat(stake);
    setSession({ totalTrades: 0, wins: 0, losses: 0, totalProfit: 0, peakBalance: 0, maxDrawdown: 0, startBalance: 0, largestStake: 0, maxLossStreak: 0 });
    setTransactions([]);
  };

  const stopBot = () => {
    setSoftwareStatus("INACTIVE");
    botRunning.current = false;
  };

  // Auto-trade loop
  useEffect(() => {
    if (softwareStatus !== "ACTIVE" || !botRunning.current || isTrading || mode !== "Automated") return;
    const delay = executionSpeed === "Fast" ? 1500 : 4000;
    const timer = setTimeout(() => {
      if (botRunning.current && !isTrading) executeTrade();
    }, delay);
    return () => clearTimeout(timer);
  }, [softwareStatus, isTrading, mode, executionSpeed, executeTrade]);

  const clearTransactions = () => setTransactions([]);

  return (
    <div className="flex h-full">
      {/* Left area - main content (70%) */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-5">
        {/* Tab selector */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex gap-1 p-1 bg-card rounded-lg border border-border">
            {(["trading", "analysis"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${activeTab === tab ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {tab === "trading" ? "Digit Edge" : "Analysis"}
              </button>
            ))}
          </div>
          {currentTick !== null && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-[10px] text-muted-foreground">{marketLabel}</span>
              <span className="text-sm font-mono font-bold text-foreground">{currentTick.toFixed(4)}</span>
            </div>
          )}
        </div>

        {activeTab === "analysis" ? (
          <AnalysisTab lastDigits={lastDigits} session={session} marketLabel={marketLabel} />
        ) : (
          <div className="space-y-4">
            {showTransactions ? (
              <TransactionView
                transactions={transactions}
                session={session}
                winRate={winRate}
                txViewMode={txViewMode}
                setTxViewMode={setTxViewMode}
                clearTransactions={clearTransactions}
                onClose={() => setShowTransactions(false)}
              />
            ) : (
              <>
                {/* Live market info banner */}
                <div className="p-4 rounded-xl bg-card border border-border">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-foreground">{marketLabel}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${isLoggedIn ? (account!.is_virtual ? "bg-warning/10 text-warning" : "bg-success/10 text-success") : "bg-muted text-muted-foreground"}`}>
                      {isLoggedIn ? account!.loginid : "Not Connected"}
                    </span>
                  </div>
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Current Price</p>
                      <p className="text-2xl font-mono font-bold text-foreground">{currentTick?.toFixed(4) || "Loading..."}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Last Digit</p>
                      <p className="text-2xl font-mono font-bold text-primary">{lastDigits.length > 0 ? lastDigits[lastDigits.length - 1] : "-"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Ticks Collected</p>
                      <p className="text-lg font-mono font-bold text-foreground">{lastDigits.length}</p>
                    </div>
                  </div>
                </div>

                {/* Sign in prompt (only if not logged in) */}
                {!isLoggedIn && (
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Shield className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-foreground">Connect to Execute Trades</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Live data is streaming. Connect your Deriv account to place trades and access the automated bot engine.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Last Digits Grid - always visible */}
                <div className="p-5 rounded-xl bg-card border border-border">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Last 50 Digits ({marketLabel})</h3>
                  <div className="grid grid-cols-10 gap-1">
                    {(lastDigits.length > 0 ? lastDigits.slice(-50) : Array(50).fill(null)).map((digit, i) => (
                      <div
                        key={i}
                        className={`w-full aspect-square rounded flex items-center justify-center text-[10px] font-mono font-bold ${
                          digit === null ? "bg-secondary text-muted-foreground" : digit >= 5 ? "bg-buy/20 text-buy" : "bg-sell/20 text-sell"
                        }`}
                      >
                        {digit ?? "-"}
                      </div>
                    ))}
                  </div>

                  {/* Digit frequency bars */}
                  <div className="mt-3 grid grid-cols-10 gap-1">
                    {DIGIT_BARRIERS.map((d) => {
                      const count = lastDigits.filter((x) => x === parseInt(d)).length;
                      const pct = lastDigits.length > 0 ? (count / lastDigits.length) * 100 : 0;
                      return (
                        <div key={d} className="text-center">
                          <div className="h-12 bg-secondary rounded-sm relative overflow-hidden">
                            <div className="absolute bottom-0 left-0 right-0 bg-primary/40 rounded-sm transition-all" style={{ height: `${pct}%` }} />
                          </div>
                          <span className="text-[10px] text-muted-foreground block mt-0.5">{d}</span>
                          <span className="text-[8px] text-muted-foreground">{pct.toFixed(0)}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Session stats (when trading) */}
                {session.totalTrades > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Win Rate", value: `${winRate}%`, color: "text-buy" },
                      { label: "Total P/L", value: `${session.totalProfit >= 0 ? "+" : ""}${session.totalProfit.toFixed(2)}`, color: session.totalProfit >= 0 ? "text-buy" : "text-sell" },
                      { label: "Trades", value: session.totalTrades.toString(), color: "text-foreground" },
                      { label: "Max DD", value: `${session.maxDrawdown.toFixed(1)}%`, color: "text-sell" },
                    ].map((s) => (
                      <div key={s.label} className="p-3 rounded-lg bg-card border border-border text-center">
                        <p className="text-[10px] text-muted-foreground">{s.label}</p>
                        <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Features preview for non-logged-in users */}
                {!isLoggedIn && (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { icon: BarChart3, title: "Advanced Analytics", desc: "Detailed digit analysis and pattern recognition" },
                      { icon: TrendingUp, title: "AI-Powered Bot", desc: "Automated trading with martingale recovery" },
                      { icon: Zap, title: "Real-Time Updates", desc: "Live tick data and instant execution" },
                      { icon: Shield, title: "Risk Management", desc: "Stop loss, take profit, and stake control" },
                    ].map((item) => (
                      <div key={item.title} className="p-4 rounded-xl bg-card border border-border">
                        <item.icon className="w-5 h-5 text-primary mb-2" />
                        <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Right Panel - Trading Controls (30% sticky sidebar) - desktop only */}
      <div className="hidden lg:block w-[320px] border-l border-border bg-card/50 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Market */}
          <div>
            <label className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">Market <span className="text-primary text-xs">●</span></label>
            <select value={selectedMarket} onChange={(e) => setSelectedMarket(e.target.value)} className="mt-1 w-full px-3 py-2 bg-secondary border border-border rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
              {VOLATILITY_MARKETS.map((m) => (<option key={m.symbol} value={m.symbol}>{m.label}</option>))}
            </select>
          </div>

          {/* Trade Type */}
          <div>
            <label className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">Trade Type <span className="text-primary text-xs">●</span></label>
            <select value={contractType} onChange={(e) => setContractType(e.target.value)} className="mt-1 w-full px-3 py-2 bg-secondary border border-border rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
              {CONTRACT_TYPES.map((c) => (<option key={c.type} value={c.type}>{c.label} - {c.description}</option>))}
            </select>
          </div>

          {needsBarrier && (
            <div>
              <label className="text-[10px] text-muted-foreground font-medium">Last Digit Prediction</label>
              <select value={barrier} onChange={(e) => setBarrier(e.target.value)} className="mt-1 w-full px-3 py-2 bg-secondary border border-border rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                {DIGIT_BARRIERS.map((d) => (<option key={d} value={d}>{d}</option>))}
              </select>
            </div>
          )}

          {/* Stake */}
          <div>
            <label className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">Stake <span className="text-primary text-xs">●</span></label>
            <input type="number" value={stake} onChange={(e) => setStake(e.target.value)} min="0.35" step="0.01" className="mt-1 w-full px-3 py-2 bg-secondary border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>

          {/* Duration */}
          <div>
            <label className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">Duration <span className="text-primary text-xs">●</span></label>
            <div className="mt-1 flex gap-2">
              <input type="number" value={duration} onChange={(e) => setDuration(parseInt(e.target.value) || 1)} min="1" className="flex-1 px-3 py-2 bg-secondary border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              <select value={durationUnit} onChange={(e) => setDurationUnit(e.target.value)} className="px-2 py-2 bg-secondary border border-border rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="t">Ticks</option>
                <option value="s">Seconds</option>
                <option value="m">Minutes</option>
              </select>
            </div>
          </div>

          {/* Quick / Automated tabs */}
          <div className="flex items-center justify-center border-b border-border">
            {(["Quick", "Automated"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 pb-2 text-sm font-medium transition-colors ${mode === m ? "text-foreground border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                {m}
              </button>
            ))}
          </div>

          {mode === "Quick" ? (
            <div className="space-y-3">
              <p className="text-xs text-center text-muted-foreground font-medium">Purchase</p>
              <button
                onClick={executeTrade}
                disabled={isTrading || !proposalId || !isLoggedIn}
                className="w-full py-3 bg-buy text-primary-foreground font-bold text-sm rounded-lg disabled:opacity-50 transition-all hover:opacity-90"
              >
                {isLoggedIn ? contractType.replace("DIGIT", "") : "Connect to Trade"}
              </button>
              {payout && (
                <div className="text-center text-xs text-muted-foreground">
                  <p>Payout: <span className="text-foreground font-medium">{payout.toFixed(2)} USD</span></p>
                  <p>Net Profit: <span className="text-buy font-medium">{(payout - parseFloat(stake)).toFixed(2)} USD</span></p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground">Software Status</p>
                <p className={`text-xl font-bold ${softwareStatus === "ACTIVE" ? "text-success" : "text-primary"}`}>
                  {softwareStatus}
                </p>
              </div>

              <button
                onClick={softwareStatus === "ACTIVE" ? stopBot : startBot}
                disabled={isTrading || !isLoggedIn}
                className={`w-full py-2.5 font-semibold text-sm rounded-lg border-2 transition-all disabled:opacity-50 ${
                  softwareStatus === "ACTIVE"
                    ? "border-sell text-sell hover:bg-sell/10"
                    : "border-buy text-buy hover:bg-buy/10"
                }`}
              >
                {!isLoggedIn ? "Connect to Start" : softwareStatus === "ACTIVE" ? "Stop" : "Start"}
              </button>

              <div>
                <label className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">Contract Type <span className="text-primary text-xs">●</span></label>
                <select value={contractType} onChange={(e) => setContractType(e.target.value)} className="mt-1 w-full px-3 py-2 bg-secondary border border-border rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                  {CONTRACT_TYPES.map((c) => (<option key={c.type} value={c.type}>{c.type}</option>))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">Execution Speed <span className="text-primary text-xs">●</span></label>
                <select value={executionSpeed} onChange={(e) => setExecutionSpeed(e.target.value as any)} className="mt-1 w-full px-3 py-2 bg-secondary border border-border rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="Fast">Fast</option>
                  <option value="Normal">Normal</option>
                </select>
              </div>
            </div>
          )}

          {/* Risk Management Settings button */}
          <button
            onClick={() => setShowRiskModal(true)}
            className="w-full flex items-center justify-between px-3 py-2.5 bg-secondary border border-border rounded-lg text-xs text-foreground hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-primary" />
              <span>Risk Management Settings</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* Last trade result */}
          {tradeResult && (
            <div className={`p-3 rounded-lg text-center ${tradeResult.won ? "bg-success/10 text-success" : "bg-sell/10 text-sell"}`}>
              <p className="text-xs font-semibold">
                {tradeResult.won ? "Won" : "Lost"}: {tradeResult.profit.toFixed(2)} USD
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Floating transaction + profit icons */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-30">
        <button
          onClick={() => setShowTransactions(!showTransactions)}
          className="w-12 h-12 rounded-full bg-card border border-border shadow-lg flex items-center justify-center hover:bg-secondary transition-colors"
          title="Transactions"
        >
          <Wallet className="w-5 h-5 text-primary" />
        </button>
        <div className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-lg ${session.totalProfit >= 0 ? "bg-buy text-primary-foreground" : "bg-sell text-primary-foreground"}`}>
          {session.totalProfit.toFixed(2)}
        </div>
      </div>

      {/* Risk Management Modal */}
      <AnimatePresence>
        {showRiskModal && (
          <ModalOverlay onClose={() => setShowRiskModal(false)}>
            <div className="bg-background border border-border rounded-xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">Risk Management Settings</h3>
                <button onClick={() => setShowRiskModal(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>
              <div className="p-4 space-y-4">
                <FormField label="Trade Differs" hint="Choose whether to trade differs first and switch to your chosen contract type when a loss is incurred.">
                  <select value={tradeDiffers ? "Yes" : "No"} onChange={(e) => setTradeDiffers(e.target.value === "Yes")} className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm text-foreground">
                    <option>No</option><option>Yes</option>
                  </select>
                </FormField>
                <FormField label="Take Profit" hint="This is the minimum profit limit you want achieved.">
                  <input type="number" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm text-foreground" />
                </FormField>
                <FormField label="Stop Loss" hint="This is the maximum loss limit you want incurred.">
                  <input type="number" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm text-foreground" />
                </FormField>
                <FormField label="Trading Method" hint="Choose whether to use a stakelist or martingale.">
                  <select value={martingale ? "Martingale" : "Flat"} onChange={(e) => setMartingale(e.target.value === "Martingale")} className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm text-foreground">
                    <option>Flat</option><option>Martingale</option>
                  </select>
                </FormField>
                {martingale && (
                  <>
                    <FormField label="Martingale Multiplier" hint="This is the multiplier used on the stake in case a loss is incurred.">
                      <input type="number" value={martingaleMultiplier} onChange={(e) => setMartingaleMultiplier(e.target.value)} step="0.1" className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm text-foreground" />
                    </FormField>
                    <FormField label="Max Martingale Level" hint="Max number of times Martingale is used on concurrent losses.">
                      <input type="number" value={maxMartingaleSteps} onChange={(e) => setMaxMartingaleSteps(parseInt(e.target.value) || 3)} className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm text-foreground" />
                    </FormField>
                    <FormField label="Stop After Max Martingale Level" hint="Stop software after max level or reset and continue.">
                      <select value={stopAfterMaxMartingale ? "Yes" : "No"} onChange={(e) => setStopAfterMaxMartingale(e.target.value === "Yes")} className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm text-foreground">
                        <option>Yes</option><option>No</option>
                      </select>
                    </FormField>
                    <FormField label="Start Martingale After" hint="Number of losses before martingale kicks in.">
                      <input type="number" value={startMartingaleAfter} onChange={(e) => setStartMartingaleAfter(parseInt(e.target.value) || 1)} className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm text-foreground" />
                    </FormField>
                  </>
                )}
              </div>
              <div className="p-4 border-t border-border">
                <button onClick={() => setShowRiskModal(false)} className="w-full py-2 text-xs text-muted-foreground hover:text-foreground transition-colors">Close</button>
              </div>
            </div>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* Session Modal */}
      <AnimatePresence>
        {showSessionModal && (
          <ModalOverlay onClose={() => setShowSessionModal(false)}>
            <div className="bg-background border border-border rounded-xl w-full max-w-md">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">Before you start</h3>
                <button onClick={() => setShowSessionModal(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>
              <div className="p-6 space-y-3">
                <p className="text-xs text-muted-foreground text-center">
                  Select whether to continue from the last session or start fresh.
                </p>
                <button onClick={resumeSession} className="w-full flex items-center justify-between p-4 rounded-xl border border-border hover:bg-secondary transition-colors">
                  <div className="flex items-center gap-3">
                    <List className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Resume From Last Session</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
                <button onClick={startNewSession} className="w-full flex items-center justify-between p-4 rounded-xl border border-border hover:bg-secondary transition-colors">
                  <div className="flex items-center gap-3">
                    <Table className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Start New Session</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* Confirm Start Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <ModalOverlay onClose={() => setShowConfirmModal(false)}>
            <div className="bg-background border border-border rounded-xl w-full max-w-md">
              <div className="p-6 space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Are you sure you want to start?</h3>
                <p className="text-xs text-primary">
                  Please ensure your settings are correct before starting. Below are your key settings:
                </p>
                <table className="w-full text-xs">
                  <tbody className="divide-y divide-border">
                    {[
                      ["Starting Stake:", `${parseFloat(stake).toFixed(2)}`],
                      ["Martingale:", martingaleMultiplier],
                      ["Take Profit:", takeProfit],
                      ["Stop Loss:", stopLoss],
                      ["Market:", marketLabel],
                    ].map(([k, v]) => (
                      <tr key={k}>
                        <td className="py-2 text-muted-foreground font-medium">{k}</td>
                        <td className="py-2 text-foreground text-right">{v}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex items-center gap-3 pt-2">
                  <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-2 border border-border rounded-lg text-xs text-muted-foreground hover:bg-secondary">No</button>
                  <button onClick={confirmStart} className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:opacity-90">Yes</button>
                  <button onClick={() => { setShowConfirmModal(false); setShowRiskModal(true); }} className="text-xs text-primary hover:underline">Edit</button>
                </div>
              </div>
            </div>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* Take Profit Hit Modal */}
      <AnimatePresence>
        {showTpModal && (
          <ModalOverlay onClose={() => setShowTpModal(false)}>
            <div className="bg-background border border-border rounded-xl w-full max-w-md p-6 text-center space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Take Profit Hit!</h3>
              <div className="text-4xl">🎉💰</div>
              <p className="text-sm text-muted-foreground">
                Congratulations! You hit your <strong className="text-foreground">Take Profit</strong> for <strong className="text-foreground">{marketLabel}</strong>.
              </p>
              <p className="text-sm text-foreground">
                Amount: <span className="text-buy font-bold">${tpAmount.toFixed(2)}</span>
              </p>
              <button onClick={() => setShowTpModal(false)} className="px-6 py-2 border border-border rounded-lg text-xs text-muted-foreground hover:bg-secondary">Close</button>
            </div>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </div>
  );
};

/* -- Helper Components -- */

const ModalOverlay = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/70 backdrop-blur-sm"
    onClick={onClose}
  >
    <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={(e) => e.stopPropagation()}>
      {children}
    </motion.div>
  </motion.div>
);

const FormField = ({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) => (
  <div>
    <label className="text-sm font-medium text-foreground">{label}</label>
    {children}
    <p className="text-[10px] text-muted-foreground mt-1">{hint}</p>
  </div>
);

const TransactionView = ({
  transactions, session, winRate, txViewMode, setTxViewMode, clearTransactions, onClose,
}: {
  transactions: Transaction[];
  session: SessionStats;
  winRate: string;
  txViewMode: "list" | "table";
  setTxViewMode: (m: "list" | "table") => void;
  clearTransactions: () => void;
  onClose: () => void;
}) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <button onClick={onClose} className="text-xs text-primary hover:underline">← Back to Digit Edge</button>
      <button onClick={clearTransactions} className="px-3 py-1 text-xs border border-border rounded hover:bg-secondary transition-colors">Clear</button>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
      {[
        { label: "Total P/L", value: session.totalProfit.toFixed(2), color: session.totalProfit >= 0 ? "text-buy" : "text-sell" },
        { label: "Trades", value: session.totalTrades.toString(), color: "text-foreground" },
        { label: "Won", value: session.wins.toString(), color: "text-buy" },
        { label: "Lost", value: session.losses.toString(), color: "text-sell" },
        { label: "Max Stake", value: session.largestStake.toFixed(2), color: "text-warning" },
        { label: "Loss Streak", value: `-${session.maxLossStreak}`, color: "text-sell" },
      ].map((s) => (
        <div key={s.label} className="text-center">
          <p className="text-[10px] text-muted-foreground font-medium">{s.label}</p>
          <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
        </div>
      ))}
    </div>

    <div className="flex border-b border-border">
      {(["list", "table"] as const).map((v) => (
        <button
          key={v}
          onClick={() => setTxViewMode(v)}
          className={`flex-1 py-2 text-xs font-medium capitalize transition-colors ${txViewMode === v ? "text-foreground border-b-2 border-primary" : "text-muted-foreground"}`}
        >
          {v} View
        </button>
      ))}
    </div>

    {txViewMode === "table" ? (
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              {["Contract", "Stake", "P/L", "Status"].map((h) => (
                <th key={h} className="py-2 px-3 text-left text-muted-foreground font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} className="border-b border-border/50">
                <td className="py-2 px-3 text-foreground">{tx.contractType}</td>
                <td className="py-2 px-3 text-foreground">{tx.stake.toFixed(2)}</td>
                <td className={`py-2 px-3 ${tx.won ? "text-buy" : "text-sell"}`}>{tx.won ? "+" : ""}{tx.profit.toFixed(2)}</td>
                <td className="py-2 px-3"><span className={`px-2 py-0.5 rounded text-[10px] ${tx.won ? "bg-buy/20 text-buy" : "bg-sell/20 text-sell"}`}>{tx.won ? "Won" : "Lost"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <div className="space-y-3 max-h-[50vh] overflow-y-auto">
        {transactions.map((tx) => (
          <div key={tx.id} className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${tx.won ? "bg-buy/20" : "bg-sell/20"}`}>
              <span className={`text-sm ${tx.won ? "text-buy" : "text-sell"}`}>{tx.won ? "↗" : "↘"}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground">{tx.contractType} • {tx.id}</p>
              <p className="text-[10px] text-muted-foreground">{tx.description}</p>
              <div className="flex gap-4 mt-1">
                <span className="text-[10px] text-muted-foreground">Stake: {tx.stake.toFixed(2)}</span>
                <span className={`text-[10px] ${tx.won ? "text-buy" : "text-sell"}`}>
                  {tx.won ? "+" : ""}{tx.profit.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        ))}
        {transactions.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">No transactions yet</p>
        )}
      </div>
    )}
  </div>
);

export default TradingPanel;
