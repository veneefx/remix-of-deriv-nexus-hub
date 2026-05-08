// AdSense loader — only injects the script after user consent (GDPR/CCPA-friendly).
export const ADSENSE_CLIENT = "ca-pub-9926216496990700";
const SCRIPT_ID = "adsbygoogle-js";
const CONSENT_KEY = "dnx_cookie_consent_v1";

declare global {
  interface Window {
    adsbygoogle?: any[];
    __adsenseLoaded?: boolean;
    __adsenseError?: string;
  }
}

export type ConsentState = "granted" | "denied" | "unknown";

export const getConsent = (): ConsentState => {
  try {
    const v = localStorage.getItem(CONSENT_KEY);
    if (v === "granted" || v === "denied") return v;
  } catch {}
  return "unknown";
};

export const setConsent = (v: "granted" | "denied") => {
  try { localStorage.setItem(CONSENT_KEY, v); } catch {}
  if (v === "granted") loadAdSense();
  window.dispatchEvent(new CustomEvent("dnx:consent", { detail: v }));
};

export const loadAdSense = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.__adsenseLoaded) return resolve(true);
    if (document.getElementById(SCRIPT_ID)) {
      window.__adsenseLoaded = true;
      return resolve(true);
    }
    const s = document.createElement("script");
    s.id = SCRIPT_ID;
    s.async = true;
    s.crossOrigin = "anonymous";
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
    s.onload = () => {
      window.__adsenseLoaded = true;
      window.dispatchEvent(new Event("dnx:adsense-loaded"));
      resolve(true);
    };
    s.onerror = (e) => {
      window.__adsenseError = "Failed to load AdSense script (often blocked by ad-blockers).";
      window.dispatchEvent(new Event("dnx:adsense-error"));
      resolve(false);
    };
    document.head.appendChild(s);
  });
};

// Auto-load on import if consent already granted (e.g., returning user).
if (typeof window !== "undefined" && getConsent() === "granted") {
  loadAdSense();
}
