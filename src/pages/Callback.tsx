import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { parseCallbackParams, storeAccounts, setActiveAccount } from "@/services/deriv-auth";
import logo from "@/assets/logo.png";

const Callback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const accounts = parseCallbackParams();

    if (accounts.length > 0) {
      storeAccounts(accounts);
      // Prefer first real account (CR), fallback to first account
      const realAccount = accounts.find((a) => !a.is_virtual) || accounts[0];
      setActiveAccount(realAccount);
      // Clean URL params
      window.history.replaceState({}, document.title, "/trading");
      navigate("/trading", { replace: true });
    } else {
      // Check if already has stored accounts (page refresh scenario)
      navigate("/", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <img src={logo} alt="DTNexus" className="w-24 mx-auto animate-pulse-glow" />
        <p className="text-sm text-muted-foreground">Authenticating with Deriv...</p>
        <div className="w-8 h-8 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
};

export default Callback;
