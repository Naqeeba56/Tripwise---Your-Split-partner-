-- ============================================================
-- TRIPWISE — EXPENSE OWNERSHIP + AUTHORIZATION MIGRATION
-- Date: 2026-09-22
-- Purpose:
--   1. Give expenses a creator identity so edit/delete can be
--      restricted to the expense creator OR the trip organizer.
--   2. Replace the wide-open Expenses RLS policies
--      ("Anyone can delete expenses" USING(true)) with policies
--      that verify the caller is the expense creator or the
--      trip organizer for UPDATE / DELETE.
--
-- HOW TO APPLY:
--   1. Supabase Dashboard > SQL Editor.
--   2. Paste the whole file and click "Run".
--   3. Reload Tripwise and sign in again.
-- ============================================================

-- ------------------------------------------------------------------
-- 1. Add creator columns to expenses (idempotent).
-- ------------------------------------------------------------------
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS added_by TEXT DEFAULT '';

-- Backfill existing rows: if we cannot map to a profile, they remain
-- "organizer-managed" (the trip creator can still manage them).
UPDATE public.expenses e
  SET user_id = t.created_by
  FROM public.trips t
  WHERE e.trip_id = t.id
    AND e.user_id IS NULL
    AND t.created_by IS NOT NULL;

-- ------------------------------------------------------------------
-- 2. Enable RLS (idempotent) if not already.
-- ------------------------------------------------------------------
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------
-- 3. Replace Expenses policies with creator/or-organizer scoping.
-- ------------------------------------------------------------------
-- Read stays open (the shared board model). Only writes are restricted.
DROP POLICY IF EXISTS "Expenses are viewable by everyone" ON public.expenses;
CREATE POLICY "Expenses are viewable by everyone"
  ON public.expenses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can add expenses to a trip" ON public.expenses;
CREATE POLICY "Authenticated users can add expenses"
  ON public.expenses FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Anyone can delete expenses" ON public.expenses;
DROP POLICY IF EXISTS "Expense creator or organizer can delete"
  ON public.expenses;
CREATE POLICY "Expense creator or organizer can delete"
  ON public.expenses FOR DELETE
  USING (
    auth.uid() = user_id
    OR trip_id IN (SELECT id FROM public.trips WHERE created_by = auth.uid())
  );

-- No UPDATE policy existed before; add one that scopes to creator/organizer.
DROP POLICY IF EXISTS "Expense creator or organizer can update"
  ON public.expenses;
CREATE POLICY "Expense creator or organizer can update"
  ON public.expenses FOR UPDATE
  USING (
    auth.uid() = user_id
    OR trip_id IN (SELECT id FROM public.trips WHERE created_by = auth.uid())
  );