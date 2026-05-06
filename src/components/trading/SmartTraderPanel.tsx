import { useCallback, useEffect, useRef, useState } from "react";
import { Activity, Zap, Gauge, Radar } from "lucide-react";
import DerivWebSocket from "@/services/deriv-websocket";
import type { DerivAccount } from "@/services/deriv-auth";
import { DIGIT_BARRIERS, getLastDigit } from "@/lib/trading-constants";
import { aiLogger } from "@/services/ai-logger";
import { tradeLock } from "@/services/trade-lock";
import { derivBrain } from "@/services/deriv-brain";
import { toast } from "@/hooks/use-toast";

const SMART_MARKETS = [
  { symbol: "1HZ10V", label: "Volatility 10 (1s)" },
  { symbol: "1HZ25V", label: "Volatility 25 (1s)" },
  { symbol: "1HZ50V", label: "Volatility 50 (1s)" },
  { symbol: "1HZ75V", label: "Volatility 75 (1s)" },
  { symbol: "1HZ100V", label: "Volatility 100 (1s)" },
];

const SMART_CONTRACTS = ["DIGITUNDER", "DIGITOVER", "DIGITMATCH", "DIGITDIFF", "CALL", "PUT", "HIGHER", "LOWER", "ONETOUCH", "NOTOUCH"];

