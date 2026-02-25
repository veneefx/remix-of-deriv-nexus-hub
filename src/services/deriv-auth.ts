// Deriv OAuth Service

const DERIV_OAUTH_URL = "https://oauth.deriv.com/oauth2/authorize";

export interface DerivAccount {
  token: string;
  loginid: string;
  currency: string;
  is_virtual: boolean;
}

export const getOAuthUrl = (appId: string, redirectUri: string): string => {
  return `${DERIV_OAUTH_URL}?app_id=${appId}&l=en&brand=deriv`;
};

export const parseCallbackParams = (): DerivAccount[] => {
  const hash = window.location.search.substring(1);
  const params = new URLSearchParams(hash);
  const accounts: DerivAccount[] = [];

  // Deriv returns multiple accounts as acct1, token1, cur1, etc.
  let i = 1;
  while (params.has(`acct${i}`)) {
    accounts.push({
      loginid: params.get(`acct${i}`) || "",
      token: params.get(`token${i}`) || "",
      currency: params.get(`cur${i}`) || "USD",
      is_virtual: (params.get(`acct${i}`) || "").startsWith("VRTC"),
    });
    i++;
  }

  return accounts;
};

export const storeAccounts = (accounts: DerivAccount[]) => {
  sessionStorage.setItem("deriv_accounts", JSON.stringify(accounts));
};

export const getStoredAccounts = (): DerivAccount[] => {
  const data = sessionStorage.getItem("deriv_accounts");
  return data ? JSON.parse(data) : [];
};

export const getActiveAccount = (): DerivAccount | null => {
  const active = sessionStorage.getItem("deriv_active_account");
  return active ? JSON.parse(active) : null;
};

export const setActiveAccount = (account: DerivAccount) => {
  sessionStorage.setItem("deriv_active_account", JSON.stringify(account));
};

export const clearAuth = () => {
  sessionStorage.removeItem("deriv_accounts");
  sessionStorage.removeItem("deriv_active_account");
};
