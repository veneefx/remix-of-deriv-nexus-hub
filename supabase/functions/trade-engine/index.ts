import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const DERIV_WS_URL = "wss://ws.derivws.com/websockets/v3";
const APP_ID = Deno.env.get("DERIV_APP_ID") || "129344";

// In-memory bot sessions (per edge function instance)
const activeBots = new Map<string, BotSession>();

interface BotSession {
  userId: string;
  token: string;
  symbol: string;
  contractType: string;
  stake: number;
  duration: number;
  durationUnit: string;
  barrier?: string;
  profile: string;
  executionMode: "normal" | "aggressive";
  status: "running" | "stopped";
  ws: WebSocket | null;
  tickBuffer: TickData[];
  digitPressure: Record<number, number>;
  lastDigits: number[];
  openContracts: string[];
  maxOpenTrades: number;
  currentStake: number;
  baseStake: number;
  consecutiveLosses: number;
  totalProfit: number;
  totalTrades: number;
  wins: number;
  losses: number;
  isProcessing: boolean;
  lastTradeTimestamp: number;
  strategy: any;
  proposalId: string | null;
  tickIndex: number;
  martingaleEnabled: boolean;
  martingaleMultiplier: number;
  maxRecoverySteps: number;
  dailyLossLimit: number;
  dailyProfitTarget: number;
  tradeLog: TradeLog[];
}

interface TickData {
  quote: number;
  digit: number;
  epoch: number;
}

interface TradeLog {
  contractId: string;
  contractType: string;
  stake: number;
  profit: number;
  won: boolean;
  timestamp: number;
}

function getLastDigit(quote: number): number {
  const formatted = Number(quote).toFixed(2);
  return parseInt(formatted[formatted.length - 1], 10);
}

