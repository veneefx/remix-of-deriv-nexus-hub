import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Activity, RefreshCw, Zap } from "lucide-react";
import DerivWebSocket from "@/services/deriv-websocket";
import type { DerivAccount } from "@/services/deriv-auth";
import { DIGIT_BARRIERS, getLastDigit } from "@/lib/trading-constants";
import { aiLogger } from "@/services/ai-logger";
import { tradeLock } from "@/services/trade-lock";
import { toast } from "@/hooks/use-toast";

const SMART_MARKETS = [
  { symbol: "1HZ10V", label: "Volatility 10 (1s)" },
  { symbol: "1HZ25V", label: "Volatility 25 (1s)" },
  { symbol: "1HZ50V", label: "Volatility 50 (1s)" },
  { symbol: "1HZ75V", label: "Volatility 75 (1s)" },
  { symbol: "1HZ100V", label: "Volatility 100 (1s)" },
];

const SMART_CONTRACTS = ["DIGITUNDER", "DIGITOVER", "DIGITMATCH", "DIGITDIFF", "CALL", "PUT", "HIGHER", "LOWER", "ONETOUCH", "NOTOUCH"];

const SmartTraderPanel = ({ ws, account, selectedMarket, onMarketChange, onLogin }: {
  ws: DerivWebSocket | null;
  account: DerivAccount | null;
  selectedMarket: string;
  onMarketChange: (market: string) => void;
  onLogin: () => void;
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
  const executing = useRef(false);
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
    const timer = setTimeout(requestProposal, 250);
    const unsub = ws.on("proposal", (data) => {
      if (data.proposal) {
        setProposalId(data.proposal.id);
        setPayout(Number(data.proposal.payout));
        setProposalStatus(`Ready • payout ${Number(data.proposal.payout).toFixed(2)} USD`);
      }
      if (data.error) setProposalStatus(data.error.message || "Proposal blocked");
    });
    return () => { clearTimeout(timer); unsub(); };
  }, [ws, isConnected, requestProposal]);

  const changeMarket = (next: string) => {
    setMarket(next);
    onMarketChange(next);
    setProposalId(null);
    setResult(null);
    try { ws?.unsubscribeTicks(market); ws?.subscribeTicks(next); } catch {}
    aiLogger.log("System", "info", `SmartTrader market changed → ${next}; analysis reset`);
  };

  const execute = () => {
    if (!ws || !proposalId || executing.current || !validAmount) return;
    if (!tradeLock.tryAcquire("System")) return;
    executing.current = true;
    setProposalStatus("Buying contract…");
    const entry = latestQuote;
    ws.buyContract(proposalId, Number(amount));
    aiLogger.log("System", "success", `SmartTrader buy → ${normalizedContract} ${market}`);
    const unsubBuy = ws.on("buy", (data) => {
      if (data.error) {
        setProposalStatus(data.error.message || "Buy failed");
        executing.current = false;
        tradeLock.release("System");
        unsubBuy();
        return;
      }
      if (data.buy?.contract_id) {
        ws.subscribeOpenContract();
        const id = String(data.buy.contract_id);
        const unsubPoc = ws.on("proposal_open_contract", (pocData) => {
          const poc = pocData.proposal_open_contract;
          if (!poc || String(poc.contract_id) !== id || !poc.is_sold) return;
          const profit = Number(poc.profit || 0);
          setResult({ entry: entry ?? undefined, exit: poc.exit_tick, profit, status: profit > 0 ? "won" : "lost" });
          setProposalStatus(`Closed • ${profit >= 0 ? "+" : ""}${profit.toFixed(2)} USD`);
          toast({ title: profit > 0 ? "SmartTrader won" : "SmartTrader lost", description: `${profit >= 0 ? "+" : ""}${profit.toFixed(2)} USD` });
          executing.current = false;
          tradeLock.release("System");
          unsubPoc();
          requestProposal();
        });
      }
      unsubBuy();
    });
  };

  const content = (
    <div className="p-4 rounded-xl bg-card/95 border border-border shadow-lg space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-primary" /><h3 className="text-sm font-bold text-foreground">SmartTrader</h3></div>
        <span className="text-[10px] text-muted-foreground">{latestQuote ? `${latestQuote} • digit ${getLastDigit(latestQuote)}` : "Live proposal"}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Field label="Market"><select value={market} onChange={(e) => changeMarket(e.target.value)} className="input-smart">{SMART_MARKETS.map((m) => <option key={m.symbol} value={m.symbol}>{m.label}</option>)}</select></Field>
        <Field label="Contract"><select value={contractType} onChange={(e) => { setContractType(e.target.value); setManualBarrier(false); }} className="input-smart">{SMART_CONTRACTS.map((c) => <option key={c} value={c}>{c.replace("DIGIT", "Digit ")}</option>)}</select></Field>
        <Field label={basis === "stake" ? "Stake" : "Payout"}><input value={amount} onChange={(e) => setAmount(e.target.value)} className="input-smart" inputMode="decimal" /></Field>
        <Field label="Basis"><button onClick={() => setBasis(basis === "stake" ? "payout" : "stake")} className="input-smart text-left">{basis === "stake" ? "Stake Mode" : "Payout Mode"}</button></Field>
        <Field label="Duration"><div className="flex gap-2"><input type="number" min={1} max={durationUnit === "t" ? 10 : 60} value={duration} onChange={(e) => setDuration(Number(e.target.value) || 1)} className="input-smart" /><select value={durationUnit} onChange={(e) => setDurationUnit(e.target.value as "t" | "s")} className="input-smart w-24"><option value="t">Ticks</option><option value="s">Seconds</option></select></div></Field>
        {(needsDigitBarrier || needsPriceBarrier) && <Field label="Barrier">{needsDigitBarrier ? <select value={barrier} onChange={(e) => setBarrier(e.target.value)} className="input-smart">{DIGIT_BARRIERS.map((d) => <option key={d}>{d}</option>)}</select> : <input value={barrier} onChange={(e) => { setManualBarrier(true); setBarrier(e.target.value); }} className="input-smart" />}</Field>}
        <div className="sm:col-span-2 lg:col-span-2 rounded-lg bg-secondary/50 border border-border p-3 min-h-16">
          <p className="text-[10px] text-muted-foreground">Contract Summary Preview</p>
          <p className="text-xs text-foreground font-semibold mt-1">{normalizedContract} • {market} • {duration}{durationUnit} • {basis} {amount}</p>
          <p className="text-[10px] text-primary mt-1">{proposalStatus}</p>
          {result && <p className={`text-xs font-bold mt-1 ${result.profit && result.profit >= 0 ? "text-buy" : "text-sell"}`}>Last result: {result.status} {result.profit?.toFixed(2)} USD</p>}
        </div>
      </div>
      {!isConnected ? <button onClick={onLogin} className="w-full py-3 rounded-lg bg-primary text-primary-foreground text-sm font-bold">Connect to Trade</button> : <button onClick={execute} disabled={!proposalId || executing.current || !validAmount} className="w-full py-3 rounded-lg bg-buy text-primary-foreground text-sm font-bold disabled:opacity-50">TRADE NOW</button>}
    </div>
  );

  return <><button onClick={() => setOpen(true)} className="lg:hidden fixed bottom-44 left-4 z-40 h-14 px-5 rounded-full bg-primary text-primary-foreground font-bold text-xs shadow-xl flex items-center gap-2"><Activity className="w-4 h-4" /> Trade</button><div className="hidden lg:block sticky bottom-0 z-10">{content}</div>{open && <div className="lg:hidden fixed inset-0 z-50 bg-background/70 backdrop-blur-sm" onClick={() => setOpen(false)}><div className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-2xl" onClick={(e) => e.stopPropagation()}>{content}<button onClick={() => setOpen(false)} className="w-full py-3 text-xs text-muted-foreground bg-card border-t border-border">Close</button></div></div>}</>;
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => <label className="block"><span className="text-[10px] text-muted-foreground font-medium">{label}</span><div className="mt-1">{children}</div></label>;

export default SmartTraderPanel;