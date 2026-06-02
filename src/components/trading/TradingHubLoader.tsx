import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.png";
import { Activity, BarChart3, Zap, Shield, TrendingUp } from "lucide-react";

const loadingSteps = [
  { icon: Activity, text: "Connecting to markets..." },
  { icon: BarChart3, text: "Loading analysis engine..." },
  { icon: Zap, text: "Initializing trading systems..." },
  { icon: Shield, text: "Securing connection..." },
  { icon: TrendingUp, text: "Preparing your dashboard..." },
];

const TradingHubLoader = ({ onComplete }: { onComplete: () => void }) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 400);
          return 100;
        }
        const increment = Math.random() * 5 + 2;
        return Math.min(prev + increment, 100);
      });
    }, 120);
    return () => clearInterval(interval);
  }, [onComplete]);

  useEffect(() => {
    const stepIndex = Math.min(Math.floor(progress / 20), loadingSteps.length - 1);
    setCurrentStep(stepIndex);
  }, [progress]);

  const StepIcon = loadingSteps[currentStep].icon;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Animated background pulses */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
            style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 70%)" }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full"
            style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.05) 0%, transparent 70%)" }}
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="relative z-10 flex flex-col items-center px-6">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mb-6"
          >
            <img src={logo} alt="DNexus" className="w-40 md:w-52 drop-shadow-lg" />
          </motion.div>

          {/* Animated orbit dots */}
          <motion.div className="relative w-24 h-24 mb-8">
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="absolute w-2.5 h-2.5 rounded-full bg-primary"
                style={{ top: "50%", left: "50%", marginTop: -5, marginLeft: -5 }}
                animate={{
                  x: Math.cos((i * Math.PI) / 2) * 36,
                  y: Math.sin((i * Math.PI) / 2) * 36,
                  scale: [1, 1.3, 1],
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "easeInOut",
                }}
              />
            ))}
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <StepIcon className="w-6 h-6 text-primary" />
            </motion.div>
          </motion.div>

          {/* Loading step text */}
          <AnimatePresence mode="wait">
            <motion.p
              key={currentStep}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="text-sm text-muted-foreground font-medium mb-6 h-5"
            >
              {loadingSteps[currentStep].text}
            </motion.p>
          </AnimatePresence>

          {/* Progress bar */}
          <div className="w-56 md:w-72 h-1.5 bg-secondary rounded-full overflow-hidden mb-3">
            <motion.div
              className="h-full rounded-full bg-primary"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.15 }}
            />
          </div>

          {/* Percentage */}
          <span className="text-xs text-muted-foreground font-mono tracking-wider">
            {Math.round(progress)}%
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TradingHubLoader;
