import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const COMMISSION_RATE = 0.03; // 3% commission markup

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const appId = Deno.env.get('DERIV_APP_ID');
    if (!appId) {
      return new Response(JSON.stringify({ error: 'App ID not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { action, params } = body;

    // For config request, return the app ID for WebSocket connection
    if (action === 'get_config') {
      return new Response(JSON.stringify({ app_id: appId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // For commission calculation
    if (action === 'calculate_commission') {
      const { amount } = params;
      const commission = amount * COMMISSION_RATE;
      const totalAmount = amount + commission;
      return new Response(JSON.stringify({
        original_amount: amount,
        commission,
        commission_rate: COMMISSION_RATE,
        total_amount: totalAmount,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // For tick history - proxy to Deriv REST API
    if (action === 'tick_history') {
      const { symbol, count = 100 } = params;
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

    // For active symbols
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
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
