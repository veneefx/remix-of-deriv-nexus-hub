// Lightweight admin-verification gate state stored in localStorage.
// AnalysisPaywall consults this when a user is `isPremium` to confirm an admin
// has manually verified the receipt before fully removing blur per feature.
//
// In production this should sync with a `payment_verifications` table; for now
// it provides a deterministic, per-feature unlock map driven by the admin UI.

const KEY = "dnx_admin_verified_features";

type VerificationMap = Record<string, { verifiedAt: number; verifiedBy: string }>;

function read(): VerificationMap {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as VerificationMap) : {};
  } catch {
    return {};
  }
}

function write(map: VerificationMap) {
  try { localStorage.setItem(KEY, JSON.stringify(map)); } catch {}
  window.dispatchEvent(new Event("dnx_admin_verified"));
}

export const adminVerification = {
  isFeatureVerified(featureName: string): boolean {
    const map = read();
    return Boolean(map[featureName]);
  },
  isAnyVerified(): boolean {
    return Object.keys(read()).length > 0;
  },
  verify(featureName: string, verifiedBy = "admin") {
    const map = read();
    map[featureName] = { verifiedAt: Date.now(), verifiedBy };
    write(map);
  },
  revoke(featureName: string) {
    const map = read();
    delete map[featureName];
    write(map);
  },
  list(): VerificationMap {
    return read();
  },
  subscribe(cb: () => void) {
    const handler = () => cb();
    window.addEventListener("dnx_admin_verified", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("dnx_admin_verified", handler);
      window.removeEventListener("storage", handler);
    };
  },
};
