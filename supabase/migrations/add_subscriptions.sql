-- TRIPWISE PRO SUBSCRIPTIONS
-- Run in Supabase SQL Editor (Dashboard > SQL Editor). Idempotent.
-- 15-day free trial + coupon discount + admin-approved UPI activation.

-- 1. Subscriptions table (one row per user)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    email TEXT,
    -- plan: 'free' | 'trial' | 'pro'
    plan TEXT NOT NULL DEFAULT 'free',
    -- status: 'trial' | 'pending' | 'active' | 'expired' | 'rejected'
    status TEXT NOT NULL DEFAULT 'trial',
    trial_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    trial_ends_at   TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '15 days'),
    started_at  TIMESTAMP WITH TIME ZONE,
    expires_at  TIMESTAMP WITH TIME ZONE,
    coupon_code TEXT,
    discount_pct NUMERIC DEFAULT 0,
    amount_paid NUMERIC DEFAULT 0,
    upi_transaction_id TEXT,
    notes TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Coupons table (seed with any default promotional codes)
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    discount_pct NUMERIC NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT true,
    max_uses INTEGER,
    used_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed default coupon(s) — change code/discount to your preference.
INSERT INTO public.coupons (code, discount_pct, active) VALUES
    ('TRIP10', 10, true)
ON CONFLICT (code) DO NOTHING;

-- 3. Admin check (must match src/lib/admin.js ADMIN_EMAILS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT lower(coalesce(auth.jwt()->>'email', '')) IN
    ('naqeeba56@gmail.com', 'naqeeba@gmail.com');
$$;

-- 4. RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons     ENABLE ROW LEVEL SECURITY;

-- Subscriptions: owner sees + manages own row; admins see/manage all.
DROP POLICY IF EXISTS "subs select own or admin"    ON public.subscriptions;
DROP POLICY IF EXISTS "subs insert own"             ON public.subscriptions;
DROP POLICY IF EXISTS "subs update own or admin"    ON public.subscriptions;

CREATE POLICY "subs select own or admin"  ON public.subscriptions FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "subs insert own"           ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Owner may flip to trial/pending/expired but can NEVER self-approve to 'active'.
CREATE POLICY "subs update own or admin"  ON public.subscriptions FOR UPDATE
    USING (auth.uid() = user_id OR public.is_admin())
    WITH CHECK (public.is_admin() OR NEW.status <> 'active');

-- Coupons: readable by everyone (used to compute the discounted price client side).
DROP POLICY IF EXISTS "coupons select all" ON public.coupons;
CREATE POLICY "coupons select all" ON public.coupons FOR SELECT USING (true);

-- 5. Admin-only RPC to approve/reject a pending plan. In SECURITY DEFINER scope so
--    it bypasses RLS, but it still refuses unless the caller's email is an admin.
DROP FUNCTION IF EXISTS public.admin_set_subscription_status(uuid, text, text);
CREATE OR REPLACE FUNCTION public.admin_set_subscription_status(
    p_user_id uuid,
    p_status  text,      -- 'active' | 'rejected'
    p_notes   text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE ok boolean := false;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Forbidden: admin only';
  END IF;

  UPDATE public.subscriptions
     SET status       = p_status,
         plan         = CASE WHEN p_status = 'active' THEN 'pro' ELSE plan END,
         started_at   = CASE WHEN p_status = 'active' AND started_at IS NULL THEN NOW() ELSE started_at END,
         expires_at   = CASE WHEN p_status = 'active' THEN NOW() + INTERVAL '1 year' ELSE expires_at END,
         approved_at  = CASE WHEN p_status = 'active' THEN NOW() ELSE approved_at END,
         rejected_at  = NULL,
         notes        = COALESCE(p_notes, notes),
         updated_at   = NOW()
   WHERE user_id = p_user_id
     AND status  IN ('pending', 'trial', 'expired', 'rejected');

  GET DIAGNOSTICS ok = ROW_COUNT;
  RETURN ok;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_subscription_status(uuid, text, text) TO authenticated;

-- 6. Realtime for live admin dashboard updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;