// Token vault: hydrates encrypted Deriv tokens into memory at boot so
// existing synchronous code (getStoredAccounts/getActiveAccount) keeps
// working. localStorage holds ciphertext; plaintext only lives in memory.
import { decryptString, encryptString, isEncrypted } from "./secure-storage";
import type { DerivAccount } from "@/services/deriv-auth";

const ACCOUNTS_KEY = "deriv_accounts";
const ACTIVE_KEY = "deriv_active_account";
const CLIENTS_KEY = "client_tokens";

type Hydrated = {
  accounts: DerivAccount[];
  active: DerivAccount | null;
  clients: Array<Record<string, unknown>>;
};

const memory: Hydrated = { accounts: [], active: null, clients: [] };
let hydrated = false;
let hydrating: Promise<void> | null = null;

const safeParse = <T>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
};

const decryptAccountTokens = async (accs: DerivAccount[]): Promise<DerivAccount[]> => {
  const out: DerivAccount[] = [];
  for (const a of accs) {
    if (!a?.token) { out.push(a); continue; }
    if (isEncrypted(a.token)) {
      try { out.push({ ...a, token: await decryptString(a.token) }); }
      catch { /* skip broken */ }
    } else {
      out.push(a); // legacy plaintext — will be re-encrypted on next write
    }
  }
  return out;
};

export const hydrateTokenVault = async (): Promise<void> => {
  if (hydrated) return;
  if (hydrating) return hydrating;
  hydrating = (async () => {
    const accs = safeParse<DerivAccount[]>(localStorage.getItem(ACCOUNTS_KEY), []);
    const active = safeParse<DerivAccount | null>(localStorage.getItem(ACTIVE_KEY), null);
    const clients = safeParse<Array<Record<string, unknown>>>(localStorage.getItem(CLIENTS_KEY), []);
    memory.accounts = await decryptAccountTokens(accs);
    memory.active = active ? (await decryptAccountTokens([active]))[0] ?? null : null;
    memory.clients = [];
    for (const c of clients) {
      const t = c?.token;
      if (typeof t === "string" && isEncrypted(t)) {
        try { memory.clients.push({ ...c, token: await decryptString(t) }); } catch {}
      } else {
        memory.clients.push(c);
      }
    }
    // Re-encrypt anything still plaintext so storage is consistently encrypted.
    if (accs.some((a) => a?.token && !isEncrypted(a.token))) {
      await writeAccounts(memory.accounts);
    }
    if (active?.token && !isEncrypted(active.token)) {
      await writeActiveAccount(memory.active);
    }
    if (clients.some((c) => typeof c?.token === "string" && !isEncrypted(c.token as string))) {
      await writeClients(memory.clients);
    }
    hydrated = true;
    hydrating = null;
  })();
  return hydrating;
};

export const isVaultHydrated = () => hydrated;

export const getMemoryAccounts = (): DerivAccount[] => memory.accounts;
export const getMemoryActive = (): DerivAccount | null => memory.active;
export const getMemoryClients = () => memory.clients;

const encryptAccountTokens = async (accs: DerivAccount[]): Promise<DerivAccount[]> => {
  const out: DerivAccount[] = [];
  for (const a of accs) {
    if (!a?.token) { out.push(a); continue; }
    out.push({ ...a, token: isEncrypted(a.token) ? a.token : await encryptString(a.token) });
  }
  return out;
};

export const writeAccounts = async (accs: DerivAccount[]) => {
  memory.accounts = accs;
  const enc = await encryptAccountTokens(accs);
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(enc));
};

export const writeActiveAccount = async (acc: DerivAccount | null) => {
  memory.active = acc;
  if (!acc) { localStorage.removeItem(ACTIVE_KEY); return; }
  const enc = (await encryptAccountTokens([acc]))[0];
  localStorage.setItem(ACTIVE_KEY, JSON.stringify(enc));
};

export const writeClients = async (clients: Array<Record<string, unknown>>) => {
  memory.clients = clients;
  const enc: Array<Record<string, unknown>> = [];
  for (const c of clients) {
    const t = c?.token;
    if (typeof t === "string" && t) {
      enc.push({ ...c, token: isEncrypted(t) ? t : await encryptString(t) });
    } else {
      enc.push(c);
    }
  }
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(enc));
};

export const clearVault = () => {
  memory.accounts = [];
  memory.active = null;
  memory.clients = [];
  localStorage.removeItem(ACCOUNTS_KEY);
  localStorage.removeItem(ACTIVE_KEY);
};