const SmartTraderPanel = ({ ws, account, selectedMarket, onMarketChange, onLogin, embedded = false }: {
  ws: DerivWebSocket | null;
  account: DerivAccount | null;
  selectedMarket: string;
  onMarketChange: (market: string) => void;
  onLogin: () => void;
  embedded?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const [market, setMarket] = useState(selectedMarket || "1HZ100V");
  const [contractType, setContractType] = useState("DIGITOVER");
  const [basis, setBasis] = useState<"stake" | "payout">("stake");
  const [amount, setAmount] = useState("3.00");
  const [duration, setDuration] = useState(1);
  const [durationUnit, setDurationUnit] = useState<"t" | "s">("t");
  const [barrier, setBarrier] = useState("5");
  const [manualBarrier, setManualBarrier] = useState(false);
  const [proposalId, setProposalId] = useState<string | null>(null);
  const [proposalStatus, setProposalStatus] = useState("Waiting for proposal…");
  const [payout, setPayout] = useState<number | null>(null);
  const [latestQuote, setLatestQuote] = useState<number | null>(null);
  const [result, setResult] = useState<{ entry?: number; exit?: number; profit?: number; status: string } | null>(null);
  const [speedMode, setSpeedMode] = useState<boolean>(() => {
    try { return localStorage.getItem("dnx_smarttrader_speed") === "1"; } catch { return false; }
  });
  useEffect(() => { try { localStorage.setItem("dnx_smarttrader_speed", speedMode ? "1" : "0"); } catch {} }, [speedMode]);
  const [latency, setLatency] = useState<{ proposal: number | null; firstTick: number | null; buy: number | null }>({ proposal: null, firstTick: null, buy: null });
  const [lockout, setLockout] = useState(false);
  const [digits, setDigits] = useState<number[]>([]);
  const [signal, setSignal] = useState<any>(null);
  const executing = useRef(false);
  const clickStampRef = useRef<number>(0);
  const buyStampRef = useRef<number>(0);

  const needsDigitBarrier = contractType.startsWith("DIGIT") && !["DIGITEVEN", "DIGITODD"].includes(contractType);
  const needsPriceBarrier = ["HIGHER", "LOWER", "ONETOUCH", "NOTOUCH"].includes(contractType);
  const isConnected = !!account;

  const validAmount = /^\d+(\.\d{0,2})?$/.test(amount) && Number(amount) > 0;
  const normalizedContract = contractType === "DIGITDIFF" ? "DIGITDIFFERS" : contractType;

  useEffect(() => {
    if (!ws) return;
    setMarket(selectedMarket);
    const unsub = ws.on("tick", (data) => {
      const quote = data.tick?.quote;
      if (typeof quote === "number") {
        setLatestQuote(quote);
        const d = getLastDigit(quote);
        setDigits((prev) => {
          const next = [...prev.slice(-499), d];
          try { setSignal(derivBrain.getEntrySignal(next, quote)); } catch {}
          return next;
        });
        if (needsPriceBarrier && !manualBarrier) {
          const offset = Math.max(0.01, Math.abs(quote) * 0.0002);
          setBarrier((contractType === "LOWER" || contractType === "NOTOUCH" ? quote - offset : quote + offset).toFixed(2));
        }
      }
    });
    return () => { unsub(); };
  }, [ws, selectedMarket, contractType, needsPriceBarrier, manualBarrier]);

  const requestProposal = useCallback(() => {
    if (!ws || !isConnected || !validAmount) return;
    setProposalStatus("Requesting proposal…");
    setProposalId(null);
    clickStampRef.current = performance.now();
    ws.getProposal({
      amount: Number(amount),
      basis,
      contractType: normalizedContract,
      symbol: market,
      duration,
      durationUnit,
      ...((needsDigitBarrier || needsPriceBarrier) && { barrier }),
    });
    aiLogger.log("System", "info", `SmartTrader proposal → ${normalizedContract} ${market}`);
  }, [ws, isConnected, validAmount, amount, basis, normalizedContract, market, duration, durationUnit, needsDigitBarrier, needsPriceBarrier, barrier]);

  useEffect(() => {
    if (!ws || !isConnected) return;
    const debounce = speedMode ? 0 : 250;
    const timer = setTimeout(requestProposal, debounce);
    const unsub = ws.on("proposal", (data) => {
      if (data.proposal) {
        setProposalId(data.proposal.id);
        setPayout(Number(data.proposal.payout));
        if (clickStampRef.current) {
          setLatency((l) => ({ ...l, proposal: Math.round(performance.now() - clickStampRef.current) }));
        }
        setProposalStatus(`Ready • payout ${Number(data.proposal.payout).toFixed(2)} USD`);
      }
      if (data.error) setProposalStatus(data.error.message || "Proposal blocked");
    });
    return () => { clearTimeout(timer); unsub(); };
  }, [ws, isConnected, requestProposal, speedMode]);

  const changeMarket = (next: string) => {
    setMarket(next);
    onMarketChange(next);
    setProposalId(null);
    setResult(null);
    try { ws?.unsubscribeTicks(market); ws?.subscribeTicks(next); } catch {}
    aiLogger.log("System", "info", `SmartTrader market changed → ${next}; analysis reset`);
  };

  const execute = useCallback(() => {
    if (!ws || !proposalId || executing.current || !validAmount || lockout) return;
    if (!tradeLock.tryAcquire("System")) return;
    executing.current = true;
    setLockout(true);
    setProposalStatus("Buying contract…");
    const entry = latestQuote;
    buyStampRef.current = performance.now();
    setLatency((l) => ({ ...l, buy: null, firstTick: null }));
    ws.buyContract(proposalId, Number(amount));
    aiLogger.log("System", "success", `SmartTrader buy → ${normalizedContract} ${market}${speedMode ? " [SPEED]" : ""}`);
    const unsubBuy = ws.on("buy", (data) => {
      if (data.error) {
        setProposalStatus(data.error.message || "Buy failed");
        executing.current = false;
        setLockout(false);
        tradeLock.release("System");
        unsubBuy();
        return;
      }
      if (data.buy?.contract_id) {
        setLatency((l) => ({ ...l, buy: Math.round(performance.now() - buyStampRef.current) }));
        ws.subscribeOpenContract();
        const id = String(data.buy.contract_id);
        let firstTickSeen = false;
        const unsubPoc = ws.on("proposal_open_contract", (pocData) => {
          const poc = pocData.proposal_open_contract;
          if (!poc || String(poc.contract_id) !== id) return;
          if (!firstTickSeen) {
            firstTickSeen = true;
            setLatency((l) => ({ ...l, firstTick: Math.round(performance.now() - buyStampRef.current) }));
          }
          if (!poc.is_sold) return;
          const profit = Number(poc.profit || 0);
          setResult({ entry: entry ?? undefined, exit: poc.exit_tick, profit, status: profit > 0 ? "won" : "lost" });
          setProposalStatus(`Closed • ${profit >= 0 ? "+" : ""}${profit.toFixed(2)} USD`);
          toast({ title: profit > 0 ? "SmartTrader won" : "SmartTrader lost", description: `${profit >= 0 ? "+" : ""}${profit.toFixed(2)} USD` });
          executing.current = false;
          setLockout(false);
          tradeLock.release("System");
          unsubPoc();
          requestProposal();
        });
      }
      unsubBuy();
    });
  }, [ws, proposalId, validAmount, lockout, latestQuote, amount, normalizedContract, market, speedMode, requestProposal]);

  useEffect(() => {
    if (!ws || !isConnected) return;
    const interval = speedMode ? 600 : 1200;
    const refresh = setInterval(() => requestProposal(), interval);
    return () => clearInterval(refresh);
  }, [ws, isConnected, requestProposal, speedMode]);

  const recoveryConfluence = signal ? Math.min(100, Math.round(signal.unifiedScore * 1.05)) : 0;
  const baseConfluence = signal?.unifiedScore ?? 0;

  const content = (
    <div className="p-4 rounded-xl bg-card/95 border border-border shadow-lg space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-primary" /><h3 className="text-sm font-bold text-foreground">SmartTrader</h3></div>
        <div className="flex items-center gap-2 text-[10px]">
          <button onClick={() => setSpeedMode((s) => !s)} className={`px-2 py-1 rounded-full font-bold flex items-center gap-1 ${speedMode ? "bg-buy text-primary-foreground" : "bg-secondary text-muted-foreground"}`}><Gauge className="w-3 h-3" />{speedMode ? "Speed ON" : "Speed Mode"}</button>
          <span className="text-muted-foreground">{latestQuote ? `${latestQuote} • d${getLastDigit(latestQuote)}` : "Live"}</span>
        </div>
      </div>

      {/* Latency meter */}
      <div className="grid grid-cols-3 gap-2">
        {[
          ["Proposal", latency.proposal, "ms"],
          ["Buy ack", latency.buy, "ms"],
          ["1st tick", latency.firstTick, "ms"],
        ].map(([label, val, unit]) => (
          <div key={String(label)} className="rounded-lg bg-secondary/50 border border-border p-2">
            <p className="text-[8px] uppercase text-muted-foreground font-bold">{String(label)}</p>
            <p className="text-xs text-foreground font-semibold mt-1">{val == null ? "—" : `${val} ${unit}`}</p>
          </div>
        ))}
      </div>

      {/* Unified Confluence Inspector */}
      <div className="rounded-lg bg-secondary/40 border border-border p-3 space-y-2">
        <div className="flex items-center gap-2"><Radar className="w-3 h-3 text-primary" /><p className="text-[10px] font-bold text-foreground uppercase">Unified Confluence Inspector</p></div>
        <div className="grid grid-cols-4 gap-2">
          {[
            ["Pattern Radar", signal?.radarScore ?? 0],
            ["Digit Flow", signal?.flowScore ?? 0],
            ["DXP / Inv.", signal?.dxpScore ?? 0],
            ["Combined", signal?.unifiedScore ?? 0],
          ].map(([label, val]) => (
            <div key={String(label)} className="rounded bg-card border border-border p-1.5">
              <p className="text-[8px] text-muted-foreground">{String(label)}</p>
              <p className="text-xs text-foreground font-bold">{val}%</p>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between text-[10px]">
          <span className={`px-2 py-0.5 rounded-full font-bold ${baseConfluence >= 75 ? "bg-buy/15 text-buy" : "bg-secondary text-muted-foreground"}`}>Base entry: {baseConfluence}%</span>
          <span className={`px-2 py-0.5 rounded-full font-bold ${recoveryConfluence >= 80 ? "bg-warning/15 text-warning" : "bg-secondary text-muted-foreground"}`}>Recovery: {recoveryConfluence}%</span>
        </div>
        {signal?.seq && (
          <ul className="mt-2 space-y-1 text-[10px] leading-snug">
            <li className="flex items-start gap-1.5"><span className="text-primary font-bold mt-0.5">•</span><span><b className="text-foreground">Pattern Radar {signal.radarScore}%:</b> <span className="text-muted-foreground">low-run {signal.seq.lowRun} / high-run {signal.seq.highRun} {(signal.seq.lowRun >= 4 || signal.seq.highRun >= 4) ? "↑ strong streak" : "↓ no streak"}; flip-rate {Math.round(signal.seq.flipRate)}% {signal.seq.flipRate <= 60 ? "↑ stable" : "↓ chaotic"}; tail-bias {(signal.seq.last8and9Frac*100).toFixed(0)}/{(signal.seq.last0and1Frac*100).toFixed(0)}%.</span></span></li>
            <li className="flex items-start gap-1.5"><span className="text-primary font-bold mt-0.5">•</span><span><b className="text-foreground">Digit Flow {signal.flowScore}%:</b> <span className="text-muted-foreground">last 20 → {signal.seq.below5InLast20}× &lt;5 vs {signal.seq.above4InLast20}× &gt;4 {Math.max(signal.seq.below5InLast20, signal.seq.above4InLast20) >= 14 ? "↑ directional pressure" : "↓ balanced"}.</span></span></li>
            <li className="flex items-start gap-1.5"><span className="text-primary font-bold mt-0.5">•</span><span><b className="text-foreground">DXP / Inverted {signal.dxpScore}%:</b> <span className="text-muted-foreground">peak frequency deviation {Math.max(...(signal.freq||[10]).map((p:number)=>Math.abs(p-10))).toFixed(1)}pp from 10% baseline {signal.dxpScore >= 60 ? "↑ exploitable skew" : "↓ near uniform"}.</span></span></li>
            <li className="flex items-start gap-1.5"><span className="text-foreground font-bold mt-0.5">▸</span><span><b className="text-foreground">Combined {signal.unifiedScore}%</b> <span className="text-muted-foreground">= 45% confluence + 20% flow + 20% radar + 15% DXP. {baseConfluence >= 75 ? "✅ Base ready" : `Needs +${75-baseConfluence}% for base`}; {recoveryConfluence >= 80 ? "✅ Recovery ready" : `+${Math.max(0,80-recoveryConfluence)}% for recovery`}.</span></span></li>
          </ul>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Field label="Market"><select value={market} onChange={(e) => changeMarket(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary">{SMART_MARKETS.map((m) => <option key={m.symbol} value={m.symbol}>{m.label}</option>)}</select></Field>
        <Field label="Contract"><select value={contractType} onChange={(e) => { setContractType(e.target.value); setManualBarrier(false); }} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary">{SMART_CONTRACTS.map((c) => <option key={c} value={c}>{c.replace("DIGIT", "Digit ")}</option>)}</select></Field>
        <Field label={basis === "stake" ? "Stake" : "Payout"}><input value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary" inputMode="decimal" /></Field>
        <Field label="Basis"><button onClick={() => setBasis(basis === "stake" ? "payout" : "stake")} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary text-left">{basis === "stake" ? "Stake Mode" : "Payout Mode"}</button></Field>
        <Field label="Duration"><div className="flex gap-2"><input type="number" min={1} max={durationUnit === "t" ? 10 : 60} value={duration} onChange={(e) => setDuration(Number(e.target.value) || 1)} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary" /><select value={durationUnit} onChange={(e) => setDurationUnit(e.target.value as "t" | "s")} className="w-24 px-3 py-2 rounded-lg bg-secondary border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"><option value="t">Ticks</option><option value="s">Seconds</option></select></div></Field>
        {(needsDigitBarrier || needsPriceBarrier) && <Field label="Barrier">{needsDigitBarrier ? <select value={barrier} onChange={(e) => setBarrier(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary">{DIGIT_BARRIERS.map((d) => <option key={d}>{d}</option>)}</select> : <input value={barrier} onChange={(e) => { setManualBarrier(true); setBarrier(e.target.value); }} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />}</Field>}
        <div className="sm:col-span-2 lg:col-span-2 rounded-lg bg-secondary/50 border border-border p-3 min-h-16">
          <p className="text-[10px] text-muted-foreground">Contract Summary Preview</p>
          <p className="text-xs text-foreground font-semibold mt-1">{normalizedContract} • {market} • {duration}{durationUnit} • {basis} {amount}</p>
          <p className="text-[10px] text-primary mt-1">{proposalStatus}{lockout ? " • lockout" : ""}</p>
          {result && <p className={`text-xs font-bold mt-1 ${result.profit && result.profit >= 0 ? "text-buy" : "text-sell"}`}>Last result: {result.status} {result.profit?.toFixed(2)} USD</p>}
        </div>
      </div>
      {!isConnected ? <button onClick={onLogin} className="w-full py-3 rounded-lg bg-primary text-primary-foreground text-sm font-bold">Connect to Trade</button> : <button onClick={execute} disabled={!proposalId || executing.current || !validAmount || lockout} className="w-full py-3 rounded-lg bg-buy text-primary-foreground text-sm font-bold disabled:opacity-50">{lockout ? "Locked — order in flight" : "TRADE NOW"}</button>}
    </div>
  );

  if (embedded) return content;
  return <><button onClick={() => setOpen(true)} className="lg:hidden fixed bottom-44 left-4 z-40 h-14 px-5 rounded-full bg-primary text-primary-foreground font-bold text-xs shadow-xl flex items-center gap-2"><Activity className="w-4 h-4" /> Trade</button><div className="hidden lg:block sticky bottom-0 z-10">{content}</div>{open && <div className="lg:hidden fixed inset-0 z-50 bg-background/70 backdrop-blur-sm" onClick={() => setOpen(false)}><div className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-2xl" onClick={(e) => e.stopPropagation()}>{content}<button onClick={() => setOpen(false)} className="w-full py-3 text-xs text-muted-foreground bg-card border-t border-border">Close</button></div></div>}</>;
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => <label className="block"><span className="text-[10px] text-muted-foreground font-medium">{label}</span><div className="mt-1">{children}</div></label>;

export default SmartTraderPanel;
