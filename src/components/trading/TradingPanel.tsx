import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Wallet, List, Table, ChevronRight, Settings, TrendingUp, BarChart3, Shield, Zap, Activity, Flame, Target, AlertTriangle, Lock, Brain } from "lucide-react";
import DerivWebSocket from "@/services/deriv-websocket";
import { DerivAccount } from "@/services/deriv-auth";
import { VOLATILITY_MARKETS, MARKET_CATEGORIES, CONTRACT_TYPES, DIGIT_BARRIERS, getLastDigit } from "@/lib/trading-constants";
import { tradingEngine } from "@/services/trading-engine";
import { aiLogger, AIEngine } from "@/services/ai-logger";
import { derivBrain } from "@/services/deriv-brain";
import { fanOutCopyTrade } from "@/services/copy-trade";
import { tradeLock } from "@/services/trade-lock";
import { engineMemory, buildPatternKey } from "@/services/engine-memory";
import { notifications } from "@/services/notifications";
import { sounds } from "@/services/sounds";
import AnalysisTab from "@/components/trading/AnalysisTab";
import DigitAnalysisDashboard from "@/components/trading/DigitAnalysisDashboard";
import LiveProbabilityEngine from "@/components/trading/LiveProbabilityEngine";
import QuantTerminal from "@/components/trading/QuantTerminal";
import StrategyBooklet from "@/components/trading/StrategyBooklet";
import DigitEdgeAnalytics from "@/components/trading/DigitEdgeAnalytics";
import AnalysisPaywall from "@/components/trading/AnalysisPaywall";

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

// ── ELIT Strategy Engine ──────────────────────────────────────────
function elitAnalysis(digits: number[], pressure: DigitPressure, buffer: { quote: number; epoch?: number }[]): {
  score: number;
  contract: string;
  reason: string;
  layers: { name: string; active: boolean; value: number }[];
} {
  const total = digits.length;
  if (total < 50) return { score: 0, contract: "DIGITODD", reason: "Insufficient data", layers: [] };

  // Layer 1: Digit frequency imbalance
  const freq = new Array(10).fill(0);
  digits.forEach(d => freq[d]++);
  let rareDigit = -1, rareCount = Infinity, domDigit = 0, domCount = 0;
  freq.forEach((c, i) => {
    const pct = (c / total) * 100;
    if (pct < 5 && c < rareCount) { rareDigit = i; rareCount = c; }
    if (c > domCount) { domDigit = i; domCount = c; }
  });
  const freqImbalance = Math.max(...freq.map(c => Math.abs((c / total) * 100 - 10)));
  const l1Active = freqImbalance >= 3;
  const l1Score = Math.min(freqImbalance * 5, 25);

  // Layer 2: Momentum shift
  const recent50 = digits.slice(-50);
  const prev50 = digits.slice(-100, -50);
  const recentOdd = recent50.filter(x => x % 2 !== 0).length;
  const prevOdd = prev50.length > 0 ? prev50.filter(x => x % 2 !== 0).length : 25;
  const momentumShift = Math.abs(recentOdd - prevOdd);
  const l2Active = momentumShift >= 3;
  const l2Score = Math.min(momentumShift * 4, 20);
  const oddMomentum = recentOdd > prevOdd;

  // Layer 3: Streak detection
  let streak = 1;
  for (let i = digits.length - 1; i > 0; i--) {
    if (digits[i] === digits[i - 1]) streak++; else break;
  }
  const l3Active = streak >= 2;
  const l3Score = Math.min(streak * 8, 20);

  // Layer 4: Digit clustering
  const last30 = digits.slice(-30);
  const highCount = last30.filter(d => d >= 7).length;
  const lowCount = last30.filter(d => d <= 2).length;
  const clusterPct = Math.max(highCount, lowCount) / 30 * 100;
  const l4Active = clusterPct >= 40;
  const l4Score = Math.min(clusterPct * 0.5, 20);
  const highCluster = highCount > lowCount;

  // Layer 5: Tick speed acceleration
  let tickSpeed = 0;
  if (buffer.length >= 10) {
    const recent = buffer.slice(-10);
    const span = (recent[recent.length - 1].epoch || 0) - (recent[0].epoch || 0);
    tickSpeed = span > 0 ? 10 / span : 0;
  }
  const l5Active = tickSpeed >= 2;
  const l5Score = Math.min(tickSpeed * 5, 15);

  const totalScore = Math.min(Math.round(l1Score + l2Score + l3Score + l4Score + l5Score), 100);

  // Determine contract type
  let contract = "DIGITODD";
  let reason = "";
  if (l2Active && oddMomentum) { contract = "DIGITODD"; reason = "Odd momentum detected"; }
  else if (l2Active && !oddMomentum) { contract = "DIGITEVEN"; reason = "Even momentum detected"; }
  else if (l3Active && streak >= 3) { contract = "DIGITDIFF"; reason = `Digit ${digits[digits.length - 1]} streak x${streak} — reversal expected`; }
  else if (l1Active && rareDigit >= 0) { contract = "DIGITDIFF"; reason = `Rare digit ${rareDigit} at ${((rareCount / total) * 100).toFixed(1)}%`; }
  else if (l4Active && highCluster) { contract = "DIGITOVER"; reason = "High digit cluster detected"; }
  else if (l4Active && !highCluster) { contract = "DIGITUNDER"; reason = "Low digit cluster detected"; }
  else { reason = "Waiting for confluence"; }

  const layers = [
    { name: "Frequency", active: l1Active, value: l1Score },
    { name: "Momentum", active: l2Active, value: l2Score },
    { name: "Streak", active: l3Active, value: l3Score },
    { name: "Cluster", active: l4Active, value: l4Score },
    { name: "Tick Speed", active: l5Active, value: l5Score },
  ];

  return { score: totalScore, contract, reason, layers };
}

