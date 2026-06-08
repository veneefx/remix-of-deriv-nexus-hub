
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket text NOT NULL,
  key text NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  window_start timestamptz NOT NULL DEFAULT now(),
  locked_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bucket, key)
);

GRANT ALL ON public.rate_limits TO service_role;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- No client-side access; only service_role (edge functions) reads/writes.
CREATE POLICY "rate_limits_no_client_access" ON public.rate_limits
  FOR ALL TO authenticated USING (false) WITH CHECK (false);

CREATE INDEX IF NOT EXISTS idx_rate_limits_bucket_key ON public.rate_limits (bucket, key);
CREATE INDEX IF NOT EXISTS idx_rate_limits_locked_until ON public.rate_limits (locked_until);

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _bucket text,
  _key text,
  _max_attempts int,
  _window_seconds int,
  _lockout_seconds int
) RETURNS TABLE(allowed boolean, retry_after_seconds int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row public.rate_limits%ROWTYPE;
  now_ts timestamptz := now();
BEGIN
  SELECT * INTO row FROM public.rate_limits
    WHERE bucket = _bucket AND key = _key FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.rate_limits (bucket, key, attempts, window_start)
      VALUES (_bucket, _key, 1, now_ts);
    RETURN QUERY SELECT true, 0;
    RETURN;
  END IF;

  IF row.locked_until IS NOT NULL AND row.locked_until > now_ts THEN
    RETURN QUERY SELECT false, EXTRACT(EPOCH FROM (row.locked_until - now_ts))::int;
    RETURN;
  END IF;

  IF row.window_start < now_ts - make_interval(secs => _window_seconds) THEN
    UPDATE public.rate_limits SET attempts = 1, window_start = now_ts,
      locked_until = NULL, updated_at = now_ts
      WHERE bucket = _bucket AND key = _key;
    RETURN QUERY SELECT true, 0;
    RETURN;
  END IF;

  IF row.attempts + 1 > _max_attempts THEN
    UPDATE public.rate_limits SET attempts = row.attempts + 1,
      locked_until = now_ts + make_interval(secs => _lockout_seconds),
      updated_at = now_ts
      WHERE bucket = _bucket AND key = _key;
    RETURN QUERY SELECT false, _lockout_seconds;
    RETURN;
  END IF;

  UPDATE public.rate_limits SET attempts = row.attempts + 1, updated_at = now_ts
    WHERE bucket = _bucket AND key = _key;
  RETURN QUERY SELECT true, 0;
END;
$$;

REVOKE ALL ON FUNCTION public.check_rate_limit(text, text, int, int, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, text, int, int, int) TO service_role;
