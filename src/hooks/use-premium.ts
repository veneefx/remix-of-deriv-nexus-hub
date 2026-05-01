import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const ADMIN_EMAIL = 'victormurimiofficial@gmail.com';

export const usePremium = () => {
  const [isPremium, setIsPremium] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const checkPremiumStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsPremium(false);
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        setEmail(user.email || null);

        // Check if admin
        if (user.email === ADMIN_EMAIL) {
          setIsAdmin(true);
          setIsPremium(true);
          setLoading(false);
          return;
        }

        // Check premium status in profiles table
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_premium, is_admin')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          setIsPremium(profile.is_premium);
          setIsAdmin(profile.is_admin);
        }

        // Check if user has active subscription
        if (!profile?.is_premium) {
          const { data: plan } = await supabase
            .from('user_plans')
            .select('expiry_date')
            .eq('user_id', user.id)
            .gt('expiry_date', new Date().toISOString())
            .limit(1)
            .single();

          if (plan) {
            setIsPremium(true);
          }
        }
      } catch (error) {
        console.error('Error checking premium status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkPremiumStatus();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkPremiumStatus();
    });

    const refreshInterval = setInterval(checkPremiumStatus, 5000);

    const channel = supabase
      .channel('premium-status-sync')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles',
      }, () => {
        checkPremiumStatus();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_plans',
      }, () => {
        checkPremiumStatus();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'payments',
      }, () => {
        checkPremiumStatus();
      })
      .subscribe();

    return () => {
      subscription?.unsubscribe();
      clearInterval(refreshInterval);
      supabase.removeChannel(channel);
    };
  }, []);

  return { isPremium, isAdmin, loading, email };
};
