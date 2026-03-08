import { useState, useEffect, useRef } from "react";
import { Lock, Clock, Crown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PremiumGateProps {
  isPremium: boolean;
  isAdmin: boolean;
  featureName: string;
  onUpgrade: (featureName: string) => void;
  children: React.ReactNode;
  previewSeconds?: number;
}

const PremiumGate = ({
  isPremium,
  isAdmin,
  featureName,
  onUpgrade,
  children,
  previewSeconds = 20,
}: PremiumGateProps) => {
  const [secondsLeft, setSecondsLeft] = useState(previewSeconds);
  const [previewExpired, setPreviewExpired] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Admin or premium users get full access
  if (isPremium || isAdmin) {
    return <>{children}</>;
  }

  useEffect(() => {
    setSecondsLeft(previewSeconds);
    setPreviewExpired(false);

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setPreviewExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [previewSeconds]);

  if (previewExpired) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 h-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-5 max-w-md"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold text-foreground">Preview Ended</h3>
          <p className="text-sm text-muted-foreground">
            Your 20-second preview of <span className="font-semibold text-foreground">{featureName}</span> has ended. Upgrade to Premium for unlimited access to all analysis tools.
          </p>
          <button
            onClick={() => onUpgrade(featureName)}
            className="px-8 py-3 bg-gradient-brand text-primary-foreground font-semibold rounded-xl hover-lift glow-red inline-flex items-center gap-2"
          >
            <Crown className="w-4 h-4" />
            Upgrade to Premium
          </button>
        </motion.div>
      </div>
    );
  }

  // Preview mode — show content with countdown overlay
  return (
    <div className="relative h-full">
      {children}
      {/* Countdown overlay */}
      <div className="absolute top-3 right-3 z-50">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/90 backdrop-blur-md border border-border shadow-lg"
        >
          <Clock className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-bold text-foreground tabular-nums">
            {secondsLeft}s
          </span>
          <span className="text-[10px] text-muted-foreground">preview</span>
        </motion.div>
      </div>
      {/* Progress bar at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted z-50">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: "100%" }}
          animate={{ width: "0%" }}
          transition={{ duration: previewSeconds, ease: "linear" }}
        />
      </div>
    </div>
  );
};

export default PremiumGate;
