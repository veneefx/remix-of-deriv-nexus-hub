import { useEffect, useState } from "react";
import { Cookie, X } from "lucide-react";
import { getConsent, setConsent } from "@/services/adsense";

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (getConsent() === "unknown") {
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
    setVisible(false);
  }, []);

  if (!visible) return null;

  const accept = () => { setConsent("granted"); setVisible(false); };
  const decline = () => { setConsent("denied"); setVisible(false); };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[120] p-3 sm:p-4 pointer-events-none">
      <div className="pointer-events-auto max-w-3xl mx-auto bg-card/95 backdrop-blur border border-border shadow-xl rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row gap-3 sm:items-center">
        <Cookie className="w-6 h-6 text-primary shrink-0" />
        <div className="flex-1 text-sm text-foreground">
          We use cookies for essential functionality and, with your consent, for personalized
          ads (Google AdSense) and analytics. You can change your choice anytime.{" "}
          <a href="/privacy" className="underline">Privacy Policy</a>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={decline}
            className="px-3 py-2 text-sm rounded-md border border-border hover:bg-muted"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90"
          >
            Accept all
          </button>
          <button onClick={decline} aria-label="Close" className="p-2 rounded-md hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
