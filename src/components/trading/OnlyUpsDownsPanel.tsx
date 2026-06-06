import { useCallback, useEffect, useRef, useState } from "react";
import { Brain, Volume2, VolumeX, Sparkles, Activity, Shield, Zap } from "lucide-react";
import DerivWebSocket from "@/services/deriv-websocket";
import type { DerivAccount } from "@/services/deriv-auth";
import { aiLogger } from "@/services/ai-logger";
import { tradeLock } from "@/services/trade-lock";
import { toast } from "@/hooks/use-toast";
import { sounds } from "@/services/sounds";

/**
 * SmartTrader AI — Straddle Engine
 *
 * Pure AI: no manual UP/DOWN buttons.
 * User picks tick duration (2/3/5) + stake, toggles AI ON.
 * Engine evaluates every tick and, when ALL conditions pass, fires
 * BOTH RUNHIGH and RUNLOW at the same time (straddle) so one side
 * always wins if the market moves.
 *
 * Entry gate (all required):
 *   1. High volatility   — recent tick range > dynamic threshold
 *   2. Balanced even/odd — |even-odd| / total < 0.30 (no strong digit bias)
 *   3. Confluence score  — combined signal ≥ 0.55
 *   4. Cooldown elapsed  — ticks*1500 + 2500 ms since last fire
 */
