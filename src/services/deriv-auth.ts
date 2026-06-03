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

export const storeAccounts = (accounts: DerivAccount[]) => {
  localStorage.setItem("deriv_accounts", JSON.stringify(accounts));
};

export const getStoredAccounts = (): DerivAccount[] => {
  const data = localStorage.getItem("deriv_accounts");
  return data ? JSON.parse(data) : [];
};

export const getActiveAccount = (): DerivAccount | null => {
  const active = localStorage.getItem("deriv_active_account");
  return active ? JSON.parse(active) : null;
};

export const setActiveAccount = (account: DerivAccount) => {
  localStorage.setItem("deriv_active_account", JSON.stringify(account));
};

export const clearAuth = () => {
  localStorage.removeItem("deriv_accounts");
  localStorage.removeItem("deriv_active_account");
};
