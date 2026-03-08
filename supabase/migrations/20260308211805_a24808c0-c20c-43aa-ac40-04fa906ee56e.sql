
-- =============================================
-- 1. FIX RLS: Make existing restrictive policies PERMISSIVE
-- =============================================

-- profiles: Drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE USING (public.is_admin(auth.uid()));

-- global_strategy: Drop restrictive and recreate as permissive
DROP POLICY IF EXISTS "Admins can insert strategy" ON public.global_strategy;
DROP POLICY IF EXISTS "Admins can update strategy" ON public.global_strategy;
DROP POLICY IF EXISTS "Anyone can read active strategy" ON public.global_strategy;

CREATE POLICY "Anyone can read active strategy" ON public.global_strategy FOR SELECT USING (true);
CREATE POLICY "Admins can insert strategy" ON public.global_strategy FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update strategy" ON public.global_strategy FOR UPDATE USING (public.is_admin(auth.uid()));

-- user_plans: Drop restrictive and recreate as permissive
DROP POLICY IF EXISTS "Admins can manage plans" ON public.user_plans;
DROP POLICY IF EXISTS "Admins can view all plans" ON public.user_plans;
DROP POLICY IF EXISTS "Users can view own plan" ON public.user_plans;

CREATE POLICY "Users can view own plan" ON public.user_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all plans" ON public.user_plans FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can insert plans" ON public.user_plans FOR INSERT WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update plans" ON public.user_plans FOR UPDATE USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete plans" ON public.user_plans FOR DELETE USING (public.is_admin(auth.uid()));

-- =============================================
-- 2. CREATE trade_logs TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.trade_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  contract_id text NOT NULL,
  contract_type text NOT NULL,
  symbol text NOT NULL,
  stake numeric NOT NULL,
  profit numeric NOT NULL,
  won boolean NOT NULL DEFAULT false,
  executed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.trade_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own trade logs" ON public.trade_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own trade logs" ON public.trade_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all trade logs" ON public.trade_logs FOR SELECT USING (public.is_admin(auth.uid()));

-- =============================================
-- 3. CREATE payments TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  method text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  plan_type text NOT NULL,
  reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own payments" ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all payments" ON public.payments FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update payments" ON public.payments FOR UPDATE USING (public.is_admin(auth.uid()));

-- Trigger to auto-update updated_at
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 4. CREATE commission_ledger TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.commission_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  trade_id uuid REFERENCES public.trade_logs(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  rate numeric NOT NULL DEFAULT 0.03,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.commission_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all commissions" ON public.commission_ledger FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "System can insert commissions" ON public.commission_ledger FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 5. Payment confirmation trigger to activate premium
-- =============================================
CREATE OR REPLACE FUNCTION public.on_payment_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  plan_duration interval;
BEGIN
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    plan_duration := CASE NEW.plan_type
      WHEN 'daily' THEN interval '1 day'
      WHEN '3day' THEN interval '3 days'
      WHEN 'weekly' THEN interval '7 days'
      WHEN 'monthly' THEN interval '30 days'
      WHEN '6month' THEN interval '180 days'
      WHEN 'lifetime' THEN interval '100 years'
      ELSE interval '30 days'
    END;

    INSERT INTO public.user_plans (user_id, plan_type, start_date, expiry_date)
    VALUES (NEW.user_id, NEW.plan_type, now(), now() + plan_duration)
    ON CONFLICT (user_id) DO UPDATE SET
      plan_type = EXCLUDED.plan_type,
      start_date = EXCLUDED.start_date,
      expiry_date = EXCLUDED.expiry_date,
      updated_at = now();

    UPDATE public.profiles SET is_premium = true WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER payment_confirmed_trigger
  AFTER UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION on_payment_confirmed();

-- Add unique constraint on user_plans.user_id for upsert
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_plans_user_id_key') THEN
    ALTER TABLE public.user_plans ADD CONSTRAINT user_plans_user_id_key UNIQUE (user_id);
  END IF;
END $$;
