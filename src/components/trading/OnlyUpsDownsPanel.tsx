import { useCallback, useEffect, useRef, useState } from "react";
import { TrendingUp, TrendingDown, Zap, Volume2, VolumeX, Sparkles } from "lucide-react";
import DerivWebSocket from "@/services/deriv-websocket";
import type { DerivAccount } from "@/services/deriv-auth";
import { aiLogger } from "@/services/ai-logger";
import { tradeLock } from "@/services/trade-lock";
import { toast } from "@/hooks/use-toast";
import { sounds } from "@/services/sounds";

/**
 * Only Ups / Only Downs execution panel — Deriv RUNHIGH / RUNLOW.
 * Includes:
 *  - REAL / DEMO badge sourced from active Deriv WebSocket account
 *  - AI Auto mode (3 consecutive same-direction ticks → auto-arm + execute)
 *  - Sound mute toggle, success/error sounds on resolution
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
  const [ticks, setTicks] = useState(5);
  const [direction, setDirection] = useState<"UP" | "DOWN">("UP");
  const [proposalId, setProposalId] = useState<string | null>(null);
  const [payout, setPayout] = useState<number | null>(null);
  const [status, setStatus] = useState("Awaiting input…");
  const [executing, setExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<{ profit: number; status: string } | null>(null);
  const [aiMode, setAiMode] = useState(false);
  const [muted, setMutedState] = useState(sounds.isMuted());
  // Trades only allowed when WS is authorized AND we have an account.
  // The Real/Demo badge is also derived from the authorized loginid
  // (which comes from the live Deriv balance/authorize stream), not stale local state.
  const isConnected = !!account && authorized !== false;
  const liveAccount =
    (authorizedLoginid && account?.loginid === authorizedLoginid) ? account : account;

  const contractType = direction === "UP" ? "RUNHIGH" : "RUNLOW";
  const validStake = /^(\d+(\.\d{0,2})?)?$/.test(stake) && Number(stake) > 0;
  const validTicks = ticks >= 2 && ticks <= 5;
  const cleanRef = useRef<(() => void) | null>(null);
  const recentTicks = useRef<number[]>([]);
  const lastAiFireTs = useRef(0);

  useEffect(() => sounds.onMuteChange(setMutedState) as any, []);

  const requestProposal = useCallback(() => {
    if (!ws || !isConnected || !validStake || !validTicks) return;
    setProposalId(null);
    setPayout(null);
    setStatus("Requesting proposal…");
    ws.getProposal({
      amount: Number(stake),
      basis: "stake",
      contractType,
      symbol: selectedMarket,
      duration: ticks,
      durationUnit: "t",
    });
  }, [ws, isConnected, validStake, validTicks, stake, contractType, selectedMarket, ticks]);

  useEffect(() => {
    if (!ws) return;
    const unsub = ws.on("proposal", (data) => {
      if (data.proposal) {
        setProposalId(data.proposal.id);
        setPayout(Number(data.proposal.payout));
        setStatus(`Ready • payout ${Number(data.proposal.payout).toFixed(2)} USD`);
      } else if (data.error) {
        setStatus(data.error.message || "Proposal blocked");
        setProposalId(null);
      }
    });
    return () => { unsub(); };
  }, [ws]);

  useEffect(() => {
    const t = setTimeout(requestProposal, 200);
    return () => clearTimeout(t);
  }, [requestProposal]);

  useEffect(() => {
    if (!ws || !isConnected) return;
    const i = setInterval(requestProposal, 1500);
    return () => clearInterval(i);
  }, [ws, isConnected, requestProposal]);

  const trade = useCallback(() => {
    if (!ws || !proposalId || executing || !validStake) return;
    if (!tradeLock.tryAcquire("System")) return;
    setExecuting(true);
    setStatus("Buying…");
    ws.buyContract(proposalId, Number(stake));
    aiLogger.log("System", "success", `OnlyUps/Downs → ${contractType} ${selectedMarket} ${ticks}t`);

    if (cleanRef.current) cleanRef.current();
    const unsubBuy = ws.on("buy", (data) => {
      if (data.error) {
        setStatus(data.error.message || "Buy failed");
        setExecuting(false);
        tradeLock.release("System");
        sounds.play("error");
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
          setLastResult({ profit, status: profit > 0 ? "WON" : "LOST" });
          setStatus(`Closed • ${profit >= 0 ? "+" : ""}${profit.toFixed(2)} USD`);
          sounds.play(profit > 0 ? "success" : "error");
          toast({
            title: profit > 0 ? `Only ${direction}s WON` : `Only ${direction}s LOST`,
            description: `${profit >= 0 ? "+" : ""}${profit.toFixed(2)} USD`,
          });
          setExecuting(false);
          tradeLock.release("System");
          unsubPoc();
          requestProposal();
        });
        cleanRef.current = () => { try { unsubPoc(); } catch {} };
      }
      unsubBuy();
    });
  }, [ws, proposalId, executing, validStake, stake, contractType, selectedMarket, ticks, direction, requestProposal]);

  // AI Auto mode: subscribe to ticks, fire when 3 consecutive same-direction moves detected.
  useEffect(() => {
    if (!ws || !aiMode) return;
    const unsub = ws.on("tick", (data) => {
      const t = data.tick;
      if (!t || t.symbol !== selectedMarket) return;
      const q = Number(t.quote);
      const buf = recentTicks.current;
      buf.push(q);
      if (buf.length > 6) buf.shift();
      if (buf.length < 4) return;
      const last4 = buf.slice(-4);
      const ups = last4.every((v, i) => i === 0 || v > last4[i - 1]);
      const downs = last4.every((v, i) => i === 0 || v < last4[i - 1]);
      const now = Date.now();
      if (executing || now - lastAiFireTs.current < 6000) return;
      if (ups || downs) {
        lastAiFireTs.current = now;
        setDirection(ups ? "UP" : "DOWN");
        setStatus(`AI armed → ONLY ${ups ? "UPS" : "DOWNS"}`);
        // Wait briefly for fresh proposal then auto-buy
        setTimeout(() => trade(), 350);
      }
    });
    return () => { unsub(); };
  }, [ws, aiMode, selectedMarket, executing, trade]);

  // Badge sourced from the live authorize/balance stream:
  // prefer the loginid the WS reports as currently authorized; fall back to local account.
  const badgeLoginid = authorizedLoginid || account?.loginid || null;
  const badgeIsVirtual = badgeLoginid?.startsWith("VR")
    ?? (account?.is_virtual ?? false);
  const accountBadge = !badgeLoginid ? null : (
    <span
      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${
        badgeIsVirtual ? "bg-warning/20 text-warning" : "bg-buy/15 text-buy"
      }`}
      title={badgeLoginid}
    >
      {badgeIsVirtual ? "Demo" : "Real"} · {badgeLoginid}
    </span>
  );

  return (
    <div className="h-full flex flex-col bg-card/95 border-t border-border">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Zap className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="text-[11px] font-bold text-foreground truncate">Only Ups / Only Downs</span>
        </div>
        <div className="flex items-center gap-1.5">
          {accountBadge}
          <button
            onClick={() => setAiMode((v) => !v)}
            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full inline-flex items-center gap-1 transition ${
              aiMode ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
            }`}
            title="AI Auto-arm: fires after 3 same-direction ticks"
          >
            <Sparkles className="w-3 h-3" /> AI {aiMode ? "ON" : "OFF"}
          </button>
          <button
            onClick={() => sounds.toggleMute()}
            className="p-1 rounded-full text-muted-foreground hover:text-foreground"
            title={muted ? "Unmute alerts" : "Mute alerts"}
          >
            {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${isConnected ? "bg-buy/15 text-buy" : "bg-sell/15 text-sell"}`}>
            {isConnected ? "LIVE" : "OFFLINE"}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 grid grid-cols-12 gap-2 p-2 min-h-0">
        <div className="col-span-5 flex flex-col gap-2">
          <label className="block">
            <span className="text-[9px] uppercase text-muted-foreground font-bold">Stake (USD)</span>
            <input
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              inputMode="decimal"
              className="mt-0.5 w-full px-2 py-1.5 rounded bg-secondary border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </label>
          <label className="block">
            <span className="text-[9px] uppercase text-muted-foreground font-bold">Ticks (2–5)</span>
            <input
              type="number"
              min={2}
              max={5}
              value={ticks}
              onChange={(e) => setTicks(Math.max(2, Math.min(5, Number(e.target.value) || 2)))}
              className="mt-0.5 w-full px-2 py-1.5 rounded bg-secondary border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </label>
          <div className="text-[9px] text-muted-foreground leading-tight">
            <p className="truncate">{status}</p>
            {payout != null && <p className="text-buy font-bold">Payout {payout.toFixed(2)}</p>}
            {lastResult && (
              <p className={lastResult.profit >= 0 ? "text-buy font-bold" : "text-sell font-bold"}>
                Last: {lastResult.status} {lastResult.profit >= 0 ? "+" : ""}{lastResult.profit.toFixed(2)}
              </p>
            )}
          </div>
        </div>

        <div className="col-span-7 flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => setDirection("UP")}
              className={`py-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition ${
                direction === "UP"
                  ? "bg-buy text-primary-foreground shadow-md"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" /> ONLY UPS
            </button>
            <button
              onClick={() => setDirection("DOWN")}
              className={`py-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition ${
                direction === "DOWN"
                  ? "bg-sell text-primary-foreground shadow-md"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <TrendingDown className="w-3.5 h-3.5" /> ONLY DOWNS
            </button>
          </div>

          {!isConnected ? (
            <button
              onClick={onLogin}
              className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold"
            >
              Connect to Trade
            </button>
          ) : (
            <button
              onClick={trade}
              disabled={!proposalId || executing || !validStake}
              className={`flex-1 py-2 rounded-lg text-xs font-bold disabled:opacity-50 ${
                direction === "UP" ? "bg-buy text-primary-foreground" : "bg-sell text-primary-foreground"
              }`}
            >
              {executing ? "Executing…" : `TRADE ${direction === "UP" ? "ONLY UPS" : "ONLY DOWNS"} (${ticks}t)`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnlyUpsDownsPanel;