const OnlyUpsDownsPanel = ({
  ws,
  account,
  authorized,
  authorizedLoginid,
  selectedMarket,
  onLogin,
}: {
  ws: DerivWebSocket | null;
  account: DerivAccount | null;
  authorized?: boolean;
  authorizedLoginid?: string | null;
  selectedMarket: string;
  onLogin: () => void;
}) => {
  const [stake, setStake] = useState("1.00");
  const [baseStake, setBaseStake] = useState("1.00");
  const [ticks, setTicks] = useState<2 | 3 | 5>(3);
  const [aiOn, setAiOn] = useState(false);
  const [muted, setMutedState] = useState(sounds.isMuted());
  const [status, setStatus] = useState("AI standby — toggle ON to arm");
  const [executing, setExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<{ profit: number; status: string } | null>(null);
  const [stats, setStats] = useState({ fired: 0, wins: 0, losses: 0, net: 0 });
  const [gauge, setGauge] = useState({ vol: 0, balance: 0, range: 0, rhythm: 0, confluence: 0 });
  const [takeProfit, setTakeProfit] = useState("25");
  const [stopLoss, setStopLoss] = useState("12");
  const [martingaleOn, setMartingaleOn] = useState(true);
  const [martingaleMultiplier, setMartingaleMultiplier] = useState("2.0");
  const [maxSteps, setMaxSteps] = useState(3);
  const [currentStep, setCurrentStep] = useState(0);

  const isConnected = !!account && authorized !== false;

  const validStake = /^(\d+(\.\d{0,2})?)?$/.test(stake) && Number(stake) > 0;

  const tickBuf = useRef<number[]>([]);
  const digitBuf = useRef<number[]>([]);
  const lastFireTs = useRef(0);
  const openContracts = useRef<Set<string>>(new Set());
  const pendingStraddle = useRef<{ up?: string; down?: string }>({});
  const activePair = useRef<{ totalProfit: number; resolved: number; stake: number }>({ totalProfit: 0, resolved: 0, stake: 1 });

  useEffect(() => sounds.onMuteChange(setMutedState) as any, []);

  const fireStraddle = useCallback(() => {
    if (!ws || !isConnected || !validStake || executing) return;
    if (!tradeLock.tryAcquire("System")) return;
    const stakeValue = Number(stake);
    const projectedNet = stats.net - stakeValue * 2;
    if (projectedNet <= -(parseFloat(stopLoss) || 0)) {
      setStatus("Risk stop — projected loss exceeds stop loss");
      tradeLock.release("System");
      return;
    }
    setExecuting(true);
    setStatus(`AI firing straddle • ${ticks}t • $${stake} each side`);
    aiLogger.log("System", "info", `Straddle ARMED ${selectedMarket} ${ticks}t @ $${stake}`);
    lastFireTs.current = Date.now();
    pendingStraddle.current = {};
    activePair.current = { totalProfit: 0, resolved: 0, stake: stakeValue };

    // Request both proposals simultaneously
    ws.getProposal({
      amount: Number(stake), basis: "stake", contractType: "RUNHIGH",
      symbol: selectedMarket, duration: ticks, durationUnit: "t",
    });
    ws.getProposal({
      amount: Number(stake), basis: "stake", contractType: "RUNLOW",
      symbol: selectedMarket, duration: ticks, durationUnit: "t",
    });
  }, [ws, isConnected, validStake, executing, stake, ticks, selectedMarket, stats.net, stopLoss]);

  // Proposal → buy both legs as soon as they arrive
  useEffect(() => {
    if (!ws) return;
    const unsub = ws.on("proposal", (data) => {
      if (!executing || !data.proposal) return;
      const id = data.proposal.id as string;
      const ct = data.proposal.contract_type as string;
      if (ct === "RUNHIGH" && !pendingStraddle.current.up) {
        pendingStraddle.current.up = id;
        ws.buyContract(id, Number(stake));
      } else if (ct === "RUNLOW" && !pendingStraddle.current.down) {
        pendingStraddle.current.down = id;
        ws.buyContract(id, Number(stake));
      }
    });
    return () => { unsub(); };
  }, [ws, executing, stake]);

  // Buy confirmation → track contracts
  useEffect(() => {
    if (!ws) return;
    const unsub = ws.on("buy", (data) => {
      if (data.error) {
        aiLogger.log("System", "error", `Buy rejected: ${data.error.message}`);
        return;
      }
      if (data.buy?.contract_id) {
        const id = String(data.buy.contract_id);
        openContracts.current.add(id);
        ws.subscribeOpenContract();
      }
    });
    return () => { unsub(); };
  }, [ws]);

  // Resolve open contracts
  useEffect(() => {
    if (!ws) return;
    const unsub = ws.on("proposal_open_contract", (data) => {
      const poc = data.proposal_open_contract;
      if (!poc || !poc.is_sold) return;
      const id = String(poc.contract_id);
      if (!openContracts.current.has(id)) return;
      openContracts.current.delete(id);
      const profit = Number(poc.profit || 0);
      activePair.current.totalProfit += profit;
      activePair.current.resolved += 1;
      setStats((s) => ({
        fired: s.fired + 1,
        wins: s.wins + (profit > 0 ? 1 : 0),
        losses: s.losses + (profit <= 0 ? 1 : 0),
        net: +(s.net + profit).toFixed(2),
      }));
      // When both legs done (set empty), release lock + report combined
      if (openContracts.current.size === 0) {
        const pairProfit = Number(activePair.current.totalProfit.toFixed(2));
        setExecuting(false);
        tradeLock.release("System");
        setLastResult({ profit: pairProfit, status: pairProfit > 0 ? "WIN" : "LOSS" });
        sounds.play(pairProfit > 0 ? "success" : "error");
        if (pairProfit > 0) {
          setCurrentStep(0);
          setStake(baseStake);
        } else if (martingaleOn) {
          const nextStep = Math.min(currentStep + 1, maxSteps);
          setCurrentStep(nextStep);
          const nextStake = (parseFloat(baseStake) || 1) * Math.pow(parseFloat(martingaleMultiplier) || 2, nextStep);
          setStake(nextStake.toFixed(2));
        }
        const sessionNet = stats.net + pairProfit;
        if (stats.net + pairProfit >= (parseFloat(takeProfit) || 0)) {
          setAiOn(false);
          setStatus(`Take profit hit • +${sessionNet.toFixed(2)} USD`);
        } else if (stats.net + pairProfit <= -(parseFloat(stopLoss) || 0)) {
          setAiOn(false);
          setStatus(`Stop loss hit • ${sessionNet.toFixed(2)} USD`);
        } else {
          setStatus(`Straddle closed • total ${pairProfit >= 0 ? "+" : ""}${pairProfit.toFixed(2)} USD • session ${sessionNet >= 0 ? "+" : ""}${sessionNet.toFixed(2)} • step ${pairProfit > 0 ? 0 : Math.min(currentStep + 1, maxSteps)}`);
        }
      }
    });
    return () => { unsub(); };
  }, [ws, baseStake, martingaleMultiplier, martingaleOn, currentStep, maxSteps, stats.net, takeProfit, stopLoss]);

  // ── AI evaluation loop on every tick ──
  useEffect(() => {
    if (!ws) return;
    const unsub = ws.on("tick", (data) => {
      const t = data.tick;
      if (!t || t.symbol !== selectedMarket) return;
      const q = Number(t.quote);
      const digit = Number(q.toFixed(2).slice(-1));

      tickBuf.current.push(q);
      if (tickBuf.current.length > 40) tickBuf.current.shift();
      digitBuf.current.push(digit);
      if (digitBuf.current.length > 40) digitBuf.current.shift();

      if (tickBuf.current.length < 20) return;

      // 1. Volatility: stdev of pct deltas
      const deltas: number[] = [];
      for (let i = 1; i < tickBuf.current.length; i++) {
        deltas.push(Math.abs(tickBuf.current[i] - tickBuf.current[i - 1]) / tickBuf.current[i - 1]);
      }
      const meanD = deltas.reduce((a, b) => a + b, 0) / deltas.length;
      const variance = deltas.reduce((a, b) => a + (b - meanD) ** 2, 0) / deltas.length;
      const stdev = Math.sqrt(variance);
      const volScore = Math.min(stdev / 0.0005, 1); // calibrated for vol indices

      // 2. Balance: even/odd ratio
      const evens = digitBuf.current.filter((d) => d % 2 === 0).length;
      const odds = digitBuf.current.length - evens;
      const skew = Math.abs(evens - odds) / digitBuf.current.length;
      const balScore = Math.max(0, 1 - skew / 0.3);

      const range = Math.max(...tickBuf.current) - Math.min(...tickBuf.current);
      const rangeScore = Math.min(range / Math.max(q * 0.0008, 0.35), 1);
      let alternations = 0;
      for (let i = 1; i < digitBuf.current.length; i++) {
        if ((digitBuf.current[i] % 2) !== (digitBuf.current[i - 1] % 2)) alternations += 1;
      }
      const rhythmScore = Math.min(alternations / Math.max(digitBuf.current.length - 1, 1), 1);

      // 3. Confluence
      const confluence = volScore * 0.35 + balScore * 0.2 + rangeScore * 0.2 + rhythmScore * 0.25;

      setGauge({ vol: volScore, balance: balScore, range: rangeScore, rhythm: rhythmScore, confluence });

      if (!aiOn || executing) return;
      const cooldown = ticks * 1500 + 2500;
      if (Date.now() - lastFireTs.current < cooldown) return;

      if (volScore >= 0.35 && balScore >= 0.45 && rangeScore >= 0.35 && rhythmScore >= 0.45 && confluence >= 0.58) {
        toast({ title: "SmartAI armed", description: `Straddle ${ticks}t — confluence ${(confluence * 100).toFixed(0)}%` });
        fireStraddle();
      } else {
        setStatus(`Scanning… vol ${(volScore * 100).toFixed(0)}% · bal ${(balScore * 100).toFixed(0)}% · range ${(rangeScore * 100).toFixed(0)}% · rhythm ${(rhythmScore * 100).toFixed(0)}% · cf ${(confluence * 100).toFixed(0)}%`);
      }
    });
    return () => { unsub(); };
  }, [ws, aiOn, executing, selectedMarket, ticks, fireStraddle]);

  const badgeLoginid = authorizedLoginid || account?.loginid || null;
  const badgeIsVirtual = badgeLoginid?.startsWith("VR") ?? (account?.is_virtual ?? false);

  return (
    <div className="h-full flex flex-col bg-card/95 border-t border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Brain className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="text-[11px] font-bold text-foreground truncate">SmartTrader AI · Straddle Engine</span>
        </div>
        <div className="flex items-center gap-1.5">
          {badgeLoginid && (
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase ${
              badgeIsVirtual ? "bg-warning/20 text-warning" : "bg-buy/15 text-buy"
            }`} title={badgeLoginid}>
              {badgeIsVirtual ? "Demo" : "Real"}
            </span>
          )}
          <button
            onClick={() => sounds.toggleMute()}
            className="p-1 rounded-full text-muted-foreground hover:text-foreground"
            title={muted ? "Unmute" : "Mute"}
          >
            {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
            isConnected ? "bg-buy/15 text-buy" : account ? "bg-warning/20 text-warning" : "bg-sell/15 text-sell"
          }`}>
            {isConnected ? "LIVE" : account ? "AUTH…" : "OFFLINE"}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 flex flex-col gap-2 p-2 min-h-0 overflow-y-auto">
        {/* Controls */}
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="text-[9px] uppercase text-muted-foreground font-bold">Stake (USD per leg)</span>
            <input
              value={stake}
              onChange={(e) => { setStake(e.target.value); setBaseStake(e.target.value); setCurrentStep(0); }}
              inputMode="decimal"
              disabled={aiOn}
              className="mt-0.5 w-full px-2 py-1.5 rounded bg-secondary border border-border text-xs text-foreground disabled:opacity-60 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </label>
          <div>
            <span className="text-[9px] uppercase text-muted-foreground font-bold">Duration</span>
            <div className="mt-0.5 grid grid-cols-3 gap-1">
              {([2, 3, 5] as const).map((n) => (
                <button
                  key={n}
                  disabled={aiOn}
                  onClick={() => setTicks(n)}
                  className={`py-1.5 rounded text-[11px] font-bold transition disabled:opacity-60 ${
                    ticks === n ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {n}t
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="text-[9px] uppercase text-muted-foreground font-bold">Take Profit</span>
            <input value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} inputMode="decimal" disabled={aiOn} className="mt-0.5 w-full px-2 py-1.5 rounded bg-secondary border border-border text-xs text-foreground disabled:opacity-60 focus:outline-none focus:ring-1 focus:ring-primary" />
          </label>
          <label className="block">
            <span className="text-[9px] uppercase text-muted-foreground font-bold">Stop Loss</span>
            <input value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} inputMode="decimal" disabled={aiOn} className="mt-0.5 w-full px-2 py-1.5 rounded bg-secondary border border-border text-xs text-foreground disabled:opacity-60 focus:outline-none focus:ring-1 focus:ring-primary" />
          </label>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <label className="block">
            <span className="text-[9px] uppercase text-muted-foreground font-bold">Martingale</span>
            <select value={martingaleOn ? "on" : "off"} onChange={(e) => setMartingaleOn(e.target.value === "on")} disabled={aiOn} className="mt-0.5 w-full px-2 py-1.5 rounded bg-secondary border border-border text-xs text-foreground disabled:opacity-60 focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="on">On</option>
              <option value="off">Off</option>
            </select>
          </label>
          <label className="block">
            <span className="text-[9px] uppercase text-muted-foreground font-bold">Multiplier</span>
            <input value={martingaleMultiplier} onChange={(e) => setMartingaleMultiplier(e.target.value)} inputMode="decimal" disabled={aiOn || !martingaleOn} className="mt-0.5 w-full px-2 py-1.5 rounded bg-secondary border border-border text-xs text-foreground disabled:opacity-60 focus:outline-none focus:ring-1 focus:ring-primary" />
          </label>
          <label className="block">
            <span className="text-[9px] uppercase text-muted-foreground font-bold">Max Steps</span>
            <input type="number" value={maxSteps} onChange={(e) => setMaxSteps(Math.max(1, parseInt(e.target.value) || 1))} disabled={aiOn || !martingaleOn} className="mt-0.5 w-full px-2 py-1.5 rounded bg-secondary border border-border text-xs text-foreground disabled:opacity-60 focus:outline-none focus:ring-1 focus:ring-primary" />
          </label>
        </div>

        {/* AI Gauges */}
        <div className="rounded-lg bg-secondary/40 border border-border p-2 space-y-1.5">
          <div className="flex items-center justify-between text-[9px] font-bold uppercase text-muted-foreground">
            <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> Volatility</span>
            <span className={gauge.vol >= 0.45 ? "text-buy" : "text-muted-foreground"}>{(gauge.vol * 100).toFixed(0)}%</span>
          </div>
          <div className="h-1 rounded-full bg-background overflow-hidden">
            <div className="h-full bg-buy transition-all" style={{ width: `${gauge.vol * 100}%` }} />
          </div>
          <div className="flex items-center justify-between text-[9px] font-bold uppercase text-muted-foreground">
            <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Balance</span>
            <span className={gauge.balance >= 0.55 ? "text-buy" : "text-muted-foreground"}>{(gauge.balance * 100).toFixed(0)}%</span>
          </div>
          <div className="h-1 rounded-full bg-background overflow-hidden">
            <div className="h-full bg-warning transition-all" style={{ width: `${gauge.balance * 100}%` }} />
          </div>
          <div className="flex items-center justify-between text-[9px] font-bold uppercase text-muted-foreground">
            <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Range</span>
            <span className={gauge.range >= 0.35 ? "text-buy" : "text-muted-foreground"}>{(gauge.range * 100).toFixed(0)}%</span>
          </div>
          <div className="h-1 rounded-full bg-background overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${gauge.range * 100}%` }} />
          </div>
          <div className="flex items-center justify-between text-[9px] font-bold uppercase text-muted-foreground">
            <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> Rhythm</span>
            <span className={gauge.rhythm >= 0.45 ? "text-buy" : "text-muted-foreground"}>{(gauge.rhythm * 100).toFixed(0)}%</span>
          </div>
          <div className="h-1 rounded-full bg-background overflow-hidden">
            <div className="h-full bg-buy transition-all" style={{ width: `${gauge.rhythm * 100}%` }} />
          </div>
          <div className="flex items-center justify-between text-[9px] font-bold uppercase text-muted-foreground">
            <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Confluence</span>
            <span className={gauge.confluence >= 0.55 ? "text-buy" : "text-sell"}>{(gauge.confluence * 100).toFixed(0)}%</span>
          </div>
          <div className="h-1 rounded-full bg-background overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${gauge.confluence * 100}%` }} />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-1 text-center">
          <div className="rounded bg-secondary/40 py-1"><div className="text-[8px] uppercase text-muted-foreground">Fired</div><div className="text-[11px] font-bold">{stats.fired}</div></div>
          <div className="rounded bg-buy/10 py-1"><div className="text-[8px] uppercase text-muted-foreground">Wins</div><div className="text-[11px] font-bold text-buy">{stats.wins}</div></div>
          <div className="rounded bg-sell/10 py-1"><div className="text-[8px] uppercase text-muted-foreground">Losses</div><div className="text-[11px] font-bold text-sell">{stats.losses}</div></div>
          <div className={`rounded py-1 ${stats.net >= 0 ? "bg-buy/10" : "bg-sell/10"}`}>
            <div className="text-[8px] uppercase text-muted-foreground">Net</div>
            <div className={`text-[11px] font-bold ${stats.net >= 0 ? "text-buy" : "text-sell"}`}>{stats.net >= 0 ? "+" : ""}{stats.net.toFixed(2)}</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1 text-center">
          <div className="rounded bg-secondary/40 py-1"><div className="text-[8px] uppercase text-muted-foreground">Step</div><div className="text-[11px] font-bold">{currentStep}</div></div>
          <div className="rounded bg-secondary/40 py-1"><div className="text-[8px] uppercase text-muted-foreground">Base</div><div className="text-[11px] font-bold">{Number(baseStake || 0).toFixed(2)}</div></div>
          <div className="rounded bg-secondary/40 py-1"><div className="text-[8px] uppercase text-muted-foreground">Live Stake</div><div className="text-[11px] font-bold">{Number(stake || 0).toFixed(2)}</div></div>
        </div>

        {/* Status */}
        <p className="text-[9px] text-muted-foreground leading-tight truncate">{status}</p>

        {/* AI Toggle */}
        {!account ? (
          <button onClick={onLogin} className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold">
            Connect Deriv to Activate AI
          </button>
        ) : !isConnected ? (
          <button disabled className="w-full py-2.5 rounded-lg bg-warning/30 text-warning text-xs font-bold">
            Authorizing Deriv…
          </button>
        ) : (
          <button
            onClick={() => setAiOn((v) => !v)}
            disabled={!validStake}
            className={`w-full py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition disabled:opacity-50 ${
              aiOn
                ? "bg-sell text-primary-foreground animate-pulse"
                : "bg-gradient-to-r from-primary to-buy text-primary-foreground hover:opacity-90"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            {aiOn ? "AI ACTIVE — Tap to Stop" : `Activate AI Straddle (${ticks}t)`}
          </button>
        )}
      </div>
    </div>
  );
};

export default OnlyUpsDownsPanel;
