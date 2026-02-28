// Deriv OAuth Service

const DERIV_OAUTH_URL = "https://oauth.deriv.com/oauth2/authorize";

export interface DerivAccount {
  token: string;
  loginid: string;
  currency: string;
  is_virtual: boolean;
}

export const getOAuthUrl = (appId: string, redirectUri: string): string => {
  // Deriv OAuth uses the redirect URL registered in the app settings
  // The redirect_uri param is not used by Deriv - it uses the one configured in the app dashboard
  return `${DERIV_OAUTH_URL}?app_id=${appId}&l=en&brand=deriv`;
};

export const parseCallbackParams = (): DerivAccount[] => {
  const hash = window.location.search.substring(1);
  const params = new URLSearchParams(hash);
  const accounts: DerivAccount[] = [];

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
