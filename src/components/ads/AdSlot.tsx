import { useEffect, useRef, useState } from "react";
import { ADSENSE_CLIENT, getConsent } from "@/services/adsense";

interface AdSlotProps {
  slot?: string;          // AdSense ad unit slot ID (e.g. "1234567890")
  format?: string;        // "auto" | "fluid" | "rectangle" etc
  layout?: string;        // for in-article: "in-article"
  layoutKey?: string;
  responsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
  label?: string;
}

/**
 * Reusable AdSense ad unit. Renders <ins class="adsbygoogle"> and pushes
 * to (adsbygoogle = window.adsbygoogle || []) once visible & consent granted.
 * If `slot` is missing, renders a labelled placeholder so layout never breaks.
 */
const AdSlot = ({
  slot,
  format = "auto",
  layout,
  layoutKey,
  responsive = true,
  className = "",
  style,
  label = "Advertisement",
}: AdSlotProps) => {
  const ref = useRef<HTMLModElement | null>(null);
  const [pushed, setPushed] = useState(false);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (!slot || pushed) return;
    if (getConsent() !== "granted") return;
    const tryPush = () => {
      try {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        setPushed(true);
      } catch (e) {
        // retry shortly if script not ready
        setTimeout(tryPush, 600);
      }
    };
    tryPush();
  }, [slot, pushed]);

  // Detect render
  useEffect(() => {
    if (!pushed || !ref.current) return;
    const obs = new MutationObserver(() => {
      const el = ref.current as HTMLElement | null;
      if (el && el.getAttribute("data-ad-status") === "filled") {
        setRendered(true);
        window.dispatchEvent(new CustomEvent("dnx:ad-rendered", { detail: slot }));
      }
    });
    obs.observe(ref.current, { attributes: true, attributeFilter: ["data-ad-status"] });
    return () => obs.disconnect();
  }, [pushed, slot]);

  // Re-push when consent changes
  useEffect(() => {
    const handler = () => {
      if (!slot || pushed) return;
      if (getConsent() === "granted") {
        try {
          // @ts-ignore
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          setPushed(true);
        } catch {}
      }
    };
    window.addEventListener("dnx:adsense-loaded", handler);
    window.addEventListener("dnx:consent", handler);
    return () => {
      window.removeEventListener("dnx:adsense-loaded", handler);
      window.removeEventListener("dnx:consent", handler);
    };
  }, [slot, pushed]);

  if (!slot) {
    return (
      <div
        className={`flex items-center justify-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-md bg-muted/20 ${className}`}
        style={{ minHeight: 90, ...style }}
        aria-hidden
      >
        {label} (slot not configured)
      </div>
    );
  }

  return (
    <div className={className} style={style}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 opacity-60">
        {label}
      </div>
      <ins
        ref={ref as any}
        className="adsbygoogle"
        style={{ display: "block", ...(style || {}) }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-ad-layout={layout}
        data-ad-layout-key={layoutKey}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
};

export default AdSlot;
