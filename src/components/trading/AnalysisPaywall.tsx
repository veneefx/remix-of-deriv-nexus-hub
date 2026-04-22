import { Lock, Crown, Sparkles, ShieldCheck, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { useSyncExternalStore } from "react";
import { adminVerification } from "@/services/admin-verification";

interface AnalysisPaywallProps {
  isPremium: boolean;
  isAdmin: boolean;
  featureName: string;
  onUpgrade: (featureName: string) => void;
  children: React.ReactNode;
  /** When true, the wrapped content stays fully interactive but blurred (preview style). */
  compact?: boolean;
}

const subscribe = (cb: () => void) => adminVerification.subscribe(cb);
const getSnapshot = () => JSON.stringify(adminVerification.list());

/**
 * Permanent blur paywall for analysis surfaces.
 *
 * Access tiers:
 *  - Admin → always unlocked
 *  - Premium + admin-verified for THIS feature → unlocked
 *  - Premium without admin verification → "Pending verification" card
 *  - Non-premium → "Upgrade" card
 */
const AnalysisPaywall = ({
  isPremium,
  isAdmin,
  featureName,
  onUpgrade,
  children,
  compact = false,
}: AnalysisPaywallProps) => {
  // Re-render when admin verification map changes
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const verified = adminVerification.isFeatureVerified(featureName);

  if (isAdmin) return <>{children}</>;
  if (isPremium && verified) return <>{children}</>;

  const pending = isPremium && !verified;

  return (
    <div className="relative isolate">
      {/* Blurred content (non-interactive) */}
      <div
        className="pointer-events-none select-none filter blur-[6px] saturate-50 opacity-70"
        aria-hidden="true"
      >
        {children}
      </div>

      {/* Permanent overlay */}
      <div className="absolute inset-0 z-10 flex items-center justify-center p-4 bg-background/40 backdrop-blur-[2px] rounded-xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          className={`text-center space-y-3 max-w-sm bg-card/95 border ${pending ? "border-warning/40" : "border-primary/30"} rounded-2xl shadow-2xl ${
            compact ? "p-4" : "p-6"
          }`}
        >
          <div className="relative w-12 h-12 mx-auto">
            <div className={`absolute inset-0 rounded-full ${pending ? "bg-warning/10" : "bg-primary/10"} animate-ping`} />
            <div className={`relative w-12 h-12 rounded-full bg-gradient-to-br ${pending ? "from-warning to-warning/60" : "from-primary to-primary/60"} flex items-center justify-center shadow-lg`}>
              {pending ? (
                <Clock className="w-5 h-5 text-primary-foreground" />
              ) : (
                <Lock className="w-5 h-5 text-primary-foreground" />
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-center gap-1 mb-1">
              <Sparkles className={`w-3 h-3 ${pending ? "text-warning" : "text-warning"}`} />
              <span className={`text-[10px] font-bold uppercase tracking-wider ${pending ? "text-warning" : "text-warning"}`}>
                {pending ? "Pending Admin Verification" : "Premium Locked"}
              </span>
              <Sparkles className="w-3 h-3 text-warning" />
            </div>
            <h3 className={`font-bold text-foreground ${compact ? "text-sm" : "text-base"}`}>
              {featureName}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              {pending
                ? "Your payment is recorded. An admin must verify your receipt before this analysis tool unlocks."
                : "Upgrade to unlock advanced analysis tools. Admin verification required after payment."}
            </p>
          </div>

          {pending ? (
            <div className="w-full px-4 py-2.5 bg-warning/10 text-warning border border-warning/30 font-bold text-xs rounded-xl inline-flex items-center justify-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              Awaiting verification
            </div>
          ) : (
            <button
              onClick={() => onUpgrade(featureName)}
              className="w-full px-4 py-2.5 bg-gradient-brand text-primary-foreground font-bold text-xs rounded-xl hover-lift glow-red inline-flex items-center justify-center gap-2"
            >
              <Crown className="w-3.5 h-3.5" />
              Upgrade to Premium
            </button>
          )}

          <p className="text-[9px] text-muted-foreground">
            Trading panel remains fully accessible
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default AnalysisPaywall;
