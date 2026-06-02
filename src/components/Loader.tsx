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
          setTimeout(onComplete, 500);
          return 100;
        }
        // Smoothly increment progress
        const increment = Math.random() * 4 + 1;
        return Math.min(prev + increment, 100);
      });
    }, 150);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#141414] font-['Poppins']"
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        {/* Subtle Background Glow */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#e41f28]/10 blur-[150px] rounded-full" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 flex flex-col items-center">
          {/* Logo with pulse animation */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ 
              scale: [0.9, 1, 0.95],
              opacity: 1 
            }}
            transition={{ 
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
              opacity: { duration: 0.8 }
            }}
            className="mb-12"
          >
            <img
              src={logo}
              alt="DNexus"
              className="w-56 md:w-72 drop-shadow-[0_0_20px_rgba(228,31,40,0.3)]"
            />
          </motion.div>

          {/* Tagline */}
          <motion.p
            className="text-gray-400 font-bold text-sm tracking-[0.4em] uppercase mb-12"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            The Future of Trading
          </motion.p>

          {/* Progress Bar Container */}
          <div className="w-64 md:w-80 h-1 bg-gray-800/50 rounded-full overflow-hidden relative">
            <motion.div
              className="absolute top-0 left-0 h-full bg-[#e41f28]"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.2, ease: "linear" }}
            />
          </div>

          {/* Percentage Counter */}
          <motion.span
            className="mt-6 text-gray-500 font-bold text-sm tracking-widest"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {Math.round(progress)}%
          </motion.span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Loader;
