import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, SkipForward, RotateCcw, FlaskConical, Target,
  TrendingUp, TrendingDown, AlertTriangle, Save, FolderOpen,
  ChevronDown, BarChart3, Zap, Shield, Activity, Check, X
} from "lucide-react";
import { DEFAULT_BRAIN_THRESHOLDS, loadBrainThresholds, saveBrainThresholds } from "@/services/brain-settings";

const DERIV_WS_URL = "wss://ws.derivws.com/websockets/v3";
const APP_ID = "129344";

const LAB_MARKETS = [
  { symbol: "R_10", label: "Volatility 10" },
  { symbol: "R_25", label: "Volatility 25" },
  { symbol: "R_50", label: "Volatility 50" },
  { symbol: "R_75", label: "Volatility 75" },
  { symbol: "R_100", label: "Volatility 100" },
  { symbol: "JD_10", label: "Jump 10" },
  { symbol: "JD_25", label: "Jump 25" },
  { symbol: "JD_50", label: "Jump 50" },
  { symbol: "JD_75", label: "Jump 75" },
  { symbol: "JD_100", label: "Jump 100" },
];

const CONTRACT_OPTIONS = [
  { type: "odd", label: "Odd", check: (d: number) => d % 2 !== 0 },
  { type: "even", label: "Even", check: (d: number) => d % 2 === 0 },
  { type: "over4", label: "Over 4", check: (d: number) => d > 4 },
  { type: "under5", label: "Under 5", check: (d: number) => d < 5 },
  { type: "rise", label: "Rise", check: (_d: number, _i: number, ticks: number[]) => false },
  { type: "fall", label: "Fall", check: (_d: number, _i: number, ticks: number[]) => false },
];

interface StrategyConfig {
  market: string;
  contractType: string;
  stake: number;
  duration: number;
  conditions: {
    oddDominance: boolean;
    oddThreshold: number;
    evenDominance: boolean;
    evenThreshold: number;
    digitStreak: boolean;
    streakMin: number;
    highVolatility: boolean;
    digitImbalance: boolean;
    momentumShift: boolean;
  };
}

interface SimTrade {
  index: number;
  digit: number;
  outcome: "win" | "loss";
  stake: number;
  payout: number;
  profit: number;
  balance: number;
  conditionsMet: string[];
}

interface SimResults {
  trades: SimTrade[];
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalProfit: number;
  totalLoss: number;
  netResult: number;
  maxDrawdown: number;
  maxWinStreak: number;
  maxLossStreak: number;
  strategyScore: number;
  finalBalance: number;
}

interface SavedStrategy {
  name: string;
  config: StrategyConfig;
  timestamp: number;
}

const defaultConfig: StrategyConfig = {
  market: "R_75",
  contractType: "odd",
  stake: 5,
  duration: 1,
  conditions: {
    oddDominance: false, oddThreshold: 60,
    evenDominance: false, evenThreshold: 60,
    digitStreak: false, streakMin: 2,
    highVolatility: false,
    digitImbalance: false,
    momentumShift: false,
  },
};

