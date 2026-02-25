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
      // Set first real account as active, fallback to first account
      const realAccount = accounts.find((a) => !a.is_virtual) || accounts[0];
      setActiveAccount(realAccount);
      navigate("/trading", { replace: true });
    } else {
      // No valid tokens found, redirect to home
      navigate("/", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <img src={logo} alt="Dnexus" className="w-24 mx-auto animate-pulse-glow" />
        <p className="text-sm text-muted-foreground">Authenticating...</p>
      </div>
    </div>
  );
};

export default Callback;
