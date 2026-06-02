-- Drop the over-permissive update policy
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Allow users to update their own profile but only safe columns.
-- Sensitive columns (is_admin, is_premium, free_trial_until, email, user_id)
-- must remain identical to the existing row, blocking self-elevation.
CREATE POLICY "Users can update own profile safe fields"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND is_admin   = (SELECT p.is_admin   FROM public.profiles p WHERE p.user_id = auth.uid())
  AND is_premium = (SELECT p.is_premium FROM public.profiles p WHERE p.user_id = auth.uid())
  AND free_trial_until IS NOT DISTINCT FROM
      (SELECT p.free_trial_until FROM public.profiles p WHERE p.user_id = auth.uid())
  AND email = (SELECT p.email FROM public.profiles p WHERE p.user_id = auth.uid())
  AND user_id = (SELECT p.user_id FROM public.profiles p WHERE p.user_id = auth.uid())
);