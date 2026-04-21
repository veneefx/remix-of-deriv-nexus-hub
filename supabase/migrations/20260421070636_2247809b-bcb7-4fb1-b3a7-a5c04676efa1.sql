CREATE TABLE public.user_trading_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  take_profit NUMERIC,
  stop_loss NUMERIC,
  base_stake NUMERIC DEFAULT 3,
  martingale_enabled BOOLEAN DEFAULT true,
  martingale_multiplier NUMERIC DEFAULT 2.2,
  max_martingale_steps INTEGER DEFAULT 10,
  start_martingale_after INTEGER DEFAULT 1,
  selected_strategy TEXT DEFAULT 'balanced',
  execution_speed TEXT DEFAULT 'normal',
  selected_market TEXT DEFAULT 'R_100',
  extra JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_trading_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings" ON public.user_trading_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON public.user_trading_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON public.user_trading_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings" ON public.user_trading_settings
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_user_trading_settings_updated_at
  BEFORE UPDATE ON public.user_trading_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();