const TradingPanel = ({ ws, account }: TradingPanelProps) => {
  const [selectedMarket, setSelectedMarket] = useState<string>(() => localStorage.getItem("dnx_market") || VOLATILITY_MARKETS[0].symbol);
  const [contractType, setContractType] = useState(() => localStorage.getItem("dnx_contractType") || "DIGITEVEN");
  const [stake, setStake] = useState(() => localStorage.getItem("dnx_stake") || "3");
  const [duration, setDuration] = useState(1);
  const [durationUnit, setDurationUnit] = useState("t");
  const [barrier, setBarrier] = useState("4");
  const [lastDigits, setLastDigits] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(`dnx_ticks_${VOLATILITY_MARKETS[0].symbol}`);
      return saved ? JSON.parse(saved).digits || [] : [];
    } catch { return []; }
  });
  const [currentTick, setCurrentTick] = useState<number | null>(null);
  const [proposalId, setProposalId] = useState<string | null>(null);
  const [payout, setPayout] = useState<number | null>(null);
  const [isTrading, setIsTrading] = useState(false);
  const [tradeResult, setTradeResult] = useState<{ profit: number; won: boolean } | null>(null);

  // Bot engine state
  const [mode, setMode] = useState<"Quick" | "Automated">("Automated");
  const [softwareStatus, setSoftwareStatus] = useState<"INACTIVE" | "ACTIVE">("INACTIVE");
  const [executionSpeed, setExecutionSpeed] = useState<"Normal" | "Fast" | "Turbo">("Fast");
  const [tradesPerSecond, setTradesPerSecond] = useState(0);
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
  const [strategyProfile, setStrategyProfile] = useState<"aggressive" | "balanced" | "conservative" | "elit" | "brain">(() => (localStorage.getItem("dnx_profile") as any) || "balanced");
  const [recoveryMode, setRecoveryModeState] = useState<"digit" | "evenodd">(() => derivBrain.getRecoveryMode());
  const [strategyVersion, setStrategyVersion] = useState<number | null>(null);

  // Track whether the user has manually edited risk settings.
  // If true, we DO NOT overwrite them when global_strategy reloads.
  const userTouchedRisk = useRef(false);
  // Engine watchdog tracking
  const lastTickTs = useRef<number>(Date.now());
  const lastTradeAttemptTs = useRef<number>(Date.now());
  const lastProposalReqTs = useRef<number>(0);

  // Bulk trade mode
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkCount, setBulkCount] = useState(3);
  const bulkModeRef = useRef(false);
  const bulkCountRef = useRef(3);

  // Signal scoring
  const [signalScore, setSignalScore] = useState(0);
  const [signalDetails, setSignalDetails] = useState<SignalDetails>({ frequencyScore: 0, pressureScore: 0, streakScore: 0, patternScore: 0, volatilityScore: 0 });
  const [digitPressure, setDigitPressure] = useState<DigitPressure>({ 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 });
  const [highestPressureDigit, setHighestPressureDigit] = useState(0);

  // ELIT state
  const [elitScore, setElitScore] = useState(0);
  const [elitContract, setElitContract] = useState("");
  const [elitReason, setElitReason] = useState("");
  const [elitLayers, setElitLayers] = useState<{ name: string; active: boolean; value: number }[]>([]);

  // Continuous mode tracking
  const [tradesPerSec, setTradesPerSec] = useState(0);
  const tradeTimestamps = useRef<number[]>([]);

  const [session, setSession] = useState<SessionStats>({
    totalTrades: 0, wins: 0, losses: 0, totalProfit: 0,
    peakBalance: 0, maxDrawdown: 0, startBalance: 0, largestStake: 0, maxLossStreak: 0,
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showTransactions, setShowTransactions] = useState(false);
  const [txViewMode, setTxViewMode] = useState<"list" | "table">("list");
  const [showRiskModal, setShowRiskModal] = useState(false);
  
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
  const proposalReady = useRef(false);
  const isTradingRef = useRef(false);
  const sessionProfitRef = useRef(0);
  const lastDigitsRef = useRef<number[]>([]);
  const tickBufferRef = useRef<{ quote: number; digit: number; epoch: number }[]>([]);
  const digitPressureRef = useRef<DigitPressure>({ 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 });
  const tickIndexRef = useRef(0);
  // Pending trades map: contractId -> { stake, resolved }
  const pendingTrades = useRef<Map<string, { stake: number; resolved: boolean }>>(new Map());
  // Trade queue for continuous mode
  const tradeQueueRef = useRef<number>(0);
  const MAX_TRADES_PER_SEC = 10;
  const MAX_CONCURRENT = 15;
  // Latest signal ref for decoupled decision loop
  const latestSignalRef = useRef<{ score: number; elitScore: number }>({ score: 0, elitScore: 0 });

  const isLoggedIn = !!account;

  // Persist settings
  useEffect(() => { localStorage.setItem("dnx_market", selectedMarket); }, [selectedMarket]);
  useEffect(() => { localStorage.setItem("dnx_contractType", contractType); }, [contractType]);
  useEffect(() => { localStorage.setItem("dnx_stake", stake); }, [stake]);
  useEffect(() => { localStorage.setItem("dnx_profile", strategyProfile); }, [strategyProfile]);

  // Persist tick history to localStorage (throttled, every 5 ticks)
  const tickSaveCounter = useRef(0);
  useEffect(() => {
    tickSaveCounter.current++;
    if (tickSaveCounter.current % 5 !== 0) return;
    try {
      const digits = lastDigits.slice(-500);
      const buffer = tickBufferRef.current.slice(-500);
      localStorage.setItem(`dnx_ticks_${selectedMarket}`, JSON.stringify({ digits, buffer, ts: Date.now() }));
    } catch {}
  }, [lastDigits, selectedMarket]);

  // Keep refs in sync
  useEffect(() => { proposalIdRef.current = proposalId; }, [proposalId]);
  useEffect(() => { isTradingRef.current = isTrading; }, [isTrading]);
  useEffect(() => { sessionProfitRef.current = session.totalProfit; }, [session.totalProfit]);
  useEffect(() => { lastDigitsRef.current = lastDigits; }, [lastDigits]);
  useEffect(() => { bulkModeRef.current = bulkMode; }, [bulkMode]);
  useEffect(() => { bulkCountRef.current = bulkCount; }, [bulkCount]);

  // Trades/sec counter
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      tradeTimestamps.current = tradeTimestamps.current.filter(t => t > now - 1000);
      setTradesPerSec(tradeTimestamps.current.length);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Load global strategy from database (does NOT overwrite user-touched risk settings)
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
        // ── Skip overwrite if user has manually customized their risk settings ──
        if (userTouchedRisk.current) return;
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
    // Periodic reload — only updates strategyVersion, won't overwrite user risk
    const interval = setInterval(loadStrategy, 60000);
    return () => clearInterval(interval);
  }, []);

  // ── Load user's saved risk/strategy settings from DB (per-user, sync across devices) ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        // Try localStorage first for instant load
        const cached = localStorage.getItem(`dnx_user_settings_${user.id}`);
        if (cached) {
          const c = JSON.parse(cached);
          if (c.takeProfit) setTakeProfit(String(c.takeProfit));
          if (c.stopLoss) setStopLoss(String(c.stopLoss));
          if (c.baseStake) setStake(String(c.baseStake));
          if (typeof c.martingaleEnabled === "boolean") setMartingale(c.martingaleEnabled);
          if (c.martingaleMultiplier) setMartingaleMultiplier(String(c.martingaleMultiplier));
          if (c.maxMartingaleSteps) setMaxMartingaleSteps(c.maxMartingaleSteps);
          if (c.startMartingaleAfter) setStartMartingaleAfter(c.startMartingaleAfter);
          if (c.selectedStrategy) setStrategyProfile(c.selectedStrategy);
          if (c.executionSpeed) setExecutionSpeed(c.executionSpeed);
          userTouchedRisk.current = true;
        }
        // Then sync from DB (authoritative)
        const { data } = await supabase
          .from("user_trading_settings")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        if (data && !cancelled) {
          if (data.take_profit != null) setTakeProfit(String(data.take_profit));
          if (data.stop_loss != null) setStopLoss(String(data.stop_loss));
          if (data.base_stake != null) setStake(String(data.base_stake));
          if (typeof data.martingale_enabled === "boolean") setMartingale(data.martingale_enabled);
          if (data.martingale_multiplier != null) setMartingaleMultiplier(String(data.martingale_multiplier));
          if (data.max_martingale_steps != null) setMaxMartingaleSteps(data.max_martingale_steps);
          if (data.start_martingale_after != null) setStartMartingaleAfter(data.start_martingale_after);
          if (data.selected_strategy) setStrategyProfile(data.selected_strategy as any);
          if (data.execution_speed) setExecutionSpeed(data.execution_speed as any);
          userTouchedRisk.current = true;
          aiLogger.log("System", "info", "User settings loaded from cloud");
        }
      } catch (e) {
        console.warn("[Settings] Load failed:", e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Persist user's risk/strategy settings (debounced) ──
  const settingsSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!userTouchedRisk.current) return;
    if (settingsSaveTimer.current) clearTimeout(settingsSaveTimer.current);
    settingsSaveTimer.current = setTimeout(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const payload = {
          take_profit: parseFloat(takeProfit) || null,
          stop_loss: parseFloat(stopLoss) || null,
          base_stake: parseFloat(stake) || null,
          martingale_enabled: martingale,
          martingale_multiplier: parseFloat(martingaleMultiplier) || null,
          max_martingale_steps: maxMartingaleSteps,
          start_martingale_after: startMartingaleAfter,
          selected_strategy: strategyProfile,
          execution_speed: executionSpeed,
          selected_market: selectedMarket,
        };
        // Cache to localStorage immediately
        localStorage.setItem(`dnx_user_settings_${user.id}`, JSON.stringify({
          takeProfit, stopLoss, baseStake: stake, martingaleEnabled: martingale,
          martingaleMultiplier, maxMartingaleSteps, startMartingaleAfter,
          selectedStrategy: strategyProfile, executionSpeed,
        }));
        // Upsert to DB
        await supabase.from("user_trading_settings").upsert({
          user_id: user.id,
          ...payload,
        }, { onConflict: "user_id" });
      } catch (e) {
        console.warn("[Settings] Save failed:", e);
      }
    }, 1500);
    return () => { if (settingsSaveTimer.current) clearTimeout(settingsSaveTimer.current); };
  }, [takeProfit, stopLoss, stake, martingale, martingaleMultiplier, maxMartingaleSteps, startMartingaleAfter, strategyProfile, executionSpeed, selectedMarket]);

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

  // Subscribe to ticks — reset all buffers on market switch
  useEffect(() => {
    if (!ws) return;
    if (prevMarketRef.current !== selectedMarket) {
      ws.unsubscribeTicks(prevMarketRef.current);
      // ── FULL BUFFER RESET on market switch ──
      setLastDigits([]);
      lastDigitsRef.current = [];
      tickBufferRef.current = [];
      setCurrentTick(null);
      setSignalScore(0);
      setSignalDetails({ frequencyScore: 0, pressureScore: 0, streakScore: 0, patternScore: 0, volatilityScore: 0 });
      const resetPressure: DigitPressure = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
      digitPressureRef.current = resetPressure;
      setDigitPressure(resetPressure);
      tickIndexRef.current = 0;
      setElitScore(0);
      setElitContract("");
      setElitReason("");
      setElitLayers([]);
      toast({ title: `Market switched to ${VOLATILITY_MARKETS.find(m => m.symbol === selectedMarket)?.label || selectedMarket}`, description: `Tracking digit intelligence for ${selectedMarket}` });
    }
    prevMarketRef.current = selectedMarket;
    ws.subscribeTicks(selectedMarket);

    const unsub = ws.on("tick", (data) => {
      if (!data.tick || typeof data.tick.quote !== "number") return;

      const quote = data.tick.quote;
      // ── CRITICAL: Use bulletproof getLastDigit (preserves trailing zeros) ──
      const lastDigit = getLastDigit(quote);

      const tickData = { quote, digit: lastDigit, epoch: data.tick.epoch || Date.now() / 1000 };

      // Update freshness watchdog timestamp
      lastTickTs.current = Date.now();

      setCurrentTick(quote);
      setLastDigits(prev => [...prev.slice(-999), lastDigit]);
      lastDigitsRef.current = [...lastDigitsRef.current.slice(-999), lastDigit];
      tickBufferRef.current = [...tickBufferRef.current.slice(-999), tickData];

      // Update digit pressure
      tickIndexRef.current++;
      const newPressure = { ...digitPressureRef.current };
      newPressure[lastDigit] = 0;
      for (let d = 0; d <= 9; d++) {
        if (d !== lastDigit) newPressure[d] = (newPressure[d] || 0) + 1;
      }
      digitPressureRef.current = newPressure;
      setDigitPressure(newPressure);

      let hpDigit = 0, hpVal = 0;
      for (let d = 0; d <= 9; d++) {
        if ((newPressure[d] || 0) > hpVal) { hpVal = newPressure[d]; hpDigit = d; }
      }
      setHighestPressureDigit(hpDigit);

      // Calculate signal
      const sig = calculateLocalSignal(lastDigitsRef.current, newPressure, tickBufferRef.current);
      setSignalScore(sig.score);
      setSignalDetails(sig.details);

      // ELIT analysis
      if (strategyProfile === "elit") {
        const elit = elitAnalysis(lastDigitsRef.current, newPressure, tickBufferRef.current);
        setElitScore(elit.score);
        setElitContract(elit.contract);
        setElitReason(elit.reason);
        setElitLayers(elit.layers);
        latestSignalRef.current = { score: sig.score, elitScore: elit.score };
      } else {
        latestSignalRef.current = { score: sig.score, elitScore: 0 };
      }

      // Tick handler does DATA ONLY — no trade execution here
    });
    return () => { unsub(); };
  }, [ws, selectedMarket, calculateLocalSignal, strategyProfile]);

  // Preload tick history
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`dnx_ticks_${selectedMarket}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        const age = Date.now() - (parsed.ts || 0);
        if (age < 3600000 && parsed.digits?.length > 0) {
          if (lastDigitsRef.current.length < 50) {
            setLastDigits(parsed.digits);
            lastDigitsRef.current = parsed.digits;
            if (parsed.buffer) tickBufferRef.current = parsed.buffer;
          }
        }
      }
    } catch {}

    if (!ws) return;
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
    if (!projectId) return;
    
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
          tickBufferRef.current = prices.map((p: number) => ({ quote: p, digit: getLastDigit(p), epoch: 0 }));
        }
      } catch {}
    };
    fetchHistory();
  }, [ws, selectedMarket]);

  // ── PROPOSAL LIFECYCLE: ready/consumed/refresh ──
  const requestProposal = useCallback(() => {
    if (!ws || !isLoggedIn) return;
    const needsB = contractType === "DIGITOVER" || contractType === "DIGITUNDER";
    const isRF = contractType === "CALL" || contractType === "PUT";
    proposalReady.current = false; // Mark not ready until response arrives
    ws.getProposal({
      amount: currentStake.current,
      contractType,
      symbol: selectedMarket,
      duration: isRF ? Math.max(duration, 5) : duration,
      durationUnit: isRF ? "t" : durationUnit,
      ...(needsB && { barrier }),
    });
  }, [ws, contractType, selectedMarket, duration, durationUnit, barrier, isLoggedIn]);

  // Proposal listener + periodic refresh + watchdog
  useEffect(() => {
    if (!ws || !isLoggedIn) return;

    requestProposal();
    lastProposalReqTs.current = Date.now();
    const proposalInterval = setInterval(() => {
      requestProposal();
      lastProposalReqTs.current = Date.now();
    }, 3000);

    const unsub = ws.on("proposal", (data) => {
      if (data.proposal) {
        setProposalId(data.proposal.id);
        proposalIdRef.current = data.proposal.id;
        proposalReady.current = true;
        setPayout(data.proposal.payout);
      }
      if (data.error) {
        // Force a re-request soon if proposal failed
        proposalReady.current = false;
        aiLogger.log("System", "warn", `Proposal error: ${data.error.message || "unknown"}`);
      }
    });
    return () => { unsub(); clearInterval(proposalInterval); };
  }, [ws, contractType, stake, selectedMarket, duration, durationUnit, barrier, isLoggedIn, requestProposal]);

  const marketLabel = VOLATILITY_MARKETS.find((m) => m.symbol === selectedMarket)?.label || selectedMarket;
  const needsBarrier = contractType === "DIGITOVER" || contractType === "DIGITUNDER";
  const winRate = session.totalTrades > 0 ? ((session.wins / session.totalTrades) * 100).toFixed(1) : "0.0";

  const handleTradeResult = useCallback((profit: number, won: boolean, contractId: string, tradeStake: number, entryDigit?: number, exitDigit?: number) => {
    pendingTrades.current.delete(contractId);
    setTradeResult({ profit, won });
    openContracts.current = Math.max(0, openContracts.current - 1);

    toast({
      title: won ? "✅ Trade Won" : "❌ Trade Lost",
      description: `${won ? "+" : ""}${profit.toFixed(2)} USD • ${marketLabel}`,
    });

    // ── Inform Brain (self-learning + recovery arming) ──
    if (strategyProfile === "brain") {
      derivBrain.recordResult(won, profit);
    }

    // ── AI logger trade entry ──
    const engine: AIEngine =
      strategyProfile === "brain" ? "Brain" :
      strategyProfile === "elit" ? "ELIT" :
      strategyProfile === "aggressive" ? "Aggressive" :
      strategyProfile === "conservative" ? "Conservative" : "Balanced";

    // ── Cross-engine self-learning: record this trade's pattern outcome ──
    try {
      const recent = lastDigitsRef.current.slice(-200);
      const counts = Array(10).fill(0);
      recent.forEach((d) => { if (d >= 0 && d <= 9) counts[d]++; });
      const total = recent.length || 1;
      const freq = counts.map((c) => (c / total) * 100);
      const patternKey = buildPatternKey(contractType, freq);
      engineMemory.record(engine, patternKey, won);
    } catch {}

    // ── Release the global trade lock (next trade may proceed) ──
    tradeLock.release(engine);

    aiLogger.trade({
      engine,
      contractId,
      contractType,
      symbol: selectedMarket,
      entryDigit: entryDigit ?? null,
      exitDigit: exitDigit ?? null,
      stake: tradeStake,
      profit,
      won,
    });

    // ── LOG TRADE TO BACKEND ──
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.functions.invoke("trade-engine", {
            body: {
              action: "log-trade",
              params: {
                userId: user.id,
                contractId: contractId || Date.now().toString(),
                contractType,
                symbol: selectedMarket,
                stake: tradeStake,
                profit,
                won,
              },
            },
          });
        }
      } catch (e) {
        console.warn("[TradeLog] Failed to persist trade:", e);
      }
    })();

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
      return {
        ...prev,
        totalTrades: prev.totalTrades + 1,
        wins: prev.wins + (won ? 1 : 0),
        losses: prev.losses + (won ? 0 : 1),
        totalProfit: newProfit,
        peakBalance: newPeak,
        maxDrawdown: Math.max(prev.maxDrawdown, dd),
        largestStake: Math.max(prev.largestStake, tradeStake),
        maxLossStreak: Math.max(prev.maxLossStreak, won ? 0 : consecutiveLosses.current + 1),
      };
    });

    if (won) {
      consecutiveLosses.current = 0;
      currentStake.current = parseFloat(stake);
    } else {
      consecutiveLosses.current++;
      if (martingale && consecutiveLosses.current >= startMartingaleAfter) {
        // PERSISTENT MARTINGALE: keep stake at the max-step level after maxMartingaleSteps
        // is reached — do NOT reset to base until a real win occurs.
        const lossStep = consecutiveLosses.current - startMartingaleAfter + 1;
        const cappedStep = Math.min(lossStep, maxMartingaleSteps);
        currentStake.current = parseFloat(stake) * Math.pow(parseFloat(martingaleMultiplier), cappedStep);
      }
    }

    const totalP = sessionProfitRef.current + profit;
    if (smartRisker && totalP > 0) {
      const halfStake = parseFloat(stake) * 0.5;
      if (totalP >= halfStake + partialProfitTaken.current) {
        partialProfitTaken.current = totalP;
        currentStake.current = parseFloat(stake);
        consecutiveLosses.current = 0;
      }
    }

    const tp = parseFloat(takeProfit);
    const sl = parseFloat(stopLoss);
    if (totalP >= tp) {
      setTpAmount(totalP);
      setShowTpModal(true);
      stopBot();
      toast({ title: "🎉 Take Profit Hit!", description: `Profit: $${totalP.toFixed(2)}` });
      notifications.notify("🎉 Take Profit Hit", `Session profit: $${totalP.toFixed(2)}`, "tp");
    } else if (totalP <= -sl) {
      stopBot();
      toast({ title: "⛔ Stop Loss Hit", description: `Loss limit reached: $${Math.abs(totalP).toFixed(2)}` });
      notifications.notify("⛔ Stop Loss Hit", `Loss limit reached: $${Math.abs(totalP).toFixed(2)}`, "sl");
    }

    // After stake changes, refresh proposal ONCE with new stake
    requestProposal();
    lastProposalReqTs.current = Date.now();
  }, [ws, stake, martingale, martingaleMultiplier, maxMartingaleSteps, takeProfit, stopLoss, contractType, marketLabel, duration, durationUnit, barrier, startMartingaleAfter, smartRisker, selectedMarket, requestProposal, strategyProfile]);

  // ── PERSISTENT LISTENERS: registered ONCE, dispatch by contract_id ──
  useEffect(() => {
    if (!ws) return;

    const unsubBuy = ws.on("buy", (data) => {
      if (data.error) {
        openContracts.current = Math.max(0, openContracts.current - 1);
        console.warn("[TradeEngine] Buy error:", data.error.message);
        if (strategyProfile === "brain") derivBrain.cancelInFlight();
        tradeLock.release();
        aiLogger.log("System", "error", `Buy error: ${data.error.message}`);
        notifications.notify("Trade error", data.error.message, "error");
        requestProposal();
        return;
      }
      if (data.buy?.contract_id) {
        const contractId = String(data.buy.contract_id);
        const latest = pendingTrades.current.get("_latest_stake");
        const tradeStake = latest ? latest.stake : currentStake.current;
        const entryDigit = (latest as any)?.entryDigit ?? null;
        pendingTrades.current.delete("_latest_stake");
        pendingTrades.current.set(contractId, { stake: tradeStake, resolved: false, entryDigit } as any);
        ws.subscribeOpenContract();

        // Fan out to active client tokens (copy-trading)
        const needsB = contractType === "DIGITOVER" || contractType === "DIGITUNDER";
        const isRF = contractType === "CALL" || contractType === "PUT";
        fanOutCopyTrade({
          contractType,
          symbol: selectedMarket,
          duration: isRF ? Math.max(duration, 5) : duration,
          durationUnit: (isRF ? "t" : durationUnit) as "t" | "s" | "m" | "h" | "d",
          barrier: needsB ? barrier : undefined,
        }).catch(() => {});
      }
    });

    const unsubPoc = ws.on("proposal_open_contract", (data) => {
      const poc = data.proposal_open_contract;
      if (!poc || !poc.is_sold) return;
      const contractId = String(poc.contract_id);
      const pending = pendingTrades.current.get(contractId) as any;
      if (!pending || pending.resolved) return;
      pending.resolved = true;
      const exitDigit = poc.exit_tick != null ? getLastDigit(poc.exit_tick) : undefined;
      handleTradeResult(poc.profit, poc.profit > 0, contractId, pending.stake, pending.entryDigit ?? undefined, exitDigit);
    });

    return () => { unsubBuy(); unsubPoc(); };
  }, [ws, handleTradeResult, requestProposal, strategyProfile, contractType, selectedMarket, duration, durationUnit, barrier]);

  // ── TRADE EXECUTION: consumes proposal, fires buy, requests new proposal ──
  const executeTradeContinuous = useCallback((entryDigit?: number) => {
    if (!ws || !proposalReady.current || !proposalIdRef.current || !isLoggedIn) {
      if (strategyProfile === "brain") derivBrain.cancelInFlight();
      return false;
    }
    if (openContracts.current >= MAX_CONCURRENT) {
      if (strategyProfile === "brain") derivBrain.cancelInFlight();
      return false;
    }

    const now = Date.now();
    tradeTimestamps.current = tradeTimestamps.current.filter(t => t > now - 1000);
    if (tradeTimestamps.current.length >= MAX_TRADES_PER_SEC) {
      if (strategyProfile === "brain") derivBrain.cancelInFlight();
      return false;
    }

    // ── GLOBAL THROTTLE: only one trade in flight regardless of tick speed ──
    const engineName: AIEngine =
      strategyProfile === "brain" ? "Brain" :
      strategyProfile === "elit" ? "ELIT" :
      strategyProfile === "aggressive" ? "Aggressive" :
      strategyProfile === "conservative" ? "Conservative" : "Balanced";
    if (!tradeLock.tryAcquire(engineName)) {
      if (strategyProfile === "brain") derivBrain.cancelInFlight();
      return false;
    }

    const currentProposalId = proposalIdRef.current;
    const tradeStake = currentStake.current;

    proposalReady.current = false;
    proposalIdRef.current = null;

    pendingTrades.current.set("_latest_stake", { stake: tradeStake, resolved: false, entryDigit } as any);
    tradeTimestamps.current.push(now);
    openContracts.current++;
    lastTradeAttemptTs.current = now;

    ws.buyContract(currentProposalId, tradeStake);
    requestProposal();
    lastProposalReqTs.current = now;
    return true;
  }, [ws, isLoggedIn, requestProposal, strategyProfile]);

  const executeTrade = useCallback(() => {
    executeTradeContinuous();
  }, [executeTradeContinuous]);

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
    pendingTrades.current.clear();
    sounds.prime(); // user gesture → unlocks audible alerts
    setSession({ totalTrades: 0, wins: 0, losses: 0, totalProfit: 0, peakBalance: 0, maxDrawdown: 0, startBalance: 0, largestStake: 0, maxLossStreak: 0 });
    setTransactions([]);
    toast({ title: "▶ Bot Started", description: `${strategyProfile} profile • ${executionSpeed} mode` });
  };

  const stopBot = () => {
    setSoftwareStatus("INACTIVE");
    botRunning.current = false;
    toast({ title: "⏹ Bot Stopped", description: `P/L: $${session.totalProfit.toFixed(2)}` });
  };

  // ── DECOUPLED DECISION LOOP — runs on interval, reads signal from refs ──
  useEffect(() => {
    if (softwareStatus !== "ACTIVE" || !botRunning.current || mode !== "Automated") return;

    const intervalMs = executionSpeed === "Turbo" ? 200 :
                       executionSpeed === "Fast" ? 700 : 4000;
    // Brain trades only ONE contract at a time, no spamming
    const brainIntervalMs = strategyProfile === "brain" ? 300 : intervalMs;

    let lastEngineLogTs = 0;

    const timer = setInterval(() => {
      if (!botRunning.current) return;
      if (openContracts.current >= MAX_CONCURRENT) return;

      const now = Date.now();
      tradeTimestamps.current = tradeTimestamps.current.filter(t => t > now - 1000);
      if (tradeTimestamps.current.length >= MAX_TRADES_PER_SEC) return;

      // ── DERIV BRAIN: strict UNDER 8 / OVER 2 with adaptive selection ──
      if (strategyProfile === "brain") {
        const lastQuote = tickBufferRef.current[tickBufferRef.current.length - 1]?.quote ?? 0;
        const decision = derivBrain.decide(lastDigitsRef.current, lastQuote);
        if (decision.shouldTrade && decision.contractType && decision.barrier) {
          // Brain trades one at a time — guard with openContracts check
          if (openContracts.current > 0) {
            derivBrain.cancelInFlight();
            return;
          }
          // Switch contract type/barrier dynamically; new proposal will be requested
          if (contractType !== decision.contractType || barrier !== decision.barrier) {
            setContractType(decision.contractType);
            setBarrier(decision.barrier);
            // Wait one tick for proposal to refresh
            derivBrain.cancelInFlight();
            return;
          }
          if (!proposalReady.current) {
            derivBrain.cancelInFlight();
            return;
          }
          const lastDigit = lastDigitsRef.current[lastDigitsRef.current.length - 1];
          executeTradeContinuous(lastDigit);
        }
        return;
      }

      if (!proposalReady.current) return;

      // ── DigitEdge full-analytics gate for non-Brain engines ──
      // Engines must "think" before firing: read frequency imbalance, digit
      // pressure (highest-pressure pointer), recent streaks, parity bias and
      // probability surface — not just a single signal score.
      const digits = lastDigitsRef.current;
      const total = digits.length;
      const freq = new Array(10).fill(0);
      digits.forEach((d) => freq[d]++);
      const freqPct = total > 0 ? freq.map((c) => (c / total) * 100) : freq;
      const maxDev = Math.max(...freqPct.map((p) => Math.abs(p - 10)));
      const last30 = digits.slice(-30);
      let trailEven = 0, trailOdd = 0, trailLow = 0, trailHigh = 0;
      for (let i = last30.length - 1; i >= 0; i--) {
        const d = last30[i];
        if (d % 2 === 0) { if (trailOdd === 0) trailEven++; else break; }
        else { if (trailEven === 0) trailOdd++; else break; }
      }
      for (let i = last30.length - 1; i >= 0; i--) {
        const d = last30[i];
        if (d < 5) { if (trailHigh === 0) trailLow++; else break; }
        else { if (trailLow === 0) trailHigh++; else break; }
      }
      const evenInLast20 = digits.slice(-20).filter((d) => d % 2 === 0).length;
      const evenBias = evenInLast20 / 20;

      const { score, elitScore } = latestSignalRef.current;
      let shouldTrade = false;
      let analyticsReason = "";
      const threshold = strategyProfile === "aggressive" ? 0.05 :
                        strategyProfile === "conservative" ? 0.25 : 0.15;

      const engineName: AIEngine =
        strategyProfile === "elit" ? "ELIT" :
        strategyProfile === "aggressive" ? "Aggressive" :
        strategyProfile === "conservative" ? "Conservative" : "Balanced";

      // Cross-engine memory veto — skip patterns this engine consistently loses on
      const patternKey = buildPatternKey(contractType, freqPct);
      if (engineMemory.shouldSkip(engineName, patternKey)) {
        if (now - lastEngineLogTs > 5000) {
          aiLogger.log(engineName, "warn", `Skipping pattern ${patternKey} (poor history)`);
          lastEngineLogTs = now;
        }
        return;
      }

      if (strategyProfile === "elit") {
        shouldTrade = elitScore >= 70;
        if (shouldTrade) aiLogger.log("ELIT", "success", `Confluence ${elitScore}% — firing ${elitContract.replace("DIGIT","")} • freqDev ${maxDev.toFixed(1)}% • lowRun ${trailLow} • highRun ${trailHigh}`);
      } else {
        // Conservative / Balanced / Aggressive — read full DigitEdge surface
        // Require at least one of: signal-score threshold, strong sequence streak,
        // strong parity bias, or strong frequency dominance.
        const sigOk = score >= threshold;
        const streakOk = trailLow >= 4 || trailHigh >= 4 || trailEven >= 4 || trailOdd >= 4;
        const biasOk = evenBias <= 0.30 || evenBias >= 0.70; // >=70% one parity in last 20
        const dominanceOk = maxDev >= 5; // any digit ≥15% or ≤5%
        // Conservative needs 2 confluences, balanced 1, aggressive 1
        const confluenceCount = [sigOk, streakOk, biasOk, dominanceOk].filter(Boolean).length;
        const required = strategyProfile === "conservative" ? 2 : 1;
        shouldTrade = confluenceCount >= required;
        if (shouldTrade) {
          analyticsReason = `sig ${(score * 100).toFixed(0)}% • dev ${maxDev.toFixed(1)}% • E/O ${(evenBias * 100).toFixed(0)}% • run L${trailLow}/H${trailHigh} E${trailEven}/O${trailOdd}`;
          aiLogger.log(engineName, "success", `Firing ${contractType.replace("DIGIT", "")} — ${analyticsReason}`);
        } else if (now - lastEngineLogTs > 4000) {
          aiLogger.log(engineName, "info", `Reading edge — sig ${(score * 100).toFixed(0)}% • dev ${maxDev.toFixed(1)}% • runs L${trailLow}/H${trailHigh} E${trailEven}/O${trailOdd} • need ${required} confluence`);
          lastEngineLogTs = now;
        }
      }

      if (shouldTrade) {
        const lastDigit = digits[digits.length - 1];
        // Aggressive / Conservative / Balanced / ELIT all fire ONE trade per
        // tick — never batch. Lock + proposal-refresh handle continuous flow.
        executeTradeContinuous(lastDigit);
      }
    }, brainIntervalMs);

    // TPS counter — update every 500ms
    const tpsTimer = setInterval(() => {
      const now = Date.now();
      const recentTrades = tradeTimestamps.current.filter(t => t > now - 1000);
      setTradesPerSecond(recentTrades.length);
    }, 500);

    return () => { clearInterval(timer); clearInterval(tpsTimer); };
  }, [softwareStatus, mode, executionSpeed, executeTradeContinuous, strategyProfile, contractType, barrier, elitContract]);

  // ── ENGINE WATCHDOG: detect stuck state and auto-recover ──
  useEffect(() => {
    if (softwareStatus !== "ACTIVE") return;
    const watchdog = setInterval(() => {
      const now = Date.now();
      // Tick freshness: if no tick in 15s, force resubscribe
      if (now - lastTickTs.current > 15000 && ws) {
        aiLogger.log("System", "warn", "Tick stream stale (>15s) — resubscribing");
        try {
          ws.unsubscribeTicks(selectedMarket);
          setTimeout(() => ws.subscribeTicks(selectedMarket), 500);
        } catch {}
        lastTickTs.current = now;
      }
      // Proposal watchdog: if no proposal in 8s, force re-request
      if (!proposalReady.current && now - lastProposalReqTs.current > 8000) {
        aiLogger.log("System", "warn", "Proposal stuck — forcing re-request");
        requestProposal();
        lastProposalReqTs.current = now;
      }
      // Execution loop: if bot active but no trade attempt in 60s and conditions favorable, log it
      if (botRunning.current && now - lastTradeAttemptTs.current > 60000 && openContracts.current === 0) {
        aiLogger.log("System", "info", "No trade attempts in 60s — engine idle (waiting for signal)");
        lastTradeAttemptTs.current = now;
      }
    }, 5000);
    return () => clearInterval(watchdog);
  }, [softwareStatus, ws, selectedMarket, requestProposal]);

  const clearTransactions = () => setTransactions([]);

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
          {/* High Speed indicator */}
          {softwareStatus === "ACTIVE" && (
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-buy/10 text-buy border border-buy/20 font-bold animate-pulse flex items-center gap-1">
              <Zap className="w-3 h-3" /> {tradesPerSec}t/s • {openContracts.current} open
            </span>
          )}
          {currentTick !== null && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-[10px] text-muted-foreground">{marketLabel}</span>
              <span className="text-sm font-mono font-bold text-foreground">{currentTick}</span>
            </div>
          )}
        </div>

        {activeTab === "analysis" ? (
          <AnalysisPaywall
            isPremium={isPremium}
            isAdmin={isAdmin}
            featureName="Analysis Tools"
            onUpgrade={(f) => { setPremiumFeature(f); setShowPremiumModal(true); }}
          >
            <AnalysisTab lastDigits={lastDigits} session={session} marketLabel={marketLabel} tickBuffer={tickBufferRef.current} signalScore={signalScore} signalDetails={signalDetails} digitPressure={digitPressure} />
          </AnalysisPaywall>
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

                {/* ELIT Strategy Panel */}
                {strategyProfile === "elit" && lastDigits.length > 50 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 rounded-xl bg-card border-2 border-warning/30"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Brain className="w-4 h-4 text-warning" />
                      <h3 className="text-sm font-bold text-warning">ELIT Strategy Engine</h3>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-warning/10 text-warning border border-warning/20 font-bold">
                        {elitScore}% Confluence
                      </span>
                      {elitScore >= 70 && (
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-buy/10 text-buy border border-buy/20 font-bold animate-pulse ml-auto">
                          ⚡ FIRING
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-5 gap-2 mb-3">
                      {elitLayers.map(l => (
                        <div key={l.name} className="text-center">
                          <div className="h-8 bg-secondary rounded relative overflow-hidden">
                            <motion.div
                              className={`absolute bottom-0 w-full rounded ${l.active ? "bg-warning/50" : "bg-muted-foreground/10"}`}
                              animate={{ height: `${l.value * 4}%` }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                          <span className="text-[7px] text-muted-foreground block mt-0.5">{l.name}</span>
                          <span className={`text-[8px] ${l.active ? "text-warning" : "text-muted-foreground"}`}>
                            {l.active ? "✔" : "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-muted-foreground">{elitReason}</p>
                      <span className="text-xs font-bold text-warning">{elitContract.replace("DIGIT", "")}</span>
                    </div>
                  </motion.div>
                )}

                {/* Signal Strength + Digit Pressure (premium) */}
                {lastDigits.length > 30 && (
                  <AnalysisPaywall
                    isPremium={isPremium}
                    isAdmin={isAdmin}
                    featureName="AI Signals & Pressure Analysis"
                    onUpgrade={(f) => { setPremiumFeature(f); setShowPremiumModal(true); }}
                    compact
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  </AnalysisPaywall>
                )}

                {/* Digit History Circles */}
                {lastDigits.length > 0 && (
                  <div className="p-3 rounded-xl bg-card border border-border">
                    <p className="text-[10px] text-muted-foreground mb-2">Digit History (last 60)</p>
                    <div className="flex flex-wrap gap-1">
                      {lastDigits.slice(-60).map((d, i) => (
                        <span key={i} className={`w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center ${d % 2 === 0 ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning"}`}>
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Digit Edge Analytics Panel — premium frequency view (100/500/1000) */}
                {lastDigits.length > 0 && (
                  <AnalysisPaywall
                    isPremium={isPremium}
                    isAdmin={isAdmin}
                    featureName="Digit Edge Analytics"
                    onUpgrade={(f) => { setPremiumFeature(f); setShowPremiumModal(true); }}
                    compact
                  >
                    <DigitEdgeAnalytics
                      lastDigits={lastDigits}
                      currentDigit={lastDigits.length > 0 ? lastDigits[lastDigits.length - 1] : null}
                    />
                  </AnalysisPaywall>
                )}

                {/* Live Probability Engine (premium) */}
                <AnalysisPaywall
                  isPremium={isPremium}
                  isAdmin={isAdmin}
                  featureName="Live Probability Engine"
                  onUpgrade={(f) => { setPremiumFeature(f); setShowPremiumModal(true); }}
                  compact
                >
                  <LiveProbabilityEngine lastDigits={lastDigits} tickBuffer={tickBufferRef.current} />
                </AnalysisPaywall>

                {/* Quant Terminal (premium) */}
                {lastDigits.length > 50 && (
                  <AnalysisPaywall
                    isPremium={isPremium}
                    isAdmin={isAdmin}
                    featureName="Quant Terminal"
                    onUpgrade={(f) => { setPremiumFeature(f); setShowPremiumModal(true); }}
                    compact
                  >
                    <QuantTerminal lastDigits={lastDigits} tickBuffer={tickBufferRef.current} signalScore={signalScore} />
                  </AnalysisPaywall>
                )}

                {/* Advanced Analysis Dashboard (premium) */}
                {lastDigits.length > 30 && (
                  <AnalysisPaywall
                    isPremium={isPremium}
                    isAdmin={isAdmin}
                    featureName="Advanced Digit Analysis"
                    onUpgrade={(f) => { setPremiumFeature(f); setShowPremiumModal(true); }}
                    compact
                  >
                    <DigitAnalysisDashboard
                      lastDigits={lastDigits}
                      tickBuffer={tickBufferRef.current}
                      digitPressure={digitPressure}
                      signalScore={signalScore}
                      signalDetails={signalDetails}
                    />
                  </AnalysisPaywall>
                )}

                {/* Sign in prompt */}
                {!isLoggedIn && (
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Wallet className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Connect to Trade</p>
                        <p className="text-xs text-muted-foreground">Link your Deriv account to start automated trading.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Session stats */}
                {session.totalTrades > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {[
                      { label: "Win Rate", value: `${winRate}%`, color: "text-buy" },
                      { label: "Total P/L", value: `${session.totalProfit >= 0 ? "+" : ""}${session.totalProfit.toFixed(2)}`, color: session.totalProfit >= 0 ? "text-buy" : "text-sell" },
                      { label: "Trades", value: session.totalTrades.toString(), color: "text-foreground" },
                      { label: "Max DD", value: `${session.maxDrawdown.toFixed(1)}%`, color: "text-sell" },
                      ...(softwareStatus === "ACTIVE" ? [{ label: "TPS", value: tradesPerSecond.toString(), color: tradesPerSecond > 0 ? "text-primary" : "text-muted-foreground" }] : []),
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
              {MARKET_CATEGORIES.map((cat) => (
                <optgroup key={cat.category} label={cat.category}>
                  {cat.markets.map((m) => (<option key={m.symbol} value={m.symbol}>{m.label}</option>))}
                </optgroup>
              ))}
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
            <div className="mt-1 grid grid-cols-2 gap-1">
              {(["aggressive", "balanced", "conservative", "elit", "brain"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => { setStrategyProfile(p); userTouchedRisk.current = true; }}
                  className={`py-1.5 text-[10px] font-medium rounded transition-all capitalize ${
                    strategyProfile === p
                      ? p === "aggressive" ? "bg-sell/20 text-sell border border-sell/30"
                      : p === "balanced" ? "bg-warning/20 text-warning border border-warning/30"
                      : p === "elit" ? "bg-warning/30 text-warning border border-warning/40 font-bold"
                      : p === "brain" ? "bg-primary/30 text-primary border border-primary/40 font-bold"
                      : "bg-buy/20 text-buy border border-buy/30"
                      : "bg-secondary text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {p === "aggressive" ? "🟥" : p === "balanced" ? "🟨" : p === "elit" ? "⚡" : p === "brain" ? "🧠" : "🟩"} {p === "elit" ? "ELIT" : p === "brain" ? "Brain" : p}
                </button>
              ))}
            </div>
            {strategyProfile === "brain" && (
              <div className="mt-2 p-2 rounded-lg bg-buy/5 border border-buy/20 space-y-1.5">
                <p className="text-[9px] text-buy font-bold flex items-center gap-1">
                  🧠 Adaptive UNDER 8 / OVER 2 — strict entry triggers + self-learning
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-muted-foreground font-semibold">Recovery:</span>
                  {(["digit", "evenodd"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => { setRecoveryModeState(m); derivBrain.setRecoveryMode(m); }}
                      className={`flex-1 px-2 py-1 rounded text-[10px] font-bold transition-colors border ${
                        recoveryMode === m
                          ? "bg-buy text-primary-foreground border-buy"
                          : "bg-secondary text-muted-foreground border-border hover:border-buy/40"
                      }`}
                    >
                      {m === "digit" ? "Digit Recovery" : "Even/Odd Recovery"}
                    </button>
                  ))}
                </div>
              </div>
            )}
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
                    if ((val === "Fast" || val === "Turbo") && !isPremium && !isAdmin) {
                      setPremiumFeature("High-Speed Execution Mode");
                      setShowPremiumModal(true);
                      return;
                    }
                    setExecutionSpeed(val as "Normal" | "Fast" | "Turbo");
                  }}
                  className="mt-1 w-full px-3 py-2 bg-secondary border border-border rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="Turbo">🚀 Turbo (5 trades/sec) {!isPremium && !isAdmin ? "🔒" : ""}</option>
                  <option value="Fast">⚡ Fast (1 trade/sec) {!isPremium && !isAdmin ? "🔒" : ""}</option>
                  <option value="Normal">🐢 Normal (4s interval)</option>
                </select>
              </div>

              {/* Bulk Trade Mode */}
              <div className="p-3 rounded-lg bg-secondary/50 border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                    <Flame className="w-3 h-3 text-sell" /> Trade Mode
                  </label>
                  <button
                    onClick={() => setBulkMode(!bulkMode)}
                    className={`px-3 py-1 text-[10px] font-bold rounded-full transition-all ${
                      bulkMode ? "bg-sell/20 text-sell border border-sell/30" : "bg-secondary text-muted-foreground border border-border"
                    }`}
                  >
                    {bulkMode ? `Bulk (${bulkCount})` : "Single"}
                  </button>
                </div>
                {bulkMode && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">Trades/tick:</span>
                    <input
                      type="number"
                      value={bulkCount}
                      onChange={(e) => setBulkCount(Math.max(2, Math.min(10, parseInt(e.target.value) || 2)))}
                      min="2"
                      max="10"
                      className="w-14 px-2 py-1 bg-secondary border border-border rounded text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <span className="text-[8px] text-muted-foreground">2–10</span>
                  </div>
                )}
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

      {/* Floating transaction + profit icons */}
      <div className="fixed bottom-32 lg:bottom-8 right-4 flex flex-col items-end gap-3 z-30">
        <button
          onClick={() => setShowTransactions(!showTransactions)}
          className="w-14 h-14 rounded-full bg-card border-2 border-border shadow-xl flex items-center justify-center hover:bg-secondary transition-colors hover:scale-110"
          title="Transactions"
        >
          <Wallet className="w-6 h-6 text-primary" />
        </button>
        <div className="flex items-center gap-1.5">
          <motion.div
            key={session.totalProfit}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className={`px-4 py-2 rounded-full text-sm font-bold shadow-xl tabular-nums ${session.totalProfit >= 0 ? "bg-buy text-primary-foreground" : "bg-sell text-primary-foreground"}`}
          >
            {session.totalProfit >= 0 ? "+" : ""}{session.totalProfit.toFixed(2)}
          </motion.div>
          <button
            onClick={() => {
              setSession({ totalTrades: 0, wins: 0, losses: 0, totalProfit: 0, peakBalance: 0, maxDrawdown: 0, startBalance: 0, largestStake: 0, maxLossStreak: 0 });
              setTransactions([]);
              try {
                Object.keys(localStorage).forEach((k) => {
                  if (k.startsWith("dnx_transactions") || k === "dnx_session") {
                    localStorage.removeItem(k);
                  }
                });
              } catch {}
              toast({ title: "🗑 History cleared", description: "Profit & transaction history reset" });
            }}
            className="w-9 h-9 rounded-full bg-card border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors flex items-center justify-center shadow"
            title="Clear profit & history"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Premium Upgrade Modal */}
      <PremiumUpgradeModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        featureName={premiumFeature}
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
                  <input type="number" value={takeProfit} onChange={(e) => { setTakeProfit(e.target.value); userTouchedRisk.current = true; }} className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm text-foreground" />
                </FormField>
                <FormField label="Stop Loss" hint="Maximum loss limit.">
                  <input type="number" value={stopLoss} onChange={(e) => { setStopLoss(e.target.value); userTouchedRisk.current = true; }} className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm text-foreground" />
                </FormField>
                <FormField label="Trading Method" hint="Stakelist or martingale.">
                  <select value={martingale ? "Martingale" : "Flat"} onChange={(e) => setMartingale(e.target.value === "Martingale")} className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm text-foreground">
                    <option>Flat</option><option>Martingale</option>
                  </select>
                </FormField>
                {martingale && (
                  <>
                    <FormField label="Martingale Multiplier" hint="Multiplier on loss.">
                      <input type="number" value={martingaleMultiplier} onChange={(e) => { setMartingaleMultiplier(e.target.value); userTouchedRisk.current = true; }} step="0.1" className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm text-foreground" />
                    </FormField>
                    <FormField label="Max Martingale Level" hint="Max consecutive multiplications.">
                      <input type="number" value={maxMartingaleSteps} onChange={(e) => setMaxMartingaleSteps(parseInt(e.target.value) || 3)} className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm text-foreground" />
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
                      ["Strategy:", strategyProfile === "elit" ? "⚡ ELIT" : strategyProfile],
                      ["Martingale:", martingaleMultiplier],
                      ["Take Profit:", takeProfit],
                      ["Stop Loss:", stopLoss],
                      ["Market:", marketLabel],
                      ["Speed:", executionSpeed === "Turbo" ? "Turbo (5/sec)" : executionSpeed === "Fast" ? "Fast (1/sec)" : "Normal (4s)"],
                      ["Smart Risker:", smartRisker ? "On" : "Off"],
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

      {/* Strategy Guide Booklet */}
      <StrategyBooklet />
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
