// ── Notifications enable prompt (post-PWA install) ───────────────
// • Shows a one-time bottom banner asking the user to enable system
//   notifications so TP/SL/disconnect events still alert them when the app
//   is in the background or the screen is off.
// • If the user denied permission, surfaces a permanent compact "Retry alerts"
//   chip the user can click any time to retry (and shows OS instructions when
//   the browser refuses to re-prompt).

import { useEffect, useState } from "react";
import { Bell, BellOff, X, Volume2 } from "lucide-react";
import { notifications } from "@/services/notifications";
import { sounds } from "@/services/sounds";
import { toast } from "@/hooks/use-toast";

const DISMISS_KEY = "dnx_notif_prompt_dismissed_v1";

const NotificationsPrompt = () => {
  const [show, setShow] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>(() =>
    notifications.isSupported() ? notifications.permission() : "denied"
  );
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (!notifications.isSupported()) return;
    if (notifications.isEnabled()) return;
    if (localStorage.getItem(DISMISS_KEY) === "1" && permission !== "denied") return;

    // Show after a short delay so it doesn't block initial paint
    const t = setTimeout(() => setShow(true), 4000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const enable = async () => {
    sounds.prime(); // prime AudioContext on this user gesture
    const result = await notifications.requestPermission();
    setPermission(result);
    if (result === "granted") {
      toast({ title: "🔔 Notifications enabled", description: "You'll get alerts for TP, SL and disconnects." });
      await notifications.notify("DNexus alerts active", "We'll notify you about critical trading events.", "success");
      localStorage.setItem(DISMISS_KEY, "1");
      setShow(false);
    } else if (result === "denied") {
      // Browser will not re-prompt — show how to fix in OS / browser settings.
      setShowHelp(true);
      toast({
        title: "Notifications blocked",
        description: "Enable them in your browser/site settings, then tap Retry.",
        variant: "destructive",
      });
    } else {
      // 'default' — user dismissed the OS prompt
      toast({ title: "No choice made", description: "You can enable later from the alerts chip." });
    }
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  };

  // ── Permanent retry chip after explicit denial ──
  if (permission === "denied") {
    return (
      <>
        <button
          onClick={() => { notifications.resetPromptDismissal(); setShow(true); enable(); }}
          className="fixed bottom-32 lg:bottom-12 right-4 z-40 flex items-center gap-2 px-3 py-2 rounded-full bg-sell/15 border border-sell/40 text-sell text-[11px] font-bold shadow-lg backdrop-blur hover:bg-sell/25"
          title="Notifications blocked — click to retry"
        >
          <BellOff className="w-4 h-4" /> Retry alerts
        </button>
        {showHelp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/70 backdrop-blur-sm" onClick={() => setShowHelp(false)}>
            <div className="bg-card border border-border rounded-2xl w-full max-w-sm p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2"><Bell className="w-4 h-4 text-buy" /> Re-enable alerts</h3>
                <button onClick={() => setShowHelp(false)} className="p-1 rounded hover:bg-secondary"><X className="w-4 h-4" /></button>
              </div>
              <p className="text-xs text-muted-foreground">Notifications were blocked. To get TP / SL / disconnect alerts:</p>
              <ol className="text-[11px] text-muted-foreground list-decimal pl-4 space-y-1">
                <li>Tap the lock icon in your browser's address bar.</li>
                <li>Set <span className="text-foreground font-semibold">Notifications</span> to <span className="text-foreground font-semibold">Allow</span>.</li>
                <li>Reload the page, then tap <span className="text-foreground font-semibold">Retry alerts</span>.</li>
              </ol>
              <button
                onClick={() => { sounds.tp(); }}
                className="w-full py-2 text-[11px] font-bold rounded-lg bg-secondary text-foreground hover:bg-muted flex items-center justify-center gap-1.5"
              >
                <Volume2 className="w-3.5 h-3.5" /> Preview alert sound
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

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
            Get notified about Take Profit, Stop Loss, and disconnects — even when the app is in the background. Each event has its own sound.
          </p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={enable}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-buy text-primary-foreground hover:opacity-90"
            >
              Enable
            </button>
            <button
              onClick={() => { sounds.tp(); }}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-secondary text-muted-foreground hover:bg-muted flex items-center gap-1"
              title="Preview the TP alert sound"
            >
              <Volume2 className="w-3 h-3" /> Test
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
