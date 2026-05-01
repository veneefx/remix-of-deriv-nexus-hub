import { Lock, Crown, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface AnalysisPaywallProps {
  isPremium: boolean;
  isAdmin: boolean;
  featureName: string;
  onUpgrade: (featureName: string) => void;
  children: React.ReactNode;
  /** When true, the wrapped content stays fully interactive but blurred (preview style). */
  compact?: boolean;
}

/**
 * Permanent blur paywall for analysis surfaces.
 *
 * Access tiers:
 *  - Admin → always unlocked
 *  - Premium → unlocked
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
  if (isAdmin) return <>{children}</>;
  if (isPremium) return <>{children}</>;

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
          className={`text-center space-y-3 max-w-sm bg-card/95 border border-primary/30 rounded-2xl shadow-2xl ${
            compact ? "p-4" : "p-6"
          }`}
        >
          <div className="relative w-12 h-12 mx-auto">
            <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
            <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
              <Lock className="w-5 h-5 text-primary-foreground" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-center gap-1 mb-1">
              <Sparkles className="w-3 h-3 text-warning" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-warning">
                Premium Locked
              </span>
              <Sparkles className="w-3 h-3 text-warning" />
            </div>
            <h3 className={`font-bold text-foreground ${compact ? "text-sm" : "text-base"}`}>
              {featureName}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Upgrade to unlock advanced analysis tools.
            </p>
          </div>

          <button
            onClick={() => onUpgrade(featureName)}
            className="w-full px-4 py-2.5 bg-gradient-brand text-primary-foreground font-bold text-xs rounded-xl hover-lift glow-red inline-flex items-center justify-center gap-2"
          >
            <Crown className="w-3.5 h-3.5" />
            Upgrade to Premium
          </button>

          <p className="text-[9px] text-muted-foreground">
            Trading panel remains fully accessible
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default AnalysisPaywall;
