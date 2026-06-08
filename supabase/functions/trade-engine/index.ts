import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// ── Pure utility functions (no state) ──

interface TickData {
  quote: number;
  digit: number;
  epoch: number;
}

function calculateSignalScore(
  lastDigits: number[],
  digitPressure: Record<number, number>,
  tickBuffer: TickData[]
): { score: number; details: Record<string, number> } {
  const digits = lastDigits;
  const total = digits.length;
  if (total < 30) return { score: 0, details: {} };

  // 1. Frequency score (25%)
  const freq = new Array(10).fill(0);
  digits.forEach(d => freq[d]++);
  let maxDeviation = 0;
  freq.forEach(count => {
    const pct = (count / total) * 100;
    maxDeviation = Math.max(maxDeviation, Math.abs(pct - 10));
  });
  const frequencyScore = Math.min(maxDeviation / 10, 1);

  // 2. Pressure score (30%)
  let maxPressure = 0;
  for (let d = 0; d <= 9; d++) {
    maxPressure = Math.max(maxPressure, digitPressure[d] || 0);
  }
  const pressureScore = Math.min(maxPressure / 20, 1);

  // 3. Streak score (15%)
  let currentStreak = 1, maxStreak = 1;
  for (let i = digits.length - 1; i > 0; i--) {
    if (digits[i] === digits[i - 1]) { currentStreak++; maxStreak = Math.max(maxStreak, currentStreak); }
    else currentStreak = 1;
  }
  const streakScore = Math.min(maxStreak / 5, 1);

  // 4. Pattern score (15%)
  const last10 = digits.slice(-10);
  const patternsFound = new Set<string>();
  for (let i = 0; i <= last10.length - 3; i++) {
    patternsFound.add(last10.slice(i, i + 3).join(""));
  }
  const patternScore = Math.min(patternsFound.size / 8, 1);

  // 5. Volatility score (15%)
  const recentTicks = tickBuffer.slice(-20);
  let volatility = 0;
  for (let i = 1; i < recentTicks.length; i++) {
    volatility += Math.abs(recentTicks[i].quote - recentTicks[i - 1].quote);
  }
  const avgVol = recentTicks.length > 1 ? volatility / (recentTicks.length - 1) : 0;
  const volatilityScore = Math.min(avgVol * 100, 1);

  const score = frequencyScore * 0.25 + pressureScore * 0.30 + streakScore * 0.15 + patternScore * 0.15 + volatilityScore * 0.15;

  return { score, details: { frequencyScore, pressureScore, streakScore, patternScore, volatilityScore } };
}

function getSupabaseClient() {
  const url = Deno.env.get('SUPABASE_URL')!;
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(url, key);
}

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

    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );
    const { data: claimsData, error: claimsErr } = await supabaseAuth.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims?.sub) return unauthorized();
    const callerId = claimsData.claims.sub as string;

    const body = await req.json();
    const { action, params } = body;

    // ── EVALUATE SIGNAL: pure function, no state ──
    if (action === 'evaluate-signal') {
      const { digit, tickBuffer, lastDigits: clientDigits, digitPressure: clientPressure } = params;

      // Update pressure for latest digit
      const pressure = clientPressure || { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
      pressure[digit] = 0;
      for (let d = 0; d <= 9; d++) {
        if (d !== digit) pressure[d] = (pressure[d] || 0) + 1;
      }

      const ticks = (tickBuffer || []).map((t: any) => ({ quote: t.quote, digit: t.digit, epoch: t.epoch || 0 }));
      const signal = calculateSignalScore(clientDigits || [], pressure, ticks);

      // Load strategy threshold
      const supabase = getSupabaseClient();
      const { data: strategyData } = await supabase
        .from('global_strategy')
        .select('*')
        .eq('active', true)
        .limit(1)
        .single();

      const profileConfig = strategyData?.profiles?.[params.profile || "balanced"] || {};
      const threshold = profileConfig.digit_frequency_threshold || 0.15;
      const confluenceRequired = profileConfig.confluence_required ?? true;

      let shouldTrade = signal.score >= threshold;
      if (confluenceRequired) {
        shouldTrade = shouldTrade &&
          signal.details.frequencyScore > 0.1 &&
          signal.details.pressureScore > 0.1 &&
          signal.details.streakScore > 0.05;
      }

      // Find highest pressure digit
      let highestPressureDigit = 0, highestPressure = 0;
      for (let d = 0; d <= 9; d++) {
        if ((pressure[d] || 0) > highestPressure) {
          highestPressure = pressure[d];
          highestPressureDigit = d;
        }
      }

      return new Response(JSON.stringify({
        shouldTrade,
        signalScore: signal.score,
        signalDetails: signal.details,
        threshold,
        digitPressure: pressure,
        highestPressureDigit,
        highestPressure,
        strategyVersion: strategyData?.version,
        confluenceRequired,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ── GET STRATEGY ──
    if (action === 'get-strategy') {
      const supabase = getSupabaseClient();
      const { data } = await supabase
        .from('global_strategy')
        .select('*')
        .eq('active', true)
        .limit(1)
        .single();

      return new Response(JSON.stringify(data || {}), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── LOG TRADE: persist trade result to database ──
    if (action === 'log-trade') {
      // SECURITY: never trust userId from the body; derive from verified JWT.
      const { contractId, contractType, symbol, stake, profit, won } = params ?? {};
      if (
        typeof contractId !== 'string' ||
        typeof contractType !== 'string' ||
        typeof symbol !== 'string' ||
        !Number.isFinite(Number(stake)) ||
        !Number.isFinite(Number(profit)) ||
        typeof won !== 'boolean'
      ) {
        return new Response(JSON.stringify({ error: 'Invalid trade payload' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const supabase = getSupabaseClient();

      // Insert trade log under the authenticated caller's id
      const { data: tradeLog, error: tradeError } = await supabase
        .from('trade_logs')
        .insert({
          user_id: callerId,
          contract_id: contractId,
          contract_type: contractType,
          symbol,
          stake: Number(stake),
          profit: Number(profit),
          won,
        })
        .select('id')
        .single();

      if (tradeError) {
        return new Response(JSON.stringify({ error: tradeError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Insert commission record (3%)
      const commissionAmount = Math.abs(Number(profit)) * 0.03;
      if (commissionAmount > 0 && tradeLog) {
        await supabase.from('commission_ledger').insert({
          user_id: callerId,
          trade_id: tradeLog.id,
          amount: commissionAmount,
          rate: 0.03,
        });
      }

      return new Response(JSON.stringify({ success: true, tradeId: tradeLog?.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('trade-engine unhandled error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

