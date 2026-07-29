import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getStoredAccounts } from "@/services/deriv-auth";

/**
 * Unified session state for public surfaces (navbar, landing hero).
 * A visitor counts as signed in when they either have a Lovable Cloud
 * account session OR a connected Deriv account stored locally.
 */
export const useAppSession = () => {
  const [hasAccount, setHasAccount] = useState(false);
  const [hasDeriv, setHasDeriv] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const readDeriv = () => {
      try {
        setHasDeriv(getStoredAccounts().length > 0);
      } catch {
        setHasDeriv(false);
      }
    };

    readDeriv();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setHasAccount(!!session?.user);
    });

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setHasAccount(!!data.user);
      setLoading(false);
    }).catch(() => active && setLoading(false));

    window.addEventListener("storage", readDeriv);
    window.addEventListener("focus", readDeriv);

    return () => {
      active = false;
      subscription.unsubscribe();
      window.removeEventListener("storage", readDeriv);
      window.removeEventListener("focus", readDeriv);
    };
  }, []);

  return {
    isSignedIn: hasAccount || hasDeriv,
    hasAccount,
    hasDeriv,
    loading,
  };
};

export default useAppSession;
