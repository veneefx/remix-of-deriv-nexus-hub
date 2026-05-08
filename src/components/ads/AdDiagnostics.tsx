import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Activity } from "lucide-react";
import { getConsent } from "@/services/adsense";

/**
 * Tiny on-page diagnostics showing AdSense status. Only visible when ?addiag=1
 * is in the URL or when the user opens it. Keeps layout untouched.
 */
const AdDiagnostics = () => {
  const [open, setOpen] = useState(false);
  const [show, setShow] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [adsRendered, setAdsRendered] = useState(0);
  const [consent, setConsentState] = useState(getConsent());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setShow(new URLSearchParams(window.location.search).has("addiag"));
    const tick = () => {
      setScriptLoaded(!!window.__adsenseLoaded);
      setError(window.__adsenseError || null);
      setConsentState(getConsent());
    };
    tick();
    const id = setInterval(tick, 1500);
    const onRender = () => setAdsRendered((n) => n + 1);
    window.addEventListener("dnx:ad-rendered", onRender);
    return () => { clearInterval(id); window.removeEventListener("dnx:ad-rendered", onRender); };
  }, []);

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[110] text-xs">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-card border border-border shadow"
      >
        <Activity className="w-3 h-3" /> Ad diag {open ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
      </button>
      {open && (
        <div className="mt-2 w-64 p-3 rounded-lg border border-border bg-card shadow-xl space-y-1">
          <Row k="Consent" v={consent} ok={consent === "granted"} />
          <Row k="Script loaded" v={scriptLoaded ? "yes" : "no"} ok={scriptLoaded} />
          <Row k="Ads rendered" v={String(adsRendered)} ok={adsRendered > 0} />
          {error && <div className="text-destructive break-words">{error}</div>}
          <div className="opacity-60 pt-1">Append <code>?addiag=1</code> to URL to show this panel.</div>
        </div>
      )}
    </div>
  );
};

const Row = ({ k, v, ok }: { k: string; v: string; ok: boolean }) => (
  <div className="flex justify-between gap-2">
    <span className="text-muted-foreground">{k}</span>
    <span className={ok ? "text-green-500" : "text-yellow-500"}>{v}</span>
  </div>
);

export default AdDiagnostics;
