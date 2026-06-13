// Deriv OAuth Service

const DERIV_OAUTH_URL = "https://oauth.deriv.com/oauth2/authorize";
const DERIV_OAUTH_V2_URL = "https://auth.deriv.com/oauth2/auth";
const DERIV_OAUTH_STORAGE_KEY = "deriv_oauth_pkce";

export interface DerivAccount {
  token: string;
  loginid: string;
  currency: string;
  is_virtual: boolean;
}

export interface StoredDerivSession {
  mode: "oauth" | "token";
  token: string;
  loginid: string;
  currency: string;
  is_virtual: boolean;
  added_at: string;
}

export interface TokenValidationDebug {
  validatorPath: "direct-websocket";
  request: {
    url: string;
    payload: { authorize: string };
  };
  response?: unknown;
  error?: string;
  connectionState: "idle" | "opening" | "open" | "message" | "error" | "closed" | "timeout";
  timestamp: string;
}

interface DerivPkceSession {
  codeVerifier: string;
  state: string;
  redirectUri: string;
}

const base64UrlEncode = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

const randomString = (length: number) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (value) => chars[value % chars.length]).join("");
};

export const createOAuthUrl = async (appId: string, redirectUri: string): Promise<string> => {
  const codeVerifier = randomString(64);
  const state = randomString(32);
  const hashBuffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(codeVerifier));
  const codeChallenge = base64UrlEncode(new Uint8Array(hashBuffer));

  const pkceSession: DerivPkceSession = { codeVerifier, state, redirectUri };
  sessionStorage.setItem(DERIV_OAUTH_STORAGE_KEY, JSON.stringify(pkceSession));

  const params = new URLSearchParams({
    response_type: "code",
    client_id: appId,
    redirect_uri: redirectUri,
    scope: "trade account_manage",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    app_id: appId,
  });

  return `${DERIV_OAUTH_V2_URL}?${params.toString()}`;
};

export const getOAuthUrl = (appId: string, redirectUri: string): string => {
  return `${DERIV_OAUTH_URL}?app_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&l=en&brand=deriv`;
};

export const getStoredPkceSession = (): DerivPkceSession | null => {
  const raw = sessionStorage.getItem(DERIV_OAUTH_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DerivPkceSession;
  } catch {
    sessionStorage.removeItem(DERIV_OAUTH_STORAGE_KEY);
    return null;
  }
};

export const clearStoredPkceSession = () => {
  sessionStorage.removeItem(DERIV_OAUTH_STORAGE_KEY);
};

export const parseCallbackParams = (): DerivAccount[] => {
  const search = new URLSearchParams(window.location.search);
  const hash = window.location.hash.startsWith("#")
    ? new URLSearchParams(window.location.hash.slice(1))
    : new URLSearchParams(window.location.hash);
  const accounts: DerivAccount[] = [];

  let i = 1;
  while (search.has(`acct${i}`) || hash.has(`acct${i}`)) {
    const loginid = search.get(`acct${i}`) || hash.get(`acct${i}`) || "";
    accounts.push({
      loginid,
      token: search.get(`token${i}`) || hash.get(`token${i}`) || "",
      currency: search.get(`cur${i}`) || hash.get(`cur${i}`) || "USD",
      is_virtual: loginid.startsWith("VRTC"),
    });
    i++;
  }

  return accounts;
};

import {
  getMemoryAccounts,
  getMemoryActive,
  writeAccounts,
  writeActiveAccount,
  clearVault,
} from "@/lib/token-vault";

export const storeAccounts = (accounts: DerivAccount[]) => {
  void writeAccounts(accounts);
};

export const getStoredAccounts = (): DerivAccount[] => {
  // Vault hydrates before render; if empty, fall back to raw localStorage for safety.
  const mem = getMemoryAccounts();
  if (mem.length) return mem;
  const data = localStorage.getItem("deriv_accounts");
  return data ? (JSON.parse(data) as DerivAccount[]) : [];
};

export const getActiveAccount = (): DerivAccount | null => {
  const mem = getMemoryActive();
  if (mem) return mem;
  const active = localStorage.getItem("deriv_active_account");
  return active ? (JSON.parse(active) as DerivAccount) : null;
};

export const setActiveAccount = (account: DerivAccount) => {
  void writeActiveAccount(account);
};

export const clearAuth = () => {
  clearVault();
};

export const normalizeDerivToken = (value: string) => value.trim();

export const validateDerivToken = (value: string) => {
  const normalized = normalizeDerivToken(value);
  return normalized.length > 0 && !/\s/.test(normalized);
};

export const loginWithDerivToken = async (
  token: string,
  onDebug?: (debug: TokenValidationDebug) => void,
): Promise<DerivAccount> => {
  const cleanToken = normalizeDerivToken(token);
  if (!validateDerivToken(cleanToken)) {
    throw new Error("Enter a valid Deriv API token.");
  }

  const wsUrl = "wss://ws.derivws.com/websockets/v3?app_id=129344";
  const requestPayload = { authorize: cleanToken };
  const emitDebug = (partial: Partial<TokenValidationDebug>) => {
    onDebug?.({
      validatorPath: "direct-websocket",
      request: {
        url: wsUrl,
        payload: requestPayload,
      },
      connectionState: "idle",
      timestamp: new Date().toISOString(),
      ...partial,
    });
  };

  emitDebug({ connectionState: "opening" });
  const ws = new WebSocket(wsUrl);

  return await new Promise<DerivAccount>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      emitDebug({ connectionState: "timeout", error: "Token validation timed out. Please try again." });
      try { ws.close(); } catch {}
      reject(new Error("Token validation timed out. Please try again."));
    }, 12000);

    ws.onopen = () => {
      emitDebug({ connectionState: "open" });
      ws.send(JSON.stringify(requestPayload));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        emitDebug({ connectionState: "message", response: data });
        if (data.error) {
          window.clearTimeout(timeout);
          try { ws.close(); } catch {}
          emitDebug({ connectionState: "error", response: data, error: data.error.message || "Token validation failed." });
          reject(new Error(data.error.message || "Token validation failed."));
          return;
        }

        if (data.authorize) {
          const account: DerivAccount = {
            token: cleanToken,
            loginid: data.authorize.loginid || "",
            currency: data.authorize.currency || "USD",
            is_virtual: String(data.authorize.loginid || "").startsWith("VRTC"),
          };
          window.clearTimeout(timeout);
          try { ws.close(); } catch {}
          emitDebug({ connectionState: "closed", response: data });
          resolve(account);
        }
      } catch {
        window.clearTimeout(timeout);
        try { ws.close(); } catch {}
        emitDebug({ connectionState: "error", error: "Could not validate token." });
        reject(new Error("Could not validate token."));
      }
    };

    ws.onerror = () => {
      window.clearTimeout(timeout);
      try { ws.close(); } catch {}
      emitDebug({ connectionState: "error", error: "Could not reach Deriv to validate this token." });
      reject(new Error("Could not reach Deriv to validate this token."));
    };

    ws.onclose = () => {
      emitDebug({ connectionState: "closed" });
    };
  });
};
