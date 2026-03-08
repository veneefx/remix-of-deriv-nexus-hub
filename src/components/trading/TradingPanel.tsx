import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Wallet, List, Table, ChevronRight, Settings, TrendingUp, BarChart3, Shield, Zap, Activity, Flame, Target, AlertTriangle, Lock } from "lucide-react";
import DerivWebSocket from "@/services/deriv-websocket";
import { DerivAccount } from "@/services/deriv-auth";
import { VOLATILITY_MARKETS, CONTRACT_TYPES, DIGIT_BARRIERS, getLastDigit } from "@/lib/trading-constants";
import { tradingEngine } from "@/services/trading-engine";
import AnalysisTab from "@/components/trading/AnalysisTab";
import RiskPanel from "@/components/trading/RiskPanel";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { usePremium } from "@/hooks/use-premium";
import PremiumUpgradeModal from "@/components/trading/PremiumUpgradeModal";

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

interface StrategyProfile {
  digit_frequency_threshold: number;
  momentum_weight: number;
  confluence_required: boolean;
  max_open_trades: number;
  minimum_tick_history: number;
}

interface DigitPressure {
  [digit: number]: number;
}

interface SignalDetails {
  frequencyScore: number;
  pressureScore: number;
  streakScore: number;
  patternScore: number;
  volatilityScore: number;
}

