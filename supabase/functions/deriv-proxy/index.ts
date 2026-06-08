import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const COMMISSION_RATE = 0.03; // 3% commission markup

const unauthorized = () =>
  new Response(JSON.stringify({ error: 'Unauthorized' }), {
    status: 401,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Require a valid Supabase JWT for every action ──
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return unauthorized();
    const token = authHeader.replace('Bearer ', '');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user?.id) return unauthorized();

    const appId = Deno.env.get('DERIV_APP_ID');
    if (!appId) {
      return new Response(JSON.stringify({ error: 'App ID not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { action, params } = body;

    // get_config intentionally REMOVED — the client should not receive
    // the platform's Deriv App ID. The app id is published in the deployed
    // client bundle as a non-secret constant; do not echo it from a server
    // secret to authenticated callers.
    if (action === 'get_config') {
      return new Response(JSON.stringify({ error: 'Disabled' }), {
        status: 410,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'calculate_commission') {
      const amount = Number(params?.amount);
      if (!Number.isFinite(amount) || amount < 0) {
        return new Response(JSON.stringify({ error: 'Invalid amount' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const commission = amount * COMMISSION_RATE;
      return new Response(JSON.stringify({
        original_amount: amount,
        commission,
        commission_rate: COMMISSION_RATE,
        total_amount: amount + commission,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'tick_history') {
      const symbol = String(params?.symbol ?? '');
      const count = Math.min(Math.max(Number(params?.count) || 100, 1), 1000);
      if (!/^[A-Z0-9_]{1,32}$/.test(symbol)) {
        return new Response(JSON.stringify({ error: 'Invalid symbol' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const url = `https://api.deriv.com/v3?app_id=${appId}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticks_history: symbol,
          count,
          end: 'latest',
          style: 'ticks',
        }),
      });
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'active_symbols') {
      const url = `https://api.deriv.com/v3?app_id=${appId}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active_symbols: 'brief', product_type: 'basic' }),
      });
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'exchange_oauth_code') {
      const code = String(params?.code ?? '');
      const codeVerifier = String(params?.codeVerifier ?? '');
      const redirectUri = String(params?.redirectUri ?? '');
      const state = String(params?.state ?? '');

      if (!code || !codeVerifier || !redirectUri || !state) {
        return new Response(JSON.stringify({ error: 'Missing OAuth parameters' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const tokenResponse = await fetch('https://auth.deriv.com/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: appId,
          code,
          code_verifier: codeVerifier,
          redirect_uri: redirectUri,
        }),
      });

      const tokenData = await tokenResponse.json();
      if (!tokenResponse.ok || !tokenData?.access_token) {
        return new Response(JSON.stringify({
          error: tokenData?.error_description || tokenData?.error || 'Token exchange failed',
          details: tokenData,
        }), {
          status: tokenResponse.status || 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const accountsResponse = await fetch('https://api.derivws.com/trading/v1/options/accounts', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'Deriv-App-ID': appId,
          Accept: 'application/json',
        },
      });

      const accountsData = await accountsResponse.json();
      const normalizedAccounts = Array.isArray(accountsData?.accounts)
        ? accountsData.accounts.map((account: any) => ({
            loginid: account.loginid || account.account_id || account.id || '',
            currency: account.currency || 'USD',
            is_virtual: String(account.loginid || account.account_id || account.id || '').startsWith('VRTC') || Boolean(account.is_virtual),
            token: tokenData.access_token,
          })).filter((account: any) => account.loginid)
        : [];

      if (normalizedAccounts.length === 0) {
        return new Response(JSON.stringify({
          error: 'No Deriv accounts were returned for this login',
          details: accountsData,
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        accounts: normalizedAccounts,
        access_token: tokenData.access_token,
        expires_in: tokenData.expires_in,
        token_type: tokenData.token_type,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('deriv-proxy unhandled error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
