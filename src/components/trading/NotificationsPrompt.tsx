// ── Notifications enable prompt (post-PWA install) ───────────────
// Surfaces a one-time bottom banner asking the user to enable system
// notifications so TP/SL/disconnect events still alert them when the app
// is in the background or the screen is off.

import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { notifications } from "@/services/notifications";
import { toast } from "@/hooks/use-toast";

const DISMISS_KEY = "dnx_notif_prompt_dismissed_v1";

const NotificationsPrompt = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!notifications.isSupported()) return;
    if (notifications.isEnabled()) return;
    if (notifications.permission() === "denied") return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    // Show after a short delay so it doesn't block initial paint
    const t = setTimeout(() => setShow(true), 4000);
    return () => clearTimeout(t);
  }, []);

  const enable = async () => {
    const result = await notifications.requestPermission();
    if (result === "granted") {
      toast({ title: "🔔 Notifications enabled", description: "You'll get alerts for TP, SL and disconnects." });
      await notifications.notify("DNexus alerts active", "We'll notify you about critical trading events.", "success");
    } else {
      toast({ title: "Notifications blocked", description: "Enable them in your browser settings to receive alerts.", variant: "destructive" });
    }
    localStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-32 lg:bottom-12 left-4 right-4 lg:left-auto lg:right-4 lg:w-96 z-40">
      <div className="bg-card border border-buy/40 rounded-2xl shadow-2xl p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-buy/15 flex items-center justify-center shrink-0">
          <Bell className="w-5 h-5 text-buy" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">Enable trade alerts</p>
          <p className="text-[11px] text-muted-foreground">
            Get notified about Take Profit, Stop Loss, and disconnects — even when the app is in the background.
          </p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={enable}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-buy text-primary-foreground hover:opacity-90"
            >
              Enable
            </button>
            <button
              onClick={dismiss}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-secondary text-muted-foreground hover:bg-muted"
            >
              Not now
            </button>
          </div>
        </div>
        <button onClick={dismiss} className="p-1 rounded-lg hover:bg-secondary text-muted-foreground shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default NotificationsPrompt;
