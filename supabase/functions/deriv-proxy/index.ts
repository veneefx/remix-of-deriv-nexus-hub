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
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) return unauthorized();

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

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