// Signal scoring engine
function calculateSignalScore(bot: BotSession): { score: number; details: Record<string, number> } {
  const digits = bot.lastDigits;
  const total = digits.length;
  if (total < 30) return { score: 0, details: {} };

  // 1. Frequency score (25%)
  const freq = new Array(10).fill(0);
  digits.forEach(d => freq[d]++);
  const expectedPct = 10;
  let maxDeviation = 0;
  freq.forEach(count => {
    const pct = (count / total) * 100;
    maxDeviation = Math.max(maxDeviation, Math.abs(pct - expectedPct));
  });
  const frequencyScore = Math.min(maxDeviation / 10, 1);

  // 2. Pressure score (30%)
  let maxPressure = 0;
  for (let d = 0; d <= 9; d++) {
    const pressure = bot.digitPressure[d] || 0;
    maxPressure = Math.max(maxPressure, pressure);
  }
  const pressureScore = Math.min(maxPressure / 20, 1);

  // 3. Streak score (15%)
  let currentStreak = 1;
  let maxStreak = 1;
  for (let i = digits.length - 1; i > 0; i--) {
    if (digits[i] === digits[i - 1]) { currentStreak++; maxStreak = Math.max(maxStreak, currentStreak); }
    else { currentStreak = 1; }
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
  const recentTicks = bot.tickBuffer.slice(-20);
  let volatility = 0;
  for (let i = 1; i < recentTicks.length; i++) {
    volatility += Math.abs(recentTicks[i].quote - recentTicks[i - 1].quote);
  }
  const avgVol = recentTicks.length > 1 ? volatility / (recentTicks.length - 1) : 0;
  const volatilityScore = Math.min(avgVol * 100, 1);

  const score = frequencyScore * 0.25 + pressureScore * 0.30 + streakScore * 0.15 + patternScore * 0.15 + volatilityScore * 0.15;

  return {
    score,
    details: { frequencyScore, pressureScore, streakScore, patternScore, volatilityScore },
  };
}

function updateDigitPressure(bot: BotSession, digit: number) {
  bot.tickIndex++;
  // Reset the appeared digit's pressure
  bot.digitPressure[digit] = 0;
  // Increase pressure for all other digits
  for (let d = 0; d <= 9; d++) {
    if (d !== digit) {
      bot.digitPressure[d] = (bot.digitPressure[d] || 0) + 1;
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, params } = body;

    // GET BOT STATUS
    if (action === 'bot-status') {
      const { userId } = params;
      const bot = activeBots.get(userId);
      if (!bot) {
        return new Response(JSON.stringify({
          status: "stopped",
          totalTrades: 0, wins: 0, losses: 0, totalProfit: 0,
          lastDigits: [], tickBuffer: [], digitPressure: {},
          signalScore: 0, openContracts: 0, currentStake: 0,
          tradeLog: [],
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const signal = calculateSignalScore(bot);

      return new Response(JSON.stringify({
        status: bot.status,
        totalTrades: bot.totalTrades,
        wins: bot.wins,
        losses: bot.losses,
        totalProfit: bot.totalProfit,
        lastDigits: bot.lastDigits.slice(-100),
        tickBuffer: bot.tickBuffer.slice(-50).map(t => ({ quote: t.quote, digit: t.digit })),
        digitPressure: bot.digitPressure,
        signalScore: signal.score,
        signalDetails: signal.details,
        openContracts: bot.openContracts.length,
        currentStake: bot.currentStake,
        consecutiveLosses: bot.consecutiveLosses,
        tradeLog: bot.tradeLog.slice(-20),
        profile: bot.profile,
        executionMode: bot.executionMode,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // START BOT
    if (action === 'start-bot') {
      const { userId, token, symbol, contractType, stake, duration, durationUnit, barrier, profile, executionMode, maxOpenTrades } = params;

      // Prevent duplicate
      if (activeBots.has(userId) && activeBots.get(userId)!.status === "running") {
        return new Response(JSON.stringify({ error: "Bot already running", status: "running" }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Load strategy from database
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: strategyData } = await supabase
        .from('global_strategy')
        .select('*')
        .eq('active', true)
        .limit(1)
        .single();

      const strategy = strategyData || {};
      const profileConfig = strategy.profiles?.[profile] || {};
      const riskConfig = strategy.risk_global || {};

      const bot: BotSession = {
        userId,
        token,
        symbol: symbol || "R_10",
        contractType: contractType || "DIGITEVEN",
        stake: parseFloat(stake) || 3,
        duration: duration || 1,
        durationUnit: durationUnit || "t",
        barrier,
        profile: profile || "balanced",
        executionMode: executionMode || "normal",
        status: "running",
        ws: null,
        tickBuffer: [],
        digitPressure: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
        lastDigits: [],
        openContracts: [],
        maxOpenTrades: maxOpenTrades || profileConfig.max_open_trades || 2,
        currentStake: parseFloat(stake) || 3,
        baseStake: parseFloat(stake) || 3,
        consecutiveLosses: 0,
        totalProfit: 0,
        totalTrades: 0,
        wins: 0,
        losses: 0,
        isProcessing: false,
        lastTradeTimestamp: 0,
        strategy,
        proposalId: null,
        tickIndex: 0,
        martingaleEnabled: riskConfig.martingale_enabled ?? true,
        martingaleMultiplier: riskConfig.multiplier ?? 2.2,
        maxRecoverySteps: riskConfig.max_recovery_steps ?? 10,
        dailyLossLimit: riskConfig.daily_loss_limit ?? 100,
        dailyProfitTarget: riskConfig.daily_profit_target ?? 1000,
        tradeLog: [],
      };

      activeBots.set(userId, bot);

      // Note: Deno edge functions are stateless per request. 
      // The WebSocket-based persistent bot would need a long-running server.
      // For now, return success and let the frontend continue managing the WS connection
      // but use the backend for strategy evaluation, signal scoring, and trade decisions.

      return new Response(JSON.stringify({
        status: "running",
        message: "Bot session created",
        strategy: {
          version: strategy.version,
          profile: profileConfig,
          risk: riskConfig,
          recovery: strategy.recovery_global,
        },
        signalThreshold: profileConfig.digit_frequency_threshold || 0.15,
        maxOpenTrades: bot.maxOpenTrades,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // STOP BOT
    if (action === 'stop-bot') {
      const { userId } = params;
      const bot = activeBots.get(userId);
      if (bot) {
        bot.status = "stopped";
        if (bot.ws) {
          bot.ws.close();
          bot.ws = null;
        }
      }
      activeBots.delete(userId);
      return new Response(JSON.stringify({ status: "stopped" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // EVALUATE SIGNAL - called by frontend on each tick
    if (action === 'evaluate-signal') {
      const { userId, quote, digit, epoch, tickBuffer, lastDigits: clientDigits } = params;

      // Create temporary bot state for evaluation
      const tempBot: BotSession = {
        userId: userId || "temp",
        token: "",
        symbol: "",
        contractType: "",
        stake: 0,
        duration: 1,
        durationUnit: "t",
        profile: params.profile || "balanced",
        executionMode: params.executionMode || "normal",
        status: "running",
        ws: null,
        tickBuffer: (tickBuffer || []).map((t: any) => ({ quote: t.quote, digit: t.digit, epoch: t.epoch || 0 })),
        digitPressure: params.digitPressure || { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 },
        lastDigits: clientDigits || [],
        openContracts: [],
        maxOpenTrades: params.maxOpenTrades || 2,
        currentStake: params.currentStake || 3,
        baseStake: params.baseStake || 3,
        consecutiveLosses: params.consecutiveLosses || 0,
        totalProfit: params.totalProfit || 0,
        totalTrades: 0,
        wins: 0,
        losses: 0,
        isProcessing: false,
        lastTradeTimestamp: 0,
        strategy: null,
        proposalId: null,
        tickIndex: params.tickIndex || 0,
        martingaleEnabled: true,
        martingaleMultiplier: 2.2,
        maxRecoverySteps: 10,
        dailyLossLimit: 100,
        dailyProfitTarget: 1000,
        tradeLog: [],
      };

      // Update pressure
      updateDigitPressure(tempBot, digit);

      const signal = calculateSignalScore(tempBot);

      // Load strategy threshold
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

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
        // All three major components must be positive
        shouldTrade = shouldTrade && 
          signal.details.frequencyScore > 0.1 && 
          signal.details.pressureScore > 0.1 && 
          signal.details.streakScore > 0.05;
      }

      // Find highest pressure digit for smart trade suggestions
      let highestPressureDigit = 0;
      let highestPressure = 0;
      for (let d = 0; d <= 9; d++) {
        if ((tempBot.digitPressure[d] || 0) > highestPressure) {
          highestPressure = tempBot.digitPressure[d];
          highestPressureDigit = d;
        }
      }

      return new Response(JSON.stringify({
        shouldTrade,
        signalScore: signal.score,
        signalDetails: signal.details,
        threshold,
        digitPressure: tempBot.digitPressure,
        highestPressureDigit,
        highestPressure,
        strategyVersion: strategyData?.version,
        confluenceRequired,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // GET STRATEGY
    if (action === 'get-strategy') {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

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
