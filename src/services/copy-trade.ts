// Copy-trade fan-out: when the master trader buys a contract, mirror the same
// trade to all enabled client tokens with their own stake configuration.
//
// State lives in localStorage under "client_tokens" and is managed by the
// ClientTokenManager UI. Each connection is short-lived and reused via a
// simple in-memory pool to avoid auth churn.

import DerivWebSocket from "@/services/deriv-websocket";
import { aiLogger } from "@/services/ai-logger";

const DERIV_APP_ID = "129344";

export interface ClientToken {
  id: string;
  token: string;
  loginid: string;
  currency: string;
  balance: number | null;
  stake: string;
  usePercentage: boolean;
  percentage: number;
  is_virtual: boolean;
  active: boolean;
}

export interface CopyTradeRequest {
  contractType: string;
  symbol: string;
  duration: number;
  durationUnit: "t" | "s" | "m" | "h" | "d";
  barrier?: string | number;
}

const pool = new Map<string, { ws: DerivWebSocket; authed: boolean; loginid: string }>();

export function getActiveClients(): ClientToken[] {
  try {
    const raw = localStorage.getItem("client_tokens");
    if (!raw) return [];
    const arr = JSON.parse(raw) as ClientToken[];
    return arr.filter((c) => c.active && c.token);
  } catch {
    return [];
  }
}

function clientStake(c: ClientToken): number {
  if (c.usePercentage && typeof c.balance === "number") {
    const v = (c.balance * (c.percentage / 100));
    return Math.max(0.35, parseFloat(v.toFixed(2)));
  }
  const n = parseFloat(c.stake);
  return Number.isFinite(n) && n >= 0.35 ? n : 0.35;
}

async function getOrConnect(c: ClientToken): Promise<DerivWebSocket | null> {
  const existing = pool.get(c.token);
  if (existing && existing.ws.connected && existing.authed) return existing.ws;

  const ws = existing?.ws ?? new DerivWebSocket(DERIV_APP_ID);
  try {
    if (!ws.connected) await ws.connect();
    return await new Promise<DerivWebSocket | null>((resolve) => {
      const off = ws.on("authorize", (data) => {
        off();
        if (data.authorize?.loginid) {
          pool.set(c.token, { ws, authed: true, loginid: data.authorize.loginid });
          resolve(ws);
        } else {
          resolve(null);
        }
      });
      ws.authorize(c.token);
      setTimeout(() => resolve(null), 8000);
    });
  } catch {
    return null;
  }
}

/**
 * Mirror a master trade to all active client tokens. Each client gets its own
 * proposal then buys at their stake size. Results are surfaced to the AI log.
 */
export async function fanOutCopyTrade(req: CopyTradeRequest) {
  const clients = getActiveClients();
  if (clients.length === 0) return;

  aiLogger.log("System", "info", `Copy-trade → ${clients.length} client(s)`);

  for (const c of clients) {
    const ws = await getOrConnect(c);
    if (!ws) {
      aiLogger.log("System", "warn", `Copy-trade skip ${c.loginid}: connect failed`);
      continue;
    }

    const stake = clientStake(c);
    try {
      ws.getProposal({
        amount: stake,
        contractType: req.contractType,
        symbol: req.symbol,
        duration: req.duration,
        durationUnit: req.durationUnit,
        barrier: req.barrier,
      });

      const offProp = ws.on("proposal", (data) => {
        if (!data.proposal?.id) return;
        offProp();
        ws.buyContract(data.proposal.id, stake);
        const offBuy = ws.on("buy", (buyData) => {
          offBuy();
          if (buyData.error) {
            aiLogger.log("System", "error", `Copy-trade ${c.loginid}: ${buyData.error.message}`);
          } else if (buyData.buy) {
            aiLogger.log("System", "success", `Copied ${req.contractType} → ${c.loginid} @ $${stake.toFixed(2)}`);
          }
        });
      });
    } catch (e) {
      aiLogger.log("System", "error", `Copy-trade ${c.loginid} threw`);
    }
  }
}

export function disconnectAllCopyClients() {
  pool.forEach((v) => {
    try { v.ws.disconnect(); } catch {}
  });
  pool.clear();
}
