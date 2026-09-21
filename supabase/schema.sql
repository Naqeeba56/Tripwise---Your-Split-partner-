-- TRIPWISE SUPABASE DATABASE SCHEMA
-- Execute this SQL script in your Supabase SQL Editor (Dashboard > SQL Editor)

-- 1. Create Profiles Table (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    name TEXT NOT NULL DEFAULT 'Traveler',
    avatar_url TEXT,
    upi_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Trips Table
CREATE TABLE IF NOT EXISTS public.trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    image_url TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    creator_name TEXT NOT NULL DEFAULT 'Organizer',
    creator_upi TEXT DEFAULT '',
    invite_token TEXT UNIQUE NOT NULL DEFAULT substring(md5(random()::text), 1, 8),
    daily_budget_limit NUMERIC DEFAULT 0,
    expense_budget_limit NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Trip Members Table
CREATE TABLE IF NOT EXISTS public.trip_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    upi_id TEXT DEFAULT '',
    upi_number TEXT DEFAULT '',
    role TEXT DEFAULT 'member',
    parent_member_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(trip_id, name)
);

-- 4. Create Expenses Table
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    paid_by TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Food',
    payers JSONB DEFAULT '[]'::jsonb,
    excluded_members JSONB DEFAULT '[]'::jsonb,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create Settlements Table
CREATE TABLE IF NOT EXISTS public.settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    settlement_key TEXT NOT NULL,
    from_member TEXT NOT NULL,
    to_member TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'settled',
    method TEXT NOT NULL DEFAULT 'UPI',
    transaction_id TEXT,
    settled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create Community Announcements Table
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    creator_name TEXT NOT NULL,
    creator_avatar TEXT,
    title TEXT NOT NULL,
    destination TEXT NOT NULL,
    date_range TEXT NOT NULL,
    budget_per_person NUMERIC DEFAULT 0,
    description TEXT NOT NULL,
    contact_info TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert/update their own profile" ON public.profiles FOR ALL USING (auth.uid() = id);

-- Trips Policies (Public or Member Access)
CREATE POLICY "Trips are viewable by everyone" ON public.trips FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create trips" ON public.trips FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Trip creators can update their trips" ON public.trips FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Trip creators can delete their trips" ON public.trips FOR DELETE USING (auth.uid() = created_by);

-- Trip Members Policies
CREATE POLICY "Members are viewable by everyone" ON public.trip_members FOR SELECT USING (true);
CREATE POLICY "Anyone can join or add members" ON public.trip_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Members can update their own records" ON public.trip_members FOR UPDATE USING (true);

-- Expenses Policies
CREATE POLICY "Expenses are viewable by everyone" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "Anyone can add expenses to a trip" ON public.expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete expenses" ON public.expenses FOR DELETE USING (true);

-- Settlements Policies
CREATE POLICY "Settlements are viewable by everyone" ON public.settlements FOR SELECT USING (true);
CREATE POLICY "Anyone can record settlements" ON public.settlements FOR INSERT WITH CHECK (true);

-- Announcements Policies
CREATE POLICY "Announcements are viewable by everyone" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Authenticated users can post announcements" ON public.announcements FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Auto-profile creation trigger upon auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', NULL)
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

-- Enable Realtime for dynamic live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.settlements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
