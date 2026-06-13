import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import Loader from "@/components/Loader";
import LandingPage from "@/components/landing/LandingPage";

const Index = () => {
  const [loading, setLoading] = useState(true);

  const handleComplete = useCallback(() => {
    setLoading(false);
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {loading && <Loader onComplete={handleComplete} />}
      </AnimatePresence>
      {!loading && <LandingPage />}
    </>
  );
};

export default Index;
