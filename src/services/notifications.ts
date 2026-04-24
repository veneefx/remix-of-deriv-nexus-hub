// ── Push / system notifications ──────────────────────────────────
// Surfaces TP/SL/disconnect/error events to the OS so the user is alerted
// even when the app is backgrounded or the screen is off (PWA installed).
//
// Uses the standard Notification API + (when available) the registered Service
// Worker to show notifications from background context. Falls back gracefully.
//
// Each notification also plays a distinctive WebAudio jingle so the user gets
// audible feedback (TP fanfare, SL alarm, etc.) without requiring asset files.

import { sounds, type SoundKind } from "./sounds";

const STORAGE_KEY = "dnx_notifications_enabled";
const DISMISS_KEY = "dnx_notif_prompt_dismissed_v1";

export type NotifyKind = "success" | "warn" | "error" | "info" | "tp" | "sl";

const ICON = "/icon-192.png";
const BADGE = "/icon-192.png";

function supported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

function persisted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function setPersisted(on: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? "1" : "0");
  } catch {}
}

export const notifications = {
  isSupported: supported,
  isEnabled(): boolean {
    if (!supported()) return false;
    return Notification.permission === "granted" && persisted();
  },
  permission(): NotificationPermission {
    if (!supported()) return "denied";
    return Notification.permission;
  },
  async requestPermission(): Promise<NotificationPermission> {
    if (!supported()) return "denied";
    if (Notification.permission === "granted") {
      setPersisted(true);
      return "granted";
    }
    const result = await Notification.requestPermission();
    setPersisted(result === "granted");
    return result;
  },
  disable() {
    setPersisted(false);
  },
  /** Show a notification using SW when available, falling back to direct API. */
  async notify(title: string, body: string, kind: NotifyKind = "info") {
    if (!this.isEnabled()) return;
    const tag = `dnx-${kind}-${Date.now()}`;
    const opts: NotificationOptions = {
      body,
      icon: ICON,
      badge: BADGE,
      tag,
      // @ts-expect-error vibrate is not in the standard NotificationOptions type
      vibrate: kind === "error" ? [200, 100, 200] : [100],
      requireInteraction: kind === "error" || kind === "success",
    };
    try {
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          await reg.showNotification(title, opts);
          return;
        }
      }
      new Notification(title, opts);
    } catch {
      // best-effort
    }
  },
  /** Register the lightweight notification service worker (idempotent). */
  async registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    try {
      // Skip in development / iframe previews to avoid stale caching.
      const inIframe = (() => {
        try { return window.self !== window.top; } catch { return true; }
      })();
      if (inIframe) return;
      const isPreview =
        window.location.hostname.includes("lovableproject.com") ||
        window.location.hostname.includes("id-preview--") ||
        window.location.hostname === "localhost";
      if (isPreview) return;
      await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    } catch {
      // ignore
    }
  },
};