const StrategyLab = () => {
  const [config, setConfig] = useState<StrategyConfig>(defaultConfig);
  const [tickData, setTickData] = useState<number[]>([]);
  const [priceData, setPriceData] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [playback, setPlayback] = useState<"idle" | "playing" | "paused" | "done">("idle");
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(50);
  const [results, setResults] = useState<SimResults | null>(null);
  const [savedStrategies, setSavedStrategies] = useState<SavedStrategy[]>(() => {
    try { return JSON.parse(localStorage.getItem("dnx_strategies") || "[]"); } catch { return []; }
  });
  const [saveName, setSaveName] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [brainThresholds, setBrainThresholds] = useState(() => loadBrainThresholds());
  const playbackRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Load historical ticks
  const loadTicks = useCallback(() => {
    setLoading(true);
    setTickData([]);
    setPriceData([]);
    setResults(null);
    setPlayback("idle");
    setPlaybackIndex(0);

    const socket = new WebSocket(`${DERIV_WS_URL}?app_id=${APP_ID}`);
    wsRef.current = socket;
    const ticks: number[] = [];
    const prices: number[] = [];

    socket.onopen = () => {
      socket.send(JSON.stringify({ ticks: config.market, subscribe: 1 }));
    };

    socket.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.tick && typeof data.tick.quote === "number") {
          const q = data.tick.quote;
          const qStr = q.toString();
          const digit = parseInt(qStr.charAt(qStr.length - 1), 10);
          ticks.push(digit);
          prices.push(q);
          if (ticks.length >= 5000) {
            socket.close();
            setTickData(ticks);
            setPriceData(prices);
            setLoading(false);
          } else if (ticks.length % 100 === 0) {
            setTickData([...ticks]);
            setPriceData([...prices]);
          }
        }
      } catch {}
    };

    socket.onclose = () => {
      if (ticks.length > 0 && ticks.length < 5000) {
        setTickData([...ticks]);
        setPriceData([...prices]);
      }
      setLoading(false);
    };
    socket.onerror = () => setLoading(false);
  }, [config.market]);

  // Cleanup
  useEffect(() => () => {
    wsRef.current?.close();
    if (playbackRef.current) clearInterval(playbackRef.current);
  }, []);

  // Run simulation
  const runSimulation = useCallback(() => {
    if (tickData.length < 100) return;
    
    const trades: SimTrade[] = [];
    let balance = 1000;
    let peakBalance = 1000;
    let maxDrawdown = 0;
    let winStreak = 0, lossStreak = 0, maxWin = 0, maxLoss = 0;
    const contractDef = CONTRACT_OPTIONS.find(c => c.type === config.contractType);
    const payoutRate = 0.95;

    for (let i = 50; i < tickData.length - config.duration; i++) {
      // Check conditions
      const conditionsMet: string[] = [];
      const window = tickData.slice(Math.max(0, i - 50), i);

      if (config.conditions.oddDominance) {
        const oddPct = (window.filter(d => d % 2 !== 0).length / window.length) * 100;
        if (oddPct >= config.conditions.oddThreshold) conditionsMet.push("Odd>" + config.conditions.oddThreshold + "%");
        else continue;
      }
      if (config.conditions.evenDominance) {
        const evenPct = (window.filter(d => d % 2 === 0).length / window.length) * 100;
        if (evenPct >= config.conditions.evenThreshold) conditionsMet.push("Even>" + config.conditions.evenThreshold + "%");
        else continue;
      }
      if (config.conditions.digitStreak) {
        let streak = 1;
        for (let j = i - 1; j > Math.max(0, i - 10); j--) {
          if (tickData[j] === tickData[j - 1]) streak++; else break;
        }
        if (streak >= config.conditions.streakMin) conditionsMet.push("Streak x" + streak);
        else continue;
      }
      if (config.conditions.highVolatility) {
        if (priceData.length > i) {
          const recentPrices = priceData.slice(Math.max(0, i - 20), i);
          let vol = 0;
          for (let j = 1; j < recentPrices.length; j++) vol += Math.abs(recentPrices[j] - recentPrices[j - 1]);
          const avgVol = recentPrices.length > 1 ? vol / (recentPrices.length - 1) : 0;
          if (avgVol * 1000 >= 50) conditionsMet.push("HighVol");
          else continue;
        }
      }
      if (config.conditions.digitImbalance) {
        const freq = new Array(10).fill(0);
        window.forEach(d => freq[d]++);
        const maxDev = Math.max(...freq.map(c => Math.abs((c / window.length) * 100 - 10)));
        if (maxDev >= 5) conditionsMet.push("Imbalance");
        else continue;
      }
      if (config.conditions.momentumShift) {
        if (i >= 50) {
          const recent = tickData.slice(i - 25, i);
          const older = tickData.slice(i - 50, i - 25);
          const rOdd = recent.filter(x => x % 2 !== 0).length;
          const oOdd = older.filter(x => x % 2 !== 0).length;
          if (Math.abs(rOdd - oOdd) >= 3) conditionsMet.push("Momentum");
          else continue;
        }
      }

      // No conditions selected = trade every tick
      const hasActiveCondition = Object.values(config.conditions).some(v => v === true);
      if (hasActiveCondition && conditionsMet.length === 0) continue;

      // Determine outcome
      const resultDigit = tickData[i + config.duration - 1];
      let won = false;

      if (config.contractType === "rise" && priceData.length > i + config.duration) {
        won = priceData[i + config.duration - 1] > priceData[i];
      } else if (config.contractType === "fall" && priceData.length > i + config.duration) {
        won = priceData[i + config.duration - 1] < priceData[i];
      } else if (contractDef) {
        won = contractDef.check(resultDigit, i, []);
      }

      const payout = won ? config.stake * payoutRate : 0;
      const profit = won ? payout : -config.stake;
      balance += profit;
      peakBalance = Math.max(peakBalance, balance);
      const dd = peakBalance > 0 ? ((peakBalance - balance) / peakBalance) * 100 : 0;
      maxDrawdown = Math.max(maxDrawdown, dd);

      if (won) { winStreak++; lossStreak = 0; maxWin = Math.max(maxWin, winStreak); }
      else { lossStreak++; winStreak = 0; maxLoss = Math.max(maxLoss, lossStreak); }

      trades.push({
        index: i, digit: resultDigit, outcome: won ? "win" : "loss",
        stake: config.stake, payout, profit, balance,
        conditionsMet,
      });

      // Skip ahead by duration to avoid overlapping trades
      i += config.duration - 1;
    }

    const wins = trades.filter(t => t.outcome === "win").length;
    const losses = trades.filter(t => t.outcome === "loss").length;
    const totalProfit = trades.filter(t => t.profit > 0).reduce((s, t) => s + t.profit, 0);
    const totalLoss = Math.abs(trades.filter(t => t.profit < 0).reduce((s, t) => s + t.profit, 0));
    const winRate = trades.length > 0 ? (wins / trades.length) * 100 : 0;
    const netResult = totalProfit - totalLoss;

    // Strategy score
    const wrScore = Math.min(winRate * 1.2, 40);
    const ddScore = Math.max(20 - maxDrawdown * 0.5, 0);
    const profitScore = netResult > 0 ? Math.min(netResult / 10, 20) : 0;
    const consistencyScore = maxLoss <= 3 ? 20 : maxLoss <= 5 ? 10 : 0;
    const strategyScore = Math.min(Math.round(wrScore + ddScore + profitScore + consistencyScore), 100);

    setResults({
      trades, totalTrades: trades.length, wins, losses, winRate,
      totalProfit, totalLoss, netResult, maxDrawdown, maxWinStreak: maxWin,
      maxLossStreak: maxLoss, strategyScore, finalBalance: balance,
    });
  }, [tickData, priceData, config]);

  // Playback controls
  const startPlayback = () => {
    if (!results || results.trades.length === 0) return;
    setPlayback("playing");
    setPlaybackIndex(0);
    if (playbackRef.current) clearInterval(playbackRef.current);
    let idx = 0;
    playbackRef.current = setInterval(() => {
      idx++;
      if (idx >= results.trades.length) {
        if (playbackRef.current) clearInterval(playbackRef.current);
        setPlayback("done");
        setPlaybackIndex(results.trades.length - 1);
        return;
      }
      setPlaybackIndex(idx);
    }, Math.max(10, 200 - playbackSpeed * 2));
  };

  const pausePlayback = () => {
    setPlayback("paused");
    if (playbackRef.current) clearInterval(playbackRef.current);
  };

  const stepForward = () => {
    if (!results) return;
    setPlaybackIndex(prev => Math.min(prev + 1, results.trades.length - 1));
  };

  const resetPlayback = () => {
    setPlayback("idle");
    setPlaybackIndex(0);
    if (playbackRef.current) clearInterval(playbackRef.current);
  };

  // Save/Load
  const saveStrategy = () => {
    if (!saveName.trim()) return;
    const newS: SavedStrategy = { name: saveName.trim(), config: { ...config }, timestamp: Date.now() };
    const updated = [...savedStrategies, newS];
    setSavedStrategies(updated);
    localStorage.setItem("dnx_strategies", JSON.stringify(updated));
    setSaveName("");
    setShowSaveModal(false);
  };

  const loadStrategy = (s: SavedStrategy) => {
    setConfig(s.config);
    setShowLoadModal(false);
    setResults(null);
    setPlayback("idle");
  };

  const deleteStrategy = (idx: number) => {
    const updated = savedStrategies.filter((_, i) => i !== idx);
    setSavedStrategies(updated);
    localStorage.setItem("dnx_strategies", JSON.stringify(updated));
  };

  const updateCondition = (key: keyof StrategyConfig["conditions"], value: boolean | number) => {
    setConfig(prev => ({ ...prev, conditions: { ...prev.conditions, [key]: value } }));
  };

  const updateBrainThreshold = (key: keyof typeof brainThresholds, value: number) => {
    const next = { ...brainThresholds, [key]: value };
    setBrainThresholds(next);
    saveBrainThresholds(next);
  };

  const scoreLabel = (s: number) => s >= 80 ? "Excellent Strategy" : s >= 60 ? "Strong Strategy" : s >= 40 ? "Moderately Strong" : s >= 20 ? "Needs Improvement" : "Weak Strategy";
  const scoreColor = (s: number) => s >= 60 ? "text-buy" : s >= 40 ? "text-warning" : "text-sell";

  const visibleTrades = results ? results.trades.slice(0, playback !== "idle" ? playbackIndex + 1 : results.trades.length) : [];

  return (
    <div className="p-4 lg:p-6 overflow-y-auto h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Strategy Lab</h2>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            Simulation Only
          </span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowLoadModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary text-foreground hover:bg-muted transition-colors">
            <FolderOpen className="w-3 h-3" /> My Strategies
          </button>
          <button onClick={() => setShowSaveModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
            <Save className="w-3 h-3" /> Save
          </button>
        </div>
      </div>

      {/* Config Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Market + Contract Selection */}
        <div className="p-4 rounded-xl bg-card border border-border space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" /> Strategy Configuration
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-muted-foreground font-medium">Market</label>
              <select value={config.market} onChange={e => setConfig(p => ({ ...p, market: e.target.value }))}
                className="mt-1 w-full px-3 py-2 bg-secondary border border-border rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                {LAB_MARKETS.map(m => <option key={m.symbol} value={m.symbol}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground font-medium">Contract Type</label>
              <select value={config.contractType} onChange={e => setConfig(p => ({ ...p, contractType: e.target.value }))}
                className="mt-1 w-full px-3 py-2 bg-secondary border border-border rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                {CONTRACT_OPTIONS.map(c => <option key={c.type} value={c.type}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground font-medium">Stake ($)</label>
              <input type="number" value={config.stake} min={1} onChange={e => setConfig(p => ({ ...p, stake: Number(e.target.value) || 1 }))}
                className="mt-1 w-full px-3 py-2 bg-secondary border border-border rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground font-medium">Duration (ticks)</label>
              <input type="number" value={config.duration} min={1} max={10} onChange={e => setConfig(p => ({ ...p, duration: Number(e.target.value) || 1 }))}
                className="mt-1 w-full px-3 py-2 bg-secondary border border-border rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={loadTicks} disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {loading ? <><Activity className="w-3 h-3 animate-spin" /> Collecting Ticks...</> : <><Zap className="w-3 h-3" /> Load {tickData.length > 0 ? "New " : ""}Data</>}
            </button>
            <button onClick={runSimulation} disabled={tickData.length < 100}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-buy/10 text-buy border border-buy/30 hover:bg-buy/20 disabled:opacity-50 transition-colors">
              <Play className="w-3 h-3" /> Run Simulation
            </button>
          </div>
          {tickData.length > 0 && (
            <p className="text-[10px] text-muted-foreground text-center">{tickData.length} ticks loaded • {LAB_MARKETS.find(m => m.symbol === config.market)?.label}</p>
          )}
        </div>

        <div className="p-4 rounded-xl bg-card border border-border space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" /> Brain Sequence Thresholds
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {([
              ["runLength", "Low/High Run"], ["parityRunLength", "Even/Odd Run"], ["flipRateMax", "Max Flip %"], ["recentWindow", "Last-N"],
              ["deepWindow", "Deep Buffer"], ["tradeScore", "Trade Score"], ["waitScore", "Wait Score"], ["recoveryScore", "Recovery Score"],
            ] as const).map(([key, label]) => (
              <div key={key}>
                <label className="text-[10px] text-muted-foreground font-medium">{label}</label>
                <input type="number" value={brainThresholds[key]} onChange={(e) => updateBrainThreshold(key, Number(e.target.value) || DEFAULT_BRAIN_THRESHOLDS[key])}
                  className="mt-1 w-full px-3 py-2 bg-secondary border border-border rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground">Applies immediately to Brain entries, recovery readiness, and live Decision Feed scoring.</p>
        </div>

        {/* Entry Conditions */}
        <div className="p-4 rounded-xl bg-card border border-border space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" /> Entry Conditions
          </h3>
          <p className="text-[10px] text-muted-foreground">All enabled conditions must be met before a trade is placed. Leave all off to trade every tick.</p>
          <div className="space-y-2">
            {/* Odd Dominance */}
            <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
              <button onClick={() => updateCondition("oddDominance", !config.conditions.oddDominance)}
                className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${config.conditions.oddDominance ? "bg-primary border-primary" : "border-border"}`}>
                {config.conditions.oddDominance && <Check className="w-3 h-3 text-primary-foreground" />}
              </button>
              <span className="text-xs text-foreground flex-1">Odd Dominance ≥</span>
              <input type="number" value={config.conditions.oddThreshold} min={51} max={90}
                onChange={e => updateCondition("oddThreshold", Number(e.target.value))}
                className="w-14 px-2 py-1 bg-background border border-border rounded text-xs text-foreground text-center" />
              <span className="text-[10px] text-muted-foreground">%</span>
            </div>
            {/* Even Dominance */}
            <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
              <button onClick={() => updateCondition("evenDominance", !config.conditions.evenDominance)}
                className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${config.conditions.evenDominance ? "bg-primary border-primary" : "border-border"}`}>
                {config.conditions.evenDominance && <Check className="w-3 h-3 text-primary-foreground" />}
              </button>
              <span className="text-xs text-foreground flex-1">Even Dominance ≥</span>
              <input type="number" value={config.conditions.evenThreshold} min={51} max={90}
                onChange={e => updateCondition("evenThreshold", Number(e.target.value))}
                className="w-14 px-2 py-1 bg-background border border-border rounded text-xs text-foreground text-center" />
              <span className="text-[10px] text-muted-foreground">%</span>
            </div>
            {/* Digit Streak */}
            <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
              <button onClick={() => updateCondition("digitStreak", !config.conditions.digitStreak)}
                className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${config.conditions.digitStreak ? "bg-primary border-primary" : "border-border"}`}>
                {config.conditions.digitStreak && <Check className="w-3 h-3 text-primary-foreground" />}
              </button>
              <span className="text-xs text-foreground flex-1">Digit Streak ≥</span>
              <input type="number" value={config.conditions.streakMin} min={2} max={10}
                onChange={e => updateCondition("streakMin", Number(e.target.value))}
                className="w-14 px-2 py-1 bg-background border border-border rounded text-xs text-foreground text-center" />
            </div>
            {/* Simple toggles */}
            {[
              { key: "highVolatility" as const, label: "High Volatility" },
              { key: "digitImbalance" as const, label: "Digit Imbalance" },
              { key: "momentumShift" as const, label: "Momentum Shift" },
            ].map(c => (
              <div key={c.key} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50">
                <button onClick={() => updateCondition(c.key, !config.conditions[c.key])}
                  className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${config.conditions[c.key] ? "bg-primary border-primary" : "border-border"}`}>
                  {config.conditions[c.key] && <Check className="w-3 h-3 text-primary-foreground" />}
                </button>
                <span className="text-xs text-foreground">{c.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tick Stream Visualization */}
      {tickData.length > 0 && (
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" /> Tick Stream
            </h3>
            <span className="text-[10px] text-muted-foreground">{tickData.length} ticks</span>
          </div>
          <div className="flex flex-wrap gap-1 max-h-20 overflow-hidden">
            {tickData.slice(-200).map((d, i) => (
              <span key={i} className={`w-5 h-5 rounded text-[9px] font-bold flex items-center justify-center ${d % 2 === 0 ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning"}`}>
                {d}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Playback Controls */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
            <button onClick={startPlayback} disabled={playback === "playing"} className="p-2 rounded-lg bg-buy/10 text-buy hover:bg-buy/20 disabled:opacity-50"><Play className="w-4 h-4" /></button>
            <button onClick={pausePlayback} disabled={playback !== "playing"} className="p-2 rounded-lg bg-secondary text-foreground hover:bg-muted disabled:opacity-50"><Pause className="w-4 h-4" /></button>
            <button onClick={stepForward} className="p-2 rounded-lg bg-secondary text-foreground hover:bg-muted"><SkipForward className="w-4 h-4" /></button>
            <button onClick={resetPlayback} className="p-2 rounded-lg bg-secondary text-foreground hover:bg-muted"><RotateCcw className="w-4 h-4" /></button>
            <div className="flex-1 flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">Speed:</span>
              <input type="range" min={10} max={100} value={playbackSpeed} onChange={e => setPlaybackSpeed(Number(e.target.value))}
                className="flex-1 h-1 accent-primary" />
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">
              {playback !== "idle" ? `${playbackIndex + 1}/${results.trades.length}` : `${results.trades.length} trades`}
            </span>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {[
              { label: "Total Trades", value: results.totalTrades, color: "text-foreground" },
              { label: "Win Rate", value: `${results.winRate.toFixed(1)}%`, color: results.winRate >= 50 ? "text-buy" : "text-sell" },
              { label: "Net Result", value: `$${results.netResult.toFixed(2)}`, color: results.netResult >= 0 ? "text-buy" : "text-sell" },
              { label: "Max Drawdown", value: `${results.maxDrawdown.toFixed(1)}%`, color: "text-sell" },
              { label: "Max Win Streak", value: results.maxWinStreak, color: "text-buy" },
              { label: "Max Loss Streak", value: results.maxLossStreak, color: "text-sell" },
            ].map(s => (
              <div key={s.label} className="p-3 rounded-xl bg-card border border-border text-center">
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Strategy Score + Trade Timeline */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Strategy Score */}
            <div className="p-4 rounded-xl bg-card border border-border">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" /> Strategy Efficiency Score
              </h3>
              <div className="flex items-center gap-4">
                <div className="relative w-24 h-24">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="40" fill="none" strokeWidth="8" className="stroke-secondary" />
                    <motion.circle cx="50" cy="50" r="40" fill="none" strokeWidth="8"
                      strokeDasharray={`${results.strategyScore * 2.51} 251`}
                      className={results.strategyScore >= 60 ? "stroke-buy" : results.strategyScore >= 40 ? "stroke-warning" : "stroke-sell"}
                      strokeLinecap="round"
                      initial={{ strokeDasharray: "0 251" }}
                      animate={{ strokeDasharray: `${results.strategyScore * 2.51} 251` }}
                      transition={{ duration: 1 }}
                    />
                  </svg>
                  <span className={`absolute inset-0 flex items-center justify-center text-xl font-bold ${scoreColor(results.strategyScore)}`}>
                    {results.strategyScore}
                  </span>
                </div>
                <div>
                  <p className={`text-sm font-bold ${scoreColor(results.strategyScore)}`}>{scoreLabel(results.strategyScore)}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {results.netResult >= 0 ? "Strategy shows positive expectancy." : "Strategy shows negative expectancy — consider adjusting conditions."}
                  </p>
                </div>
              </div>
            </div>

            {/* Trade Timeline */}
            <div className="p-4 rounded-xl bg-card border border-border">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" /> Trade Timeline
              </h3>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                {visibleTrades.map((t, i) => (
                  <motion.span
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={`w-5 h-5 rounded text-[9px] font-bold flex items-center justify-center ${t.outcome === "win" ? "bg-buy/20 text-buy" : "bg-sell/20 text-sell"}`}
                  >
                    {t.outcome === "win" ? "W" : "L"}
                  </motion.span>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
                <span>Wins: <span className="text-buy font-bold">{results.wins}</span></span>
                <span>Losses: <span className="text-sell font-bold">{results.losses}</span></span>
              </div>
            </div>
          </div>

          {/* Optimization Suggestions */}
          <div className="p-4 rounded-xl bg-card border border-border">
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" /> Optimization Suggestions
            </h3>
            <div className="space-y-1.5">
              {results.winRate < 55 && (
                <p className="text-xs text-muted-foreground">• Increase entry threshold conditions to filter out weak signals and improve win rate.</p>
              )}
              {results.maxDrawdown > 20 && (
                <p className="text-xs text-muted-foreground">• Consider reducing stake during high volatility periods to control drawdown.</p>
              )}
              {results.maxLossStreak > 5 && (
                <p className="text-xs text-muted-foreground">• Long loss streaks detected. Add a cooldown period after consecutive losses.</p>
              )}
              {results.netResult < 0 && (
                <p className="text-xs text-muted-foreground">• Strategy shows negative expectancy. Try combining multiple conditions for stronger entry signals.</p>
              )}
              {results.winRate >= 55 && results.netResult > 0 && (
                <p className="text-xs text-muted-foreground">• Strategy shows promise. Consider testing on different markets to validate consistency.</p>
              )}
              {results.strategyScore >= 70 && (
                <p className="text-xs text-buy font-medium">• ✅ Strong strategy detected! Save it and consider applying to live trading after further validation.</p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Save Modal */}
      <AnimatePresence>
        {showSaveModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm" onClick={() => setShowSaveModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-card border border-border rounded-xl p-6 w-80 shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-sm font-bold text-foreground mb-3">Save Strategy</h3>
              <input value={saveName} onChange={e => setSaveName(e.target.value)} placeholder="Strategy name..."
                className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm text-foreground mb-3 focus:outline-none focus:ring-1 focus:ring-primary" />
              <div className="flex gap-2">
                <button onClick={saveStrategy} className="flex-1 px-3 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg">Save</button>
                <button onClick={() => setShowSaveModal(false)} className="flex-1 px-3 py-2 bg-secondary text-foreground text-xs rounded-lg">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Load Modal */}
      <AnimatePresence>
        {showLoadModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm" onClick={() => setShowLoadModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-card border border-border rounded-xl p-6 w-96 max-h-[60vh] shadow-2xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-sm font-bold text-foreground mb-3">My Strategies</h3>
              {savedStrategies.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No saved strategies yet.</p>
              ) : (
                <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                  {savedStrategies.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 border border-border">
                      <div className="flex-1">
                        <p className="text-xs font-bold text-foreground">{s.name}</p>
                        <p className="text-[10px] text-muted-foreground">{s.config.contractType} • {LAB_MARKETS.find(m => m.symbol === s.config.market)?.label} • ${s.config.stake}</p>
                      </div>
                      <button onClick={() => loadStrategy(s)} className="px-2 py-1 text-[10px] bg-primary/10 text-primary rounded hover:bg-primary/20">Load</button>
                      <button onClick={() => deleteStrategy(i)} className="p-1 text-sell hover:bg-sell/10 rounded"><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              )}
              <button onClick={() => setShowLoadModal(false)} className="mt-3 w-full px-3 py-2 bg-secondary text-foreground text-xs rounded-lg">Close</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StrategyLab;
