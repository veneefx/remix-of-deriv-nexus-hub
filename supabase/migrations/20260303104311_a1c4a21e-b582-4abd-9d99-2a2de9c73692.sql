
-- Create global strategy table for admin-controlled bot configuration
CREATE TABLE public.global_strategy (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  version INTEGER NOT NULL DEFAULT 1,
  profiles JSONB NOT NULL DEFAULT '{
    "aggressive": {
      "digit_frequency_threshold": 0.12,
      "momentum_weight": 0.8,
      "confluence_required": false,
      "max_open_trades": 3,
      "minimum_tick_history": 30
    },
    "balanced": {
      "digit_frequency_threshold": 0.15,
      "momentum_weight": 0.6,
      "confluence_required": true,
      "max_open_trades": 2,
      "minimum_tick_history": 50
    },
    "conservative": {
      "digit_frequency_threshold": 0.18,
      "momentum_weight": 0.4,
      "confluence_required": true,
      "max_open_trades": 1,
      "minimum_tick_history": 80
    }
  }'::jsonb,
  risk_global JSONB NOT NULL DEFAULT '{
    "martingale_enabled": true,
    "multiplier": 2.2,
    "max_recovery_steps": 10,
    "daily_loss_limit": 100,
    "daily_profit_target": 1000,
    "secure_partial_profit_percent": 50,
    "stop_after_loss_streak": 10
  }'::jsonb,
  recovery_global JSONB NOT NULL DEFAULT '{
    "reset_after_win": true,
    "start_martingale_after": 1
  }'::jsonb,
  digit_settings JSONB NOT NULL DEFAULT '{
    "allowed_digits": [0,1,2,3,4,5,6,7,8,9],
    "trade_types": ["DIGITEVEN","DIGITODD","DIGITOVER","DIGITUNDER"],
    "sequence_detection": true
  }'::jsonb,
  rise_fall_settings JSONB NOT NULL DEFAULT '{
    "support_resistance_enabled": true,
    "minimum_trend_strength": 0.6,
    "timeframe": "1m",
    "allowed_contract_types": ["CALL","PUT"]
  }'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.global_strategy ENABLE ROW LEVEL SECURITY;

-- Everyone can read active strategy (needed for bot engine)
CREATE POLICY "Anyone can read active strategy"
ON public.global_strategy FOR SELECT
USING (true);

-- Only admins can modify strategy
CREATE POLICY "Admins can update strategy"
ON public.global_strategy FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true
));

CREATE POLICY "Admins can insert strategy"
ON public.global_strategy FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true
));

-- Trigger for updated_at
CREATE TRIGGER update_global_strategy_updated_at
BEFORE UPDATE ON public.global_strategy
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create user_plans table for subscription management
CREATE TABLE public.user_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_type TEXT NOT NULL DEFAULT 'free_trial',
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  expiry_date TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own plan"
ON public.user_plans FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all plans"
ON public.user_plans FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true
));

CREATE POLICY "Admins can manage plans"
ON public.user_plans FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.user_id = auth.uid() AND profiles.is_admin = true
));

CREATE TRIGGER update_user_plans_updated_at
BEFORE UPDATE ON public.user_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default strategy
INSERT INTO public.global_strategy (version, active) VALUES (1, true);
