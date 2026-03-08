import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const COMMISSION_RATE = 0.03;

// Helper: send a single request via WebSocket to Deriv and get response
function derivWsRequest(appId: string, payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${appId}`);
    const timeout = setTimeout(() => {
      try { ws.close(); } catch (_) {}
      reject(new Error("Deriv WebSocket timeout"));
    }, 15000);

    ws.onopen = () => {
      ws.send(JSON.stringify(payload));
    };
    ws.onmessage = (event) => {
      clearTimeout(timeout);
      try {
        const data = JSON.parse(event.data);
        resolve(data);
      } catch (e) {
        reject(e);
      }
      try { ws.close(); } catch (_) {}
    };
    ws.onerror = (err) => {
      clearTimeout(timeout);
      reject(new Error("WebSocket error"));
    };
    ws.onclose = () => {
      clearTimeout(timeout);
    };
  });
}

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

    // Config request
    if (action === 'get_config') {
      return new Response(JSON.stringify({ app_id: appId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Commission calculation
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

    // Tick history — use WebSocket (Deriv REST API doesn't support POST for this)
    if (action === 'tick_history') {
      const { symbol, count = 100 } = params;
      const data = await derivWsRequest(appId, {
        ticks_history: symbol,
        count,
        end: 'latest',
        style: 'ticks',
      });
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Active symbols
    if (action === 'active_symbols') {
      const data = await derivWsRequest(appId, {
        active_symbols: 'brief',
        product_type: 'basic',
      });
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