const TradingPanel = ({ ws, account }: TradingPanelProps) => {
  const [selectedMarket, setSelectedMarket] = useState<string>(() => localStorage.getItem("dnx_market") || VOLATILITY_MARKETS[0].symbol);
  const [contractType, setContractType] = useState(() => localStorage.getItem("dnx_contractType") || "DIGITEVEN");
  const [stake, setStake] = useState(() => localStorage.getItem("dnx_stake") || "3");
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
  const [aggressiveMode, setAggressiveMode] = useState(false);
  const [takeProfit, setTakeProfit] = useState("1000");
  const [stopLoss, setStopLoss] = useState("100");
  const [martingale, setMartingale] = useState(true);
  const [martingaleMultiplier, setMartingaleMultiplier] = useState("2.2");
  const [maxMartingaleSteps, setMaxMartingaleSteps] = useState(10);
  const [stopAfterMaxMartingale, setStopAfterMaxMartingale] = useState(true);
  const [startMartingaleAfter, setStartMartingaleAfter] = useState(1);
  const [tradeDiffers, setTradeDiffers] = useState(false);
  const [smartRisker, setSmartRisker] = useState(false);
  const [freqBasedTrading, setFreqBasedTrading] = useState(false);
  const [freqThreshold, setFreqThreshold] = useState(12);
  const [strategyProfile, setStrategyProfile] = useState<"aggressive" | "balanced" | "conservative">(() => (localStorage.getItem("dnx_profile") as any) || "balanced");
  const [strategyVersion, setStrategyVersion] = useState<number | null>(null);

  // Signal scoring
  const [signalScore, setSignalScore] = useState(0);
  const [signalDetails, setSignalDetails] = useState<SignalDetails>({ frequencyScore: 0, pressureScore: 0, streakScore: 0, patternScore: 0, volatilityScore: 0 });
  const [digitPressure, setDigitPressure] = useState<DigitPressure>({ 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 });
  const [highestPressureDigit, setHighestPressureDigit] = useState(0);

  const [session, setSession] = useState<SessionStats>({
    totalTrades: 0, wins: 0, losses: 0, totalProfit: 0,
    peakBalance: 0, maxDrawdown: 0, startBalance: 0, largestStake: 0, maxLossStreak: 0,
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showTransactions, setShowTransactions] = useState(false);
  const [txViewMode, setTxViewMode] = useState<"list" | "table">("list");
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [showRiskPanel, setShowRiskPanel] = useState(false);
  const { isPremium, isAdmin } = usePremium();
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [premiumFeature, setPremiumFeature] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showTpModal, setShowTpModal] = useState(false);
  const [tpAmount, setTpAmount] = useState(0);

  const [activeTab, setActiveTab] = useState<"trading" | "analysis">("trading");
  const prevMarketRef = useRef(selectedMarket);
  const botRunning = useRef(false);
  const consecutiveLosses = useRef(0);
  const currentStake = useRef(parseFloat(stake));
  const partialProfitTaken = useRef(0);
  const openContracts = useRef(0);
  const proposalIdRef = useRef<string | null>(null);
  const isTradingRef = useRef(false);
  const sessionProfitRef = useRef(0);
  const lastDigitsRef = useRef<number[]>([]);
  const tickBufferRef = useRef<{ quote: number; digit: number; epoch: number }[]>([]);
  const digitPressureRef = useRef<DigitPressure>({ 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 });
  const tickIndexRef = useRef(0);
  const lastTradeTimestampRef = useRef(0);

  const isLoggedIn = !!account;

  // Persist settings
  useEffect(() => { localStorage.setItem("dnx_market", selectedMarket); }, [selectedMarket]);
  useEffect(() => { localStorage.setItem("dnx_contractType", contractType); }, [contractType]);
  useEffect(() => { localStorage.setItem("dnx_stake", stake); }, [stake]);
  useEffect(() => { localStorage.setItem("dnx_profile", strategyProfile); }, [strategyProfile]);

  // Keep refs in sync
  useEffect(() => { proposalIdRef.current = proposalId; }, [proposalId]);
  useEffect(() => { isTradingRef.current = isTrading; }, [isTrading]);
  useEffect(() => { sessionProfitRef.current = session.totalProfit; }, [session.totalProfit]);
  useEffect(() => { lastDigitsRef.current = lastDigits; }, [lastDigits]);

  // Load global strategy from database
  useEffect(() => {
    const loadStrategy = async () => {
      const { data } = await supabase
        .from("global_strategy")
        .select("*")
        .eq("active", true)
        .limit(1)
        .single();
      if (data) {
        setStrategyVersion(data.version);
        const risk = data.risk_global as unknown as any;
        const recovery = data.recovery_global as unknown as any;
        if (risk) {
          setMartingale(risk.martingale_enabled ?? true);
          setMartingaleMultiplier(String(risk.multiplier ?? 2.2));
          setMaxMartingaleSteps(risk.max_recovery_steps ?? 10);
          setStopLoss(String(risk.daily_loss_limit ?? 100));
          setTakeProfit(String(risk.daily_profit_target ?? 1000));
          setSmartRisker(risk.secure_partial_profit_percent > 0);
          setFreqThreshold(risk.stop_after_loss_streak ?? 12);
        }
        if (recovery) {
          setStopAfterMaxMartingale(recovery.reset_after_win ?? true);
          setStartMartingaleAfter(recovery.start_martingale_after ?? 1);
        }
      }
    };
    loadStrategy();
    const interval = setInterval(loadStrategy, 30000);
    return () => clearInterval(interval);
  }, []);

  // Local signal scoring (runs client-side for speed, mirrors backend logic)
  const calculateLocalSignal = useCallback((digits: number[], pressure: DigitPressure, buffer: { quote: number }[]) => {
    const total = digits.length;
    if (total < 30) return { score: 0, details: { frequencyScore: 0, pressureScore: 0, streakScore: 0, patternScore: 0, volatilityScore: 0 } };

    const freq = new Array(10).fill(0);
    digits.forEach(d => freq[d]++);
    let maxDev = 0;
    freq.forEach(c => { maxDev = Math.max(maxDev, Math.abs((c / total) * 100 - 10)); });
    const frequencyScore = Math.min(maxDev / 10, 1);

    let maxP = 0;
    for (let d = 0; d <= 9; d++) maxP = Math.max(maxP, pressure[d] || 0);
    const pressureScore = Math.min(maxP / 20, 1);

    let cs = 1, ms = 1;
    for (let i = digits.length - 1; i > 0; i--) {
      if (digits[i] === digits[i - 1]) { cs++; ms = Math.max(ms, cs); } else cs = 1;
    }
    const streakScore = Math.min(ms / 5, 1);

    const last10 = digits.slice(-10);
    const pats = new Set<string>();
    for (let i = 0; i <= last10.length - 3; i++) pats.add(last10.slice(i, i + 3).join(""));
    const patternScore = Math.min(pats.size / 8, 1);

    const recent = buffer.slice(-20);
    let vol = 0;
    for (let i = 1; i < recent.length; i++) vol += Math.abs(recent[i].quote - recent[i - 1].quote);
    const volatilityScore = Math.min(recent.length > 1 ? (vol / (recent.length - 1)) * 100 : 0, 1);

    const score = frequencyScore * 0.25 + pressureScore * 0.30 + streakScore * 0.15 + patternScore * 0.15 + volatilityScore * 0.15;
    return { score, details: { frequencyScore, pressureScore, streakScore, patternScore, volatilityScore } };
  }, []);

  // Check if digit frequency condition is met for trading
  const isFreqConditionMet = useCallback((): boolean => {
    if (!freqBasedTrading || lastDigitsRef.current.length < 30) return true;
    const digits = lastDigitsRef.current;
    const total = digits.length;
    for (let d = 0; d <= 9; d++) {
      const count = digits.filter(x => x === d).length;
      const pct = (count / total) * 100;
      if (pct >= freqThreshold) return true;
    }
    return false;
  }, [freqBasedTrading, freqThreshold]);

  // Subscribe to ticks
  useEffect(() => {
    if (!ws) return;
    if (prevMarketRef.current !== selectedMarket) ws.unsubscribeTicks(prevMarketRef.current);
    prevMarketRef.current = selectedMarket;
    ws.subscribeTicks(selectedMarket);

    const unsub = ws.on("tick", (data) => {
      if (!data.tick || typeof data.tick.quote !== "number") return;

      const quote = data.tick.quote;
      setCurrentTick(quote);

      // Reliable Digit Extraction
      const quoteStr = quote.toString();
      const lastDigit = parseInt(quoteStr.charAt(quoteStr.length - 1), 10);
      
      const tickData = { quote, digit: lastDigit, epoch: data.tick.epoch || Date.now() / 1000 };
      
      // Update local refs and state
      setCurrentTick(quote);
      setLastDigits(prev => [...prev.slice(-999), lastDigit]);
      lastDigitsRef.current = [...lastDigitsRef.current.slice(-999), lastDigit];
      tickBufferRef.current = [...tickBufferRef.current.slice(-999), tickData];

      // Update digit pressure (track absence)
      tickIndexRef.current++;
      const newPressure = { ...digitPressureRef.current };
      newPressure[lastDigit] = 0;
      for (let d = 0; d <= 9; d++) {
        if (d !== lastDigit) newPressure[d] = (newPressure[d] || 0) + 1;
      }
      digitPressureRef.current = newPressure;
      setDigitPressure(newPressure);

      // Find highest pressure digit
      let hpDigit = 0, hpVal = 0;
      for (let d = 0; d <= 9; d++) {
        if ((newPressure[d] || 0) > hpVal) { hpVal = newPressure[d]; hpDigit = d; }
      }
      setHighestPressureDigit(hpDigit);

      // Calculate and update signal score
      const sig = calculateLocalSignal(lastDigitsRef.current, newPressure, tickBufferRef.current);
      setSignalScore(sig.score);
      setSignalDetails(sig.details);

      // Fast Execution Logic
      if (botRunning.current && !isTradingRef.current && proposalIdRef.current) {
        const now = Date.now();
        if (now - lastTradeTimestampRef.current >= 1000) {
          if (sig.score >= 0.15 || aggressiveMode) {
            executeTradeFast();
          }
        }
      }
    });
    return () => { unsub(); };
  }, [ws, selectedMarket, executionSpeed, calculateLocalSignal, freqBasedTrading]);

  // Preload tick history
  useEffect(() => {
    if (!ws) return;
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    if (!projectId) return;
    
    // Fetch historical ticks via edge function
    const fetchHistory = async () => {
      try {
        const res = await supabase.functions.invoke("deriv-proxy", {
          body: { action: "tick_history", params: { symbol: selectedMarket, count: 1000 } },
        });
        if (res.data?.history?.prices) {
          const prices = res.data.history.prices;
          const digits = prices.map((p: number) => {
            const f = Number(p).toFixed(2);
            return parseInt(f[f.length - 1], 10);
          });
          setLastDigits(prev => {
            if (prev.length < 50) {
              lastDigitsRef.current = digits;
              return digits;
            }
            return prev;
          });
          // Fill tick buffer
          tickBufferRef.current = prices.map((p: number) => ({ quote: p, digit: getLastDigit(p), epoch: 0 }));
        }
      } catch {}
    };
    fetchHistory();
  }, [ws, selectedMarket]);

  // Get proposal - continuously request proposals
  useEffect(() => {
    if (!ws || !isLoggedIn) return;

    const requestProposal = () => {
      const needsBarrier = contractType === "DIGITOVER" || contractType === "DIGITUNDER";
      const isRiseFall = contractType === "CALL" || contractType === "PUT";
      ws.getProposal({
        amount: currentStake.current,
        contractType,
        symbol: selectedMarket,
        duration: isRiseFall ? Math.max(duration, 5) : duration,
        durationUnit: isRiseFall ? "t" : durationUnit,
        ...(needsBarrier && { barrier }),
      });
    };

    requestProposal();
    const proposalInterval = setInterval(requestProposal, 3000);

    const unsub = ws.on("proposal", (data) => {
      if (data.proposal) {
        setProposalId(data.proposal.id);
        proposalIdRef.current = data.proposal.id;
        setPayout(data.proposal.payout);
      }
    });
    return () => { unsub(); clearInterval(proposalInterval); };
  }, [ws, contractType, stake, selectedMarket, duration, durationUnit, barrier, isLoggedIn]);

  const marketLabel = VOLATILITY_MARKETS.find((m) => m.symbol === selectedMarket)?.label || selectedMarket;
  const needsBarrier = contractType === "DIGITOVER" || contractType === "DIGITUNDER";
  const winRate = session.totalTrades > 0 ? ((session.wins / session.totalTrades) * 100).toFixed(1) : "0.0";

  const handleTradeResult = useCallback((profit: number, won: boolean, contractId: string, tradeStake: number) => {
    setTradeResult({ profit, won });
    openContracts.current = Math.max(0, openContracts.current - 1);

    // Show notification
    toast({
      title: won ? "✅ Trade Won" : "❌ Trade Lost",
      description: `${won ? "+" : ""}${profit.toFixed(2)} USD • ${marketLabel}`,
    });

    setTransactions((prev) => [{
      id: contractId || Date.now().toString(),
      contractType,
      stake: tradeStake,
      profit,
      won,
      description: `${contractType.replace("DIGIT", "")} on ${marketLabel} • ${duration}${durationUnit}`,
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

    // Recovery logic
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

    // Smart Risker
    const totalP = sessionProfitRef.current + profit;
    if (smartRisker && totalP > 0) {
      const halfStake = parseFloat(stake) * 0.5;
      if (totalP >= halfStake + partialProfitTaken.current) {
        partialProfitTaken.current = totalP;
        currentStake.current = parseFloat(stake);
        consecutiveLosses.current = 0;
      }
    }

    // TP/SL checks
    const tp = parseFloat(takeProfit);
    const sl = parseFloat(stopLoss);
    if (totalP >= tp) {
      setTpAmount(totalP);
      setShowTpModal(true);
      stopBot();
      toast({ title: "🎉 Take Profit Hit!", description: `Profit: $${totalP.toFixed(2)}` });
    } else if (totalP <= -sl) {
      stopBot();
      toast({ title: "⛔ Stop Loss Hit", description: `Loss limit reached: $${Math.abs(totalP).toFixed(2)}` });
    }

    // CRITICAL: Mark trading as done IMMEDIATELY
    setIsTrading(false);
    isTradingRef.current = false;

    // Re-request proposal with current stake for next trade
    if (ws && botRunning.current) {
      const needsB = contractType === "DIGITOVER" || contractType === "DIGITUNDER";
      const isRF = contractType === "CALL" || contractType === "PUT";
      ws.getProposal({
        amount: currentStake.current,
        contractType,
        symbol: selectedMarket,
        duration: isRF ? Math.max(duration, 5) : duration,
        durationUnit: isRF ? "t" : durationUnit,
        ...(needsB && { barrier }),
      });
    }
  }, [ws, stake, martingale, martingaleMultiplier, maxMartingaleSteps, takeProfit, stopLoss, contractType, marketLabel, duration, durationUnit, barrier, startMartingaleAfter, stopAfterMaxMartingale, smartRisker, selectedMarket]);

  // FAST trade execution — non-blocking, uses one-time listener
  const executeTradeFast = useCallback(() => {
    if (!ws || !proposalIdRef.current || !isLoggedIn) return;
    
    // Check if aggressive mode or not trading
    if (!aggressiveMode && isTradingRef.current) return;
    if (openContracts.current >= (aggressiveMode ? 10 : 3)) return; // Max concurrent trades guard

    const currentProposalId = proposalIdRef.current;
    
    // Ensure stake is correct: use martingale stake if in recovery, else use user input stake
    const tradeStake = consecutiveLosses.current > 0 ? currentStake.current : parseFloat(stake);

    isTradingRef.current = true;
    setIsTrading(true);
    setTradeResult(null);
    openContracts.current++;

    lastTradeTimestampRef.current = Date.now();
    ws.buyContract(currentProposalId, tradeStake);
    
    // Reset isTrading immediately in aggressive mode to allow parallel trades
    if (aggressiveMode) {
      setTimeout(() => {
        isTradingRef.current = false;
        setIsTrading(false);
      }, 500);
    }

    const unsubBuy = ws.on("buy", (data) => {
      unsubBuy();
      if (data.error) {
        isTradingRef.current = false;
        setIsTrading(false);
        openContracts.current = Math.max(0, openContracts.current - 1);
        return;
      }
      if (data.buy) {
        ws.subscribeOpenContract();
      }
    });

    const unsubContract = ws.on("proposal_open_contract", (data) => {
      const poc = data.proposal_open_contract;
      if (poc && poc.is_sold) {
        unsubContract();
        handleTradeResult(poc.profit, poc.profit > 0, poc.contract_id, tradeStake);
      }
    });
  }, [ws, isLoggedIn, handleTradeResult]);

  const executeTrade = useCallback(() => {
    executeTradeFast();
  }, [executeTradeFast]);

  const startBot = () => {
    if (!isLoggedIn) return;
    if (mode === "Quick") { executeTrade(); return; }
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
    toast({ title: "▶ Bot Resumed", description: `${strategyProfile} profile • ${executionSpeed} mode` });
  };

  const confirmStart = () => {
    setShowConfirmModal(false);
    setSoftwareStatus("ACTIVE");
    botRunning.current = true;
    consecutiveLosses.current = 0;
    currentStake.current = parseFloat(stake);
    partialProfitTaken.current = 0;
    openContracts.current = 0;
    isTradingRef.current = false;
    setIsTrading(false);
    setSession({ totalTrades: 0, wins: 0, losses: 0, totalProfit: 0, peakBalance: 0, maxDrawdown: 0, startBalance: 0, largestStake: 0, maxLossStreak: 0 });
    setTransactions([]);
    toast({ title: "▶ Bot Started", description: `${strategyProfile} profile • ${executionSpeed} mode` });
  };

  const stopBot = () => {
    setSoftwareStatus("INACTIVE");
    botRunning.current = false;
    isTradingRef.current = false;
    setIsTrading(false);
    toast({ title: "⏹ Bot Stopped", description: `P/L: $${session.totalProfit.toFixed(2)}` });
  };

  // Normal mode auto-trade loop (4s interval)
  useEffect(() => {
    if (softwareStatus !== "ACTIVE" || !botRunning.current || mode !== "Automated" || executionSpeed !== "Normal") return;

    const timer = setInterval(() => {
      if (botRunning.current && !isTradingRef.current && proposalIdRef.current) {
        executeTradeFast();
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [softwareStatus, mode, executionSpeed, executeTradeFast]);

  // Aggressive mode auto-trade loop (1s interval - 1 trade per second)
  useEffect(() => {
    if (softwareStatus !== "ACTIVE" || !botRunning.current || mode !== "Automated" || executionSpeed !== "Fast") return;

    const timer = setInterval(() => {
      if (botRunning.current && proposalIdRef.current) {
        // In aggressive mode, execute immediately without waiting for previous trade to close
        executeTradeFast();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [softwareStatus, mode, executionSpeed, executeTradeFast]);

  const clearTransactions = () => setTransactions([]);

  // Compute digit frequencies for display
  const digitFrequencies = useMemo(() => DIGIT_BARRIERS.map((d) => {
    const num = parseInt(d);
    const count = lastDigits.filter((x) => x === num).length;
    const total = lastDigits.length;
    return { digit: num, count, pct: total > 0 ? (count / total) * 100 : 0 };
  }), [lastDigits]);

  return (
    <div className="flex h-full">
      {/* Left area - main content */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-5">
        {/* Tab selector */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
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
          {strategyVersion && (
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              Strategy v{strategyVersion} • {strategyProfile}
            </span>
          )}
          {/* Signal Score Badge */}
          {lastDigits.length > 30 && (
            <motion.span
              key={signalScore.toFixed(2)}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                signalScore >= 0.3 ? "bg-buy/20 text-buy" : signalScore >= 0.15 ? "bg-warning/20 text-warning" : "bg-muted text-muted-foreground"
              }`}
            >
              Signal: {(signalScore * 100).toFixed(0)}%
            </motion.span>
          )}
          {currentTick !== null && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-[10px] text-muted-foreground">{marketLabel}</span>
              <span className="text-sm font-mono font-bold text-foreground">{currentTick}</span>
            </div>
          )}
        </div>

        {activeTab === "analysis" ? (
          !isPremium && !isAdmin ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-card border border-border rounded-xl">
              <Lock className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground">Premium Analysis</h3>
              <p className="text-sm text-muted-foreground text-center max-w-xs mt-2">
                Advanced analysis tools are only available for premium members.
              </p>
              <button
                onClick={() => {
                  setPremiumFeature("Analysis Tools");
                  setShowPremiumModal(true);
                }}
                className="mt-6 px-6 py-2 bg-gradient-brand text-primary-foreground font-semibold rounded-lg hover-lift"
              >
                Upgrade to Premium
              </button>
            </div>
          ) : (
            <AnalysisTab lastDigits={lastDigits} session={session} marketLabel={marketLabel} />
          )
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
                      <p className="text-2xl font-mono font-bold text-foreground">{currentTick !== null ? currentTick : "Loading..."}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Last Digit</p>
                      <p className="text-2xl font-mono font-bold text-primary">{lastDigits.length > 0 ? lastDigits[lastDigits.length - 1] : "-"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Ticks</p>
                      <p className="text-lg font-mono font-bold text-foreground">{lastDigits.length}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">Open</p>
                      <p className="text-lg font-mono font-bold text-warning">{openContracts.current}</p>
                    </div>
                  </div>
                </div>

                {/* Signal Strength + Digit Pressure */}
                {lastDigits.length > 30 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
                    {!isPremium && !isAdmin && (
                      <div className="absolute inset-0 z-10 bg-background/60 backdrop-blur-[2px] rounded-xl flex items-center justify-center">
                        <div className="text-center p-4">
                          <Lock className="w-8 h-8 text-primary mx-auto mb-2" />
                          <p className="text-xs font-bold text-foreground">Premium Signals Locked</p>
                          <button
                            onClick={() => {
                              setPremiumFeature("AI Signals & Pressure Analysis");
                              setShowPremiumModal(true);
                            }}
                            className="mt-2 text-[10px] text-primary hover:underline font-bold"
                          >
                            Unlock Now
                          </button>
                        </div>
                      </div>
                    )}
                    {/* Signal Scoring */}
                    <div className="p-4 rounded-xl bg-card border border-border">
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="w-4 h-4 text-primary" />
                        <h3 className="text-sm font-semibold text-foreground">Signal Strength</h3>
                      </div>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${signalScore >= 0.3 ? "bg-buy" : signalScore >= 0.15 ? "bg-warning" : "bg-muted-foreground"}`}
                            animate={{ width: `${Math.min(signalScore * 100, 100)}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        <span className="text-sm font-bold text-foreground">{(signalScore * 100).toFixed(0)}%</span>
                      </div>
                      <div className="grid grid-cols-5 gap-1">
                        {[
                          { label: "Freq", value: signalDetails.frequencyScore },
                          { label: "Press", value: signalDetails.pressureScore },
                          { label: "Strk", value: signalDetails.streakScore },
                          { label: "Patt", value: signalDetails.patternScore },
                          { label: "Vol", value: signalDetails.volatilityScore },
                        ].map((s) => (
                          <div key={s.label} className="text-center">
                            <div className="h-10 bg-secondary rounded relative overflow-hidden">
                              <motion.div
                                className="absolute bottom-0 w-full bg-primary/40 rounded"
                                animate={{ height: `${s.value * 100}%` }}
                                transition={{ duration: 0.3 }}
                              />
                            </div>
                            <span className="text-[8px] text-muted-foreground mt-0.5 block">{s.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Digit Pressure */}
                    <div className="p-4 rounded-xl bg-card border border-border">
                      <div className="flex items-center gap-2 mb-3">
                        <Flame className="w-4 h-4 text-sell" />
                        <h3 className="text-sm font-semibold text-foreground">Digit Pressure</h3>
                      </div>
                      <div className="grid grid-cols-5 gap-2">
                        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => {
                          const pressure = digitPressure[d] || 0;
                          const isHigh = pressure >= 15;
                          const isMed = pressure >= 10;
                          return (
                            <div key={d} className={`text-center p-1.5 rounded-lg border ${
                              isHigh ? "border-sell/50 bg-sell/10" : isMed ? "border-warning/30 bg-warning/5" : "border-border"
                            }`}>
                              <p className={`text-sm font-bold ${d === highestPressureDigit ? "text-sell" : "text-foreground"}`}>{d}</p>
                              <p className={`text-[9px] font-mono ${isHigh ? "text-sell" : isMed ? "text-warning" : "text-muted-foreground"}`}>{pressure}</p>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-[9px] text-muted-foreground mt-2 text-center">
                        Highest: Digit {highestPressureDigit} ({digitPressure[highestPressureDigit] || 0} ticks absent)
                      </p>
                    </div>
                  </div>
                )}

                {/* Sign in prompt */}
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

                {/* Last 50 Digits — Tiny Circles */}
                <div className="p-4 rounded-xl bg-card border border-border">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Last 50 Digits ({marketLabel})</h3>
                  <div className="flex flex-wrap gap-1">
                    {(lastDigits.length > 0 ? lastDigits.slice(-50) : Array(50).fill(null)).map((digit, i) => (
                      <motion.div
                        key={i}
                        initial={digit !== null ? { scale: 0.5, opacity: 0 } : false}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.15 }}
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-mono font-bold transition-all ${
                          digit === null
                            ? "bg-secondary text-muted-foreground"
                            : digit >= 5
                              ? "bg-buy/20 text-buy border border-buy/30"
                              : "bg-sell/20 text-sell border border-sell/30"
                        }`}
                      >
                        {digit !== null && digit !== undefined ? String(digit) : "-"}
                      </motion.div>
                    ))}
                  </div>

                  {/* Digit frequency — Deriv-style donut circles */}
                  <div className="mt-4 grid grid-cols-10 gap-1.5">
                    {digitFrequencies.map((d) => {
                      const circumference = 2 * Math.PI * 15;
                      const dashLen = (d.pct / 100) * circumference;
                      const gapLen = circumference - dashLen;
                      return (
                        <div key={d.digit} className="flex flex-col items-center gap-0.5">
                          <div className="relative w-9 h-9">
                            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                              <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--secondary))" strokeWidth="2.5" />
                              <circle
                                cx="18" cy="18" r="15" fill="none"
                                stroke={d.pct > 12 ? "hsl(var(--sell))" : d.pct > 8 ? "hsl(var(--warning))" : "hsl(var(--buy))"}
                                strokeWidth="2.5"
                                strokeDasharray={`${dashLen} ${gapLen}`}
                                strokeLinecap="round"
                              />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-foreground">{d.digit}</span>
                          </div>
                          <span className="text-[8px] text-muted-foreground">{d.pct.toFixed(0)}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Freq-based status */}
                {freqBasedTrading && softwareStatus === "ACTIVE" && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-lg text-center text-xs font-medium ${isFreqConditionMet() ? "bg-buy/10 text-buy" : "bg-warning/10 text-warning"}`}
                  >
                    {isFreqConditionMet() ? "⚡ Frequency imbalance detected — Trading active" : "⏸ Waiting for digit frequency imbalance..."}
                  </motion.div>
                )}

                {/* Session stats */}
                {session.totalTrades > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Win Rate", value: `${winRate}%`, color: "text-buy" },
                      { label: "Total P/L", value: `${session.totalProfit >= 0 ? "+" : ""}${session.totalProfit.toFixed(2)}`, color: session.totalProfit >= 0 ? "text-buy" : "text-sell" },
                      { label: "Trades", value: session.totalTrades.toString(), color: "text-foreground" },
                      { label: "Max DD", value: `${session.maxDrawdown.toFixed(1)}%`, color: "text-sell" },
                    ].map((s) => (
                      <motion.div
                        key={s.label}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-3 rounded-lg bg-card border border-border text-center"
                      >
                        <p className="text-[10px] text-muted-foreground">{s.label}</p>
                        <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Smart Risker indicator */}
                {smartRisker && session.totalProfit > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-3 rounded-lg bg-success/10 border border-success/20 text-center"
                  >
                    <p className="text-xs font-medium text-success">🛡 Smart Risker Active — Partial profits secured at ${partialProfitTaken.current.toFixed(2)}</p>
                  </motion.div>
                )}

                {/* Features preview for non-logged-in users */}
                {!isLoggedIn && (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      { icon: BarChart3, title: "Advanced Analytics", desc: "Digit analysis + pattern recognition" },
                      { icon: TrendingUp, title: "AI-Powered Bot", desc: "Signal scoring + digit pressure" },
                      { icon: Zap, title: "Real-Time Updates", desc: "Live tick data and instant execution" },
                      { icon: Shield, title: "Risk Management", desc: "Stop loss, take profit, and stake control" },
                    ].map((item) => (
                      <motion.div
                        key={item.title}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-xl bg-card border border-border"
                      >
                        <item.icon className="w-5 h-5 text-primary mb-2" />
                        <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Right Panel - Trading Controls */}
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
            <input type="number" value={stake} onChange={(e) => { setStake(e.target.value); currentStake.current = parseFloat(e.target.value) || 3; }} min="0.35" step="0.01" className="mt-1 w-full px-3 py-2 bg-secondary border border-border rounded text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
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

          {/* Strategy Profile Selector */}
          <div>
            <label className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">Strategy Profile <span className="text-primary text-xs">●</span></label>
            <div className="mt-1 flex gap-1">
              {(["aggressive", "balanced", "conservative"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setStrategyProfile(p)}
                  className={`flex-1 py-1.5 text-[10px] font-medium rounded transition-all capitalize ${
                    strategyProfile === p
                      ? p === "aggressive" ? "bg-sell/20 text-sell border border-sell/30" : p === "balanced" ? "bg-warning/20 text-warning border border-warning/30" : "bg-buy/20 text-buy border border-buy/30"
                      : "bg-secondary text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {p === "aggressive" ? "🟥" : p === "balanced" ? "🟨" : "🟩"} {p}
                </button>
              ))}
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
                <p className={`text-xl font-bold ${softwareStatus === "ACTIVE" ? "text-success animate-pulse" : "text-primary"}`}>
                  {softwareStatus}
                </p>
              </div>

              <button
                onClick={softwareStatus === "ACTIVE" ? stopBot : startBot}
                disabled={!isLoggedIn}
                className={`w-full py-2.5 font-semibold text-sm rounded-lg border-2 transition-all disabled:opacity-50 ${
                  softwareStatus === "ACTIVE"
                    ? "border-sell text-sell hover:bg-sell/10"
                    : "border-buy text-buy hover:bg-buy/10"
                }`}
              >
                {!isLoggedIn ? "Connect to Start" : softwareStatus === "ACTIVE" ? "⏹ Stop" : "▶ Start"}
              </button>

              <div>
                <label className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">Execution Speed <span className="text-primary text-xs">●</span></label>
                <select
                  value={executionSpeed}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "Fast" && !isPremium && !isAdmin) {
                      setPremiumFeature("Aggressive Execution Mode");
                      setShowPremiumModal(true);
                      return;
                    }
                    setExecutionSpeed(val as any);
                  }}
                  className="mt-1 w-full px-3 py-2 bg-secondary border border-border rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="Fast">🚀 Aggressive (1 trade/sec) {!isPremium && !isAdmin ? "🔒" : ""}</option>
                  <option value="Normal">🐢 Normal (4s delay)</option>
                </select>
              </div>
            </div>
          )}

          {/* Risk Management Settings button */}
          <button
            onClick={() => setShowRiskPanel(true)}
            className="w-full flex items-center justify-between px-3 py-2.5 bg-secondary border border-border rounded-lg text-xs text-foreground hover:bg-muted transition-colors"
          >
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-primary" />
              <span>Risk Management</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* Last trade result */}
          <AnimatePresence>
            {tradeResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`p-3 rounded-lg text-center ${tradeResult.won ? "bg-success/10 text-success" : "bg-sell/10 text-sell"}`}
              >
                <p className="text-xs font-semibold">
                  {tradeResult.won ? "✅ Won" : "❌ Lost"}: {tradeResult.profit.toFixed(2)} USD
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile Bottom Trade Engine Bar */}
      <div className="lg:hidden fixed bottom-16 left-0 right-0 z-20 bg-card/95 backdrop-blur-lg border-t border-border">
        {/* Compact summary row */}
        <div className="flex items-center gap-1 px-3 py-1.5 text-[9px] text-muted-foreground border-b border-border/50 overflow-x-auto whitespace-nowrap">
          <span className="bg-secondary px-1.5 py-0.5 rounded font-medium text-foreground">{stake}</span>
          <span>Stake</span>
          <span className="mx-0.5">•</span>
          <span className="bg-secondary px-1.5 py-0.5 rounded font-medium text-foreground">{duration}</span>
          <span>Duration</span>
          <span className="mx-0.5">•</span>
          <span className="bg-secondary px-1.5 py-0.5 rounded font-medium text-foreground">{durationUnit === "t" ? "t" : durationUnit}</span>
          <span>D. Unit</span>
          <span className="mx-0.5">•</span>
          <span className="bg-secondary px-1.5 py-0.5 rounded font-medium text-foreground">{contractType.replace("DIGIT", "")}</span>
          <span>Contract</span>
          <span className="mx-0.5">•</span>
          <span className="bg-secondary px-1.5 py-0.5 rounded font-medium text-foreground">{executionSpeed}</span>
          <span>Speed</span>
        </div>
        {/* Action row */}
        <div className="flex items-center gap-2 px-3 py-2">
          <button
            onClick={() => setShowRiskModal(true)}
            className="flex items-center gap-1 px-3 py-2 bg-secondary rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <Settings className="w-3.5 h-3.5" />
            Risk Mgt
          </button>
          {mode === "Automated" ? (
            <button
              onClick={softwareStatus === "ACTIVE" ? stopBot : startBot}
              disabled={!isLoggedIn}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 font-bold text-sm rounded-lg transition-all disabled:opacity-50 ${
                softwareStatus === "ACTIVE"
                  ? "bg-sell text-white"
                  : "bg-buy text-white"
              }`}
            >
              <Zap className="w-4 h-4" />
              {!isLoggedIn ? "Connect" : softwareStatus === "ACTIVE" ? "Stop" : "Run"}
            </button>
          ) : (
            <button
              onClick={executeTrade}
              disabled={isTrading || !proposalId || !isLoggedIn}
              className="flex-1 py-2.5 bg-buy text-white font-bold text-sm rounded-lg disabled:opacity-50 transition-all"
            >
              {isLoggedIn ? "Execute" : "Connect"}
            </button>
          )}
          <div className={`px-2 py-1 rounded text-[9px] font-medium shrink-0 ${
            softwareStatus === "ACTIVE" ? "bg-buy/10 text-buy" : "bg-secondary text-muted-foreground"
          }`}>
            {softwareStatus === "ACTIVE" ? "Bot running" : "Bot is not running"}
          </div>
        </div>
        {/* Signal strength mini bar */}
        <div className="px-3 pb-1.5">
          <div className="h-1 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${signalScore >= 0.5 ? "bg-buy" : signalScore >= 0.25 ? "bg-warning" : "bg-sell"}`}
              animate={{ width: `${Math.min(signalScore * 100, 100)}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      <div className="fixed bottom-32 lg:bottom-8 right-4 flex flex-col gap-3 z-30">
        <button
          onClick={() => setShowTransactions(!showTransactions)}
          className="w-14 h-14 rounded-full bg-card border-2 border-border shadow-xl flex items-center justify-center hover:bg-secondary transition-colors hover:scale-110"
          title="Transactions"
        >
          <Wallet className="w-6 h-6 text-primary" />
        </button>
        <motion.div
          key={session.totalProfit}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          className={`px-4 py-2 rounded-full text-sm font-bold shadow-xl ${session.totalProfit >= 0 ? "bg-buy text-primary-foreground" : "bg-sell text-primary-foreground"}`}
        >
          {session.totalProfit >= 0 ? "+" : ""}{session.totalProfit.toFixed(2)}
        </motion.div>
      </div>

      {/* Premium Upgrade Modal */}
      <PremiumUpgradeModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        featureName={premiumFeature}
      />

      {/* Risk Management Side Panel */}
      <RiskPanel
        isOpen={showRiskPanel}
        onClose={() => setShowRiskPanel(false)}
        takeProfit={takeProfit}
        stopLoss={stopLoss}
        maxDrawdown={session.maxDrawdown}
        dailyTarget={session.totalProfit}
        onTakeProfitChange={setTakeProfit}
        onStopLossChange={setStopLoss}
      />

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
                <FormField label="Trade Differs" hint="Trade differs first and switch contract type on loss.">
                  <select value={tradeDiffers ? "Yes" : "No"} onChange={(e) => setTradeDiffers(e.target.value === "Yes")} className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm text-foreground">
                    <option>No</option><option>Yes</option>
                  </select>
                </FormField>
                <FormField label="Take Profit" hint="Minimum profit limit.">
                  <input type="number" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm text-foreground" />
                </FormField>
                <FormField label="Stop Loss" hint="Maximum loss limit.">
                  <input type="number" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm text-foreground" />
                </FormField>
                <FormField label="Trading Method" hint="Stakelist or martingale.">
                  <select value={martingale ? "Martingale" : "Flat"} onChange={(e) => setMartingale(e.target.value === "Martingale")} className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm text-foreground">
                    <option>Flat</option><option>Martingale</option>
                  </select>
                </FormField>
                {martingale && (
                  <>
                    <FormField label="Martingale Multiplier" hint="Multiplier on loss.">
                      <input type="number" value={martingaleMultiplier} onChange={(e) => setMartingaleMultiplier(e.target.value)} step="0.1" className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm text-foreground" />
                    </FormField>
                    <FormField label="Max Martingale Level" hint="Max consecutive multiplications.">
                      <input type="number" value={maxMartingaleSteps} onChange={(e) => setMaxMartingaleSteps(parseInt(e.target.value) || 3)} className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm text-foreground" />
                    </FormField>
                    <FormField label="Stop After Max Level" hint="Stop or reset and continue.">
                      <select value={stopAfterMaxMartingale ? "Yes" : "No"} onChange={(e) => setStopAfterMaxMartingale(e.target.value === "Yes")} className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm text-foreground">
                        <option>Yes</option><option>No</option>
                      </select>
                    </FormField>
                    <FormField label="Start Martingale After" hint="Losses before martingale kicks in.">
                      <input type="number" value={startMartingaleAfter} onChange={(e) => setStartMartingaleAfter(parseInt(e.target.value) || 1)} className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm text-foreground" />
                    </FormField>
                  </>
                )}
                <div className="border-t border-border pt-4">
                  <FormField label="Smart Risker" hint="Auto-secure 50% partial profits.">
                    <select value={smartRisker ? "Yes" : "No"} onChange={(e) => setSmartRisker(e.target.value === "Yes")} className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm text-foreground">
                      <option>No</option><option>Yes</option>
                    </select>
                  </FormField>
                </div>
                <div className="border-t border-border pt-4">
                  <FormField label="Frequency-Based Trading" hint="Only trade on digit frequency imbalance.">
                    <select value={freqBasedTrading ? "Yes" : "No"} onChange={(e) => setFreqBasedTrading(e.target.value === "Yes")} className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm text-foreground">
                      <option>No</option><option>Yes</option>
                    </select>
                  </FormField>
                  {freqBasedTrading && (
                    <FormField label="Frequency Threshold (%)" hint="Min digit frequency % to trigger trade.">
                      <input type="number" value={freqThreshold} onChange={(e) => setFreqThreshold(parseInt(e.target.value) || 12)} min="8" max="30" className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm text-foreground" />
                    </FormField>
                  )}
                </div>
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
                <p className="text-xs text-primary">Ensure your settings are correct before starting.</p>
                <table className="w-full text-xs">
                  <tbody className="divide-y divide-border">
                    {[
                      ["Starting Stake:", `${parseFloat(stake).toFixed(2)}`],
                      ["Strategy:", strategyProfile],
                      ["Martingale:", martingaleMultiplier],
                      ["Take Profit:", takeProfit],
                      ["Stop Loss:", stopLoss],
                      ["Market:", marketLabel],
                      ["Speed:", executionSpeed],
                      ["Smart Risker:", smartRisker ? "On" : "Off"],
                      ["Freq Trading:", freqBasedTrading ? `On (${freqThreshold}%)` : "Off"],
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

interface Transaction {
  id: string;
  contractType: string;
  stake: number;
  profit: number;
  won: boolean;
  description: string;
}

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
          <motion.div
            key={tx.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${tx.won ? "bg-buy/20" : "bg-sell/20"}`}>
              <span className={`text-sm ${tx.won ? "text-buy" : "text-sell"}`}>{tx.won ? "↗" : "↘"}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground">{tx.contractType} • {tx.id}</p>
              <p className="text-[10px] text-muted-foreground">{tx.description}</p>
              <div className="flex gap-4 mt-1">
                <span className="text-[10px] text-muted-foreground">Stake: {tx.stake.toFixed(2)}</span>
                <span className={`text-[10px] ${tx.won ? "text-buy" : "text-sell"}`}>{tx.won ? "+" : ""}{tx.profit.toFixed(2)}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    )}
  </div>
);

export default TradingPanel;
