
-- commission_ledger: remove user-facing INSERT policy. Inserts only via service role.
DROP POLICY IF EXISTS "System can insert commissions" ON public.commission_ledger;

-- profiles: replace public INSERT with authenticated-only insert that forbids privilege escalation.
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND is_admin = false
    AND is_premium = false
  );

-- trade_logs: enforce INSERT only for authenticated user inserting their own row.
DROP POLICY IF EXISTS "Users can insert own trade logs" ON public.trade_logs;
CREATE POLICY "Users can insert own trade logs"
  ON public.trade_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
