-- TRIPWISE ADMIN PAYMENT DETAILS + COUPON MANAGEMENT
-- Run in Supabase SQL Editor (Dashboard > SQL Editor). Idempotent.
--
-- Depends on add_subscriptions.sql (defines public.is_admin()).
-- Adds:
--   1. app_settings table  -> admin-editable bank/UPI details shown on /pro
--   2. coupons write policies (admin-only) + per-user coupon restriction (user_email)
--
-- RULES enforced here:
--   • app_settings  : any signed-in user may READ (they need the UPI id to pay),
--                     but only an admin may insert / update / delete.
--   • coupons       : anyone may READ (to preview the discounted price), but only
--                     an admin may create / edit / delete. A coupon may carry an
--                     optional user_email so it works for ONE specific user.

-- 1. App settings (key/value) -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_settings (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

INSERT INTO public.app_settings (key, value) VALUES
    ('upi_id',         'tripwise@upi'),
    ('upi_name',       'Tripwise'),
    ('bank_name',      ''),
    ('account_holder', ''),
    ('account_number', ''),
    ('ifsc',           '')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings select auth"   ON public.app_settings;
DROP POLICY IF EXISTS "settings insert admin"  ON public.app_settings;
DROP POLICY IF EXISTS "settings update admin"  ON public.app_settings;
DROP POLICY IF EXISTS "settings delete admin"  ON public.app_settings;

CREATE POLICY "settings select auth"   ON public.app_settings FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "settings insert admin"  ON public.app_settings FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "settings update admin"  ON public.app_settings FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "settings delete admin"  ON public.app_settings FOR DELETE USING (public.is_admin());

-- 2. Coupons: prepend admin-only write rules + single-user restriction ---------
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS user_email TEXT;
ALTER TABLE public.coupons ADD COLUMN IF NOT EXISTS label       TEXT;

DROP POLICY IF EXISTS "coupons insert admin" ON public.coupons;
DROP POLICY IF EXISTS "coupons update admin" ON public.coupons;
DROP POLICY IF EXISTS "coupons delete admin" ON public.coupons;

CREATE POLICY "coupons insert admin" ON public.coupons FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "coupons update admin" ON public.coupons FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "coupons delete admin" ON public.coupons FOR DELETE USING (public.is_admin());