-- TRIPWISE ADMIN USER STATS
-- Run in Supabase SQL Editor (Dashboard > SQL Editor). Idempotent.
--
-- WHY THIS EXISTS:
-- The admin dashboard counts "Registered Users" from the `profiles` table.
-- Some users logged in BEFORE the auto-profile trigger (handle_new_user) was
-- added, so they exist in `auth.users` but have NO row in `public.profiles`.
-- Those accounts were silently missing from analytics (e.g. 6 logged-in users
-- but only 4 profile rows). This migration:
--   1. Backfills a profile row for every auth user that is missing one.
--   2. Exposes an admin-only RPC that reads the REAL count direct from
--      auth.users, so "Registered Users" is always correct going forward.

-- 1. Backfill missing profiles -----------------------------------------------
INSERT INTO public.profiles (id, email, name, avatar_url)
SELECT
  u.id,
  u.email,
  COALESCE(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    split_part(u.email, '@', 1)
  ),
  COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture', NULL)
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
ON CONFLICT (id) DO NOTHING;

-- 2. Admin-only RPC returning true registration counts from auth.users --------
-- SECURITY: marked SECURITY DEFINER so it bypasses RLS, but it RAISEs unless the
-- caller's JWT email is in the admin allow-list (kept in sync with src/lib/admin.js).
DROP FUNCTION IF EXISTS public.admin_user_stats();
CREATE OR REPLACE FUNCTION public.admin_user_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _admin   boolean;
  _total   integer;
  _prf     integer;
  _emails  text[];
BEGIN
  _admin := lower(coalesce(auth.jwt()->>'email', '')) IN ('naqeeba56@gmail.com', 'naqeeba@gmail.com');
  IF NOT _admin THEN
    RAISE EXCEPTION 'Forbidden: admin only';
  END IF;

  SELECT count(*)::int INTO _total FROM auth.users;
  SELECT count(*)::int INTO _prf   FROM public.profiles;
  SELECT coalesce(array_agg(email ORDER BY created_at), '{}') INTO _emails FROM auth.users;

  RETURN jsonb_build_object(
    'total',       _total,
    'profiles',    _prf,
    'emails',      _emails
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_user_stats() TO authenticated;