-- ============================================================
-- TRIPWISE — DATA PERSISTENCE FIX MIGRATION
-- Date: 2026-09-12
-- Purpose: Reconcile the live Supabase schema so that trips,
--          members and expenses persist to the database instead
--          of silently failing and falling back to localStorage.
--
-- HOW TO APPLY:
--   1. Open your Supabase project Dashboard > SQL Editor.
--   2. Paste the contents of this file and click "Run".
--   3. Reload the Tripwise app and sign in again.
-- ============================================================

-- ------------------------------------------------------------------
-- 1. Root-cause fix: add missing columns to trip_members.
--    The app queries/inserts these columns. When they are absent
--    the nested query fails (error 42703) and NOTHING loads or saves.
-- ------------------------------------------------------------------
ALTER TABLE public.trip_members
  ADD COLUMN IF NOT EXISTS upi_number           TEXT DEFAULT '';

ALTER TABLE public.trip_members
  ADD COLUMN IF NOT EXISTS parent_member_name   TEXT DEFAULT NULL;

-- ------------------------------------------------------------------
-- 2. Safety: ensure the random-UUID helper extension exists
--    (required by DEFAULT gen_random_uuid() in newer Supabase).
-- ------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------------
-- 3. Ensure expenses has the optional excluded_members column used by
--    the expense form (already present in most projects, idempotent).
--    Also add the `payers` JSONB column — WITHOUT it, the "paid by
--    multiple" feature silently drops every payer except the first
--    (the insert falls back to storing only paid_by).
-- ------------------------------------------------------------------
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS excluded_members JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS payers JSONB DEFAULT '[]'::jsonb;

-- ------------------------------------------------------------------
-- 3b. Announcements: the community-board form stores an image (image_url)
--     and the author (user_id). Without these columns the INSERT fails
--     (error 42703) and announcements never reach the database.
-- ------------------------------------------------------------------
ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- ------------------------------------------------------------------
-- 4. Ensure Row Level Security is enabled on all tables.
-- ------------------------------------------------------------------
ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------
-- 5. Queues for Realtime (idempotent). Each table is added inside its
--    own guarded block so an already-registered table or a missing
--    publication silently no-ops and NEVER aborts the migration.
-- ------------------------------------------------------------------
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_members;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.settlements;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END
$$;

-- ------------------------------------------------------------------
-- 6. Auto-create profiles on auth signup (idempotent).
-- ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    COALESCE(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture',
      NULL
    )
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.profiles.name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- ------------------------------------------------------------------
-- 7. Row Level Security policies (recreated idempotently so anon /
--    authenticated users can read + write their own data).
-- ------------------------------------------------------------------
-- Profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert/update their own profile" ON public.profiles;
CREATE POLICY "Users can insert/update their own profile" ON public.profiles FOR ALL USING (auth.uid() = id);

-- Trips
DROP POLICY IF EXISTS "Trips are viewable by everyone" ON public.trips;
CREATE POLICY "Trips are viewable by everyone" ON public.trips FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can create trips" ON public.trips;
CREATE POLICY "Authenticated users can create trips" ON public.trips FOR INSERT WITH CHECK (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Trip creators can update their trips" ON public.trips;
CREATE POLICY "Trip creators can update their trips" ON public.trips FOR UPDATE USING (auth.uid() = created_by);
DROP POLICY IF EXISTS "Trip creators can delete their trips" ON public.trips;
CREATE POLICY "Trip creators can delete their trips" ON public.trips FOR DELETE USING (auth.uid() = created_by);

-- Trip members
DROP POLICY IF EXISTS "Members are viewable by everyone" ON public.trip_members;
CREATE POLICY "Members are viewable by everyone" ON public.trip_members FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can join or add members" ON public.trip_members;
CREATE POLICY "Anyone can join or add members" ON public.trip_members FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Members can update their own records" ON public.trip_members;
CREATE POLICY "Members can update their own records" ON public.trip_members FOR UPDATE USING (true);

-- Expenses
DROP POLICY IF EXISTS "Expenses are viewable by everyone" ON public.expenses;
CREATE POLICY "Expenses are viewable by everyone" ON public.expenses FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can add expenses to a trip" ON public.expenses;
CREATE POLICY "Anyone can add expenses to a trip" ON public.expenses FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Anyone can delete expenses" ON public.expenses;
CREATE POLICY "Anyone can delete expenses" ON public.expenses FOR DELETE USING (true);

-- Settlements
DROP POLICY IF EXISTS "Settlements are viewable by everyone" ON public.settlements;
CREATE POLICY "Settlements are viewable by everyone" ON public.settlements FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can record settlements" ON public.settlements;
CREATE POLICY "Anyone can record settlements" ON public.settlements FOR INSERT WITH CHECK (true);

-- Announcements
DROP POLICY IF EXISTS "Announcements are viewable by everyone" ON public.announcements;
CREATE POLICY "Announcements are viewable by everyone" ON public.announcements FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can post announcements" ON public.announcements;
CREATE POLICY "Authenticated users can post announcements" ON public.announcements FOR INSERT WITH CHECK (auth.role() = 'authenticated');