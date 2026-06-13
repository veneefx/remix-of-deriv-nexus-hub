import { useState, useCallback, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import Loader from "@/components/Loader";
import LandingPage from "@/components/landing/LandingPage";

const Index = () => {
  const [loading, setLoading] = useState(() => sessionStorage.getItem("dnx_landing_loader_seen") !== "1");

  const handleComplete = useCallback(() => {
    setLoading(false);
    sessionStorage.setItem("dnx_landing_loader_seen", "1");
  }, []);

  useEffect(() => {
    if (!loading) {
      sessionStorage.setItem("dnx_landing_loader_seen", "1");
    }
  }, [loading]);

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
