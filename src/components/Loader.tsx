import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/logo.png";

const Loader = ({ onComplete }: { onComplete: () => void }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 400);
          return 100;
        }
        return prev + Math.random() * 3 + 1;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#141414]"
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Red glow behind logo */}
        <div className="absolute w-96 h-96 rounded-full bg-[#e41f28]/20 blur-[120px] animate-pulse" />

        {/* Logo with pulse effect */}
        <motion.img
          src={logo}
          alt="DNexus"
          className="w-64 md:w-80 relative z-10"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />

        {/* Branding text */}
        <motion.p
          className="mt-8 font-semibold text-base tracking-widest text-gray-400 uppercase"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          The Future of Trading
        </motion.p>

        {/* Loading bar */}
        <div className="mt-10 w-64 h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#e41f28] to-[#ff6666] rounded-full"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>

        {/* Progress percentage */}
        <motion.span
          className="mt-4 text-sm text-gray-500 font-mono"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {Math.round(progress)}%
        </motion.span>
      </motion.div>
    </AnimatePresence>
  );
};

export default Loader;
