import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { clearStoredPkceSession, getStoredPkceSession, parseCallbackParams, storeAccounts, setActiveAccount } from "@/services/deriv-auth";
import logo from "@/assets/dnexus-logo.png";

const Callback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const finishLogin = async () => {
      const legacyAccounts = parseCallbackParams();

      if (legacyAccounts.length > 0) {
        storeAccounts(legacyAccounts);
        const realAccount = legacyAccounts.find((a) => !a.is_virtual) || legacyAccounts[0];
        setActiveAccount(realAccount);
        window.history.replaceState({}, document.title, "/trading");
        navigate("/trading", { replace: true });
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const returnedState = params.get("state");
      const error = params.get("error");
      const errorDescription = params.get("error_description");

      if (error) {
        toast({ title: "Deriv connection failed", description: errorDescription || error, variant: "destructive" });
        clearStoredPkceSession();
        navigate("/trading", { replace: true });
        return;
      }

      if (!code) {
        navigate("/", { replace: true });
        return;
      }

      const pkce = getStoredPkceSession();
      if (!pkce || !returnedState || pkce.state !== returnedState) {
        toast({ title: "Deriv connection failed", description: "Secure login session expired. Please try again.", variant: "destructive" });
        clearStoredPkceSession();
        navigate("/trading", { replace: true });
        return;
      }

      const { data, error: invokeError } = await supabase.functions.invoke("deriv-proxy", {
        body: {
          action: "exchange_oauth_code",
          params: {
            code,
            codeVerifier: pkce.codeVerifier,
            redirectUri: pkce.redirectUri,
            state: pkce.state,
          },
        },
      });

      clearStoredPkceSession();

      if (invokeError || !data?.accounts?.length) {
        toast({ title: "Deriv connection failed", description: data?.error || invokeError?.message || "Could not complete login.", variant: "destructive" });
        navigate("/trading", { replace: true });
        return;
      }

      const accounts = data.accounts;
      storeAccounts(accounts);
      const realAccount = accounts.find((a: any) => !a.is_virtual) || accounts[0];
      setActiveAccount(realAccount);
      window.history.replaceState({}, document.title, "/trading");
      navigate("/trading", { replace: true });
    };

    void finishLogin();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <img src={logo} alt="DNexus" className="w-24 mx-auto animate-pulse-glow" />
        <p className="text-sm text-muted-foreground">Authenticating with Deriv...</p>
        <div className="w-8 h-8 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
};

export default Callback;
