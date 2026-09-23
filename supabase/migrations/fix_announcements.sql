-- ============================================================
-- TRIPWISE — COMMUNITY ANNOUNCEMENTS FIX
-- Date: 2026-09-22
-- Purpose: "Post Trip Announcement" silently discarded every post because the
--          live table was missing the `user_id` and `image_url` columns. Each
--          INSERT failed with PostgreSQL 42703 ("column announcements.user_id
--          does not exist") and the app fell back to an in-memory-only post.
--
-- HOW TO APPLY:
--   1. Supabase Dashboard > SQL Editor.
--   2. Paste this file and click "Run" (fully idempotent).
--   3. Reload the app — posting an announcement now persists.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------------
-- 1. Create the table if it is missing entirely.
-- ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.announcements (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_id            UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  creator_name       TEXT NOT NULL DEFAULT 'Traveler',
  creator_avatar     TEXT,
  title              TEXT NOT NULL DEFAULT '',
  destination        TEXT NOT NULL DEFAULT '',
  date_range         TEXT NOT NULL DEFAULT 'Flexible Dates',
  budget_per_person  NUMERIC DEFAULT 0,
  description        TEXT NOT NULL DEFAULT '',
  contact_info       TEXT NOT NULL DEFAULT '',
  tags               TEXT[] DEFAULT '{}',
  image_url          TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------
-- 2. Add every column the app writes, one at a time (idempotent).
--    `user_id` + `image_url` are the two that were missing live.
-- ------------------------------------------------------------------
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS creator_id        UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS user_id           UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS creator_name      TEXT;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS creator_avatar    TEXT;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS title             TEXT;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS destination       TEXT;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS date_range        TEXT;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS budget_per_person NUMERIC DEFAULT 0;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS description       TEXT;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS contact_info      TEXT;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS tags              TEXT[] DEFAULT '{}';
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS image_url         TEXT;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS created_at        TIMESTAMPTZ DEFAULT NOW();

-- ------------------------------------------------------------------
-- 3. Relax NOT NULL / add defaults so a partially filled form can never
--    abort the whole INSERT.
-- ------------------------------------------------------------------
ALTER TABLE public.announcements ALTER COLUMN creator_name      SET DEFAULT 'Traveler';
ALTER TABLE public.announcements ALTER COLUMN title             SET DEFAULT '';
ALTER TABLE public.announcements ALTER COLUMN destination       SET DEFAULT '';
ALTER TABLE public.announcements ALTER COLUMN date_range        SET DEFAULT 'Flexible Dates';
ALTER TABLE public.announcements ALTER COLUMN description       SET DEFAULT '';
ALTER TABLE public.announcements ALTER COLUMN contact_info      SET DEFAULT '';
ALTER TABLE public.announcements ALTER COLUMN budget_per_person SET DEFAULT 0;
ALTER TABLE public.announcements ALTER COLUMN tags              SET DEFAULT '{}';
ALTER TABLE public.announcements ALTER COLUMN created_at        SET DEFAULT NOW();

-- ------------------------------------------------------------------
-- 4. Backfill so the two author columns stay consistent.
-- ------------------------------------------------------------------
UPDATE public.announcements SET user_id    = creator_id WHERE user_id    IS NULL AND creator_id IS NOT NULL;
UPDATE public.announcements SET creator_id = user_id    WHERE creator_id IS NULL AND user_id    IS NOT NULL;

-- ------------------------------------------------------------------
-- 5. RLS: everyone reads the public board, only a signed-in user can post,
--    and only the author can edit/delete their own post.
--    (An anonymous INSERT is what produced
--     "new row violates row-level security policy for table announcements".)
-- ------------------------------------------------------------------
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Announcements are viewable by everyone" ON public.announcements;
CREATE POLICY "Announcements are viewable by everyone"
  ON public.announcements FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can post announcements" ON public.announcements;
CREATE POLICY "Authenticated users can post announcements"
  ON public.announcements FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authors can update their announcements" ON public.announcements;
CREATE POLICY "Authors can update their announcements"
  ON public.announcements FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = creator_id);

DROP POLICY IF EXISTS "Authors can delete their announcements" ON public.announcements;
CREATE POLICY "Authors can delete their announcements"
  ON public.announcements FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = creator_id);

-- ------------------------------------------------------------------
-- 6. Realtime (guarded: a missing publication or an already-added table
--    must never abort this migration).
-- ------------------------------------------------------------------
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- ------------------------------------------------------------------
-- 7. Verification (run manually — should list user_id and image_url):
-- SELECT column_name, is_nullable, column_default
--   FROM information_schema.columns
--  WHERE table_schema = 'public' AND table_name = 'announcements'
--  ORDER BY ordinal_position;
-- ------------------------------------------------------------------
