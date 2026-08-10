-- ============================================
-- EXTENSIONS
-- ============================================
-- The application relies on standard PostgreSQL features.
-- UUIDs are generated using the standard `gen_random_uuid()` function available in PG 13+.

-- ============================================
-- TYPES / ENUMS
-- ============================================
-- Project status is enforced using a CHECK constraint below rather than a custom ENUM.

-- ============================================
-- TABLES
-- ============================================

-- --------------------------------------------
-- profiles
-- --------------------------------------------
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  avatar TEXT,
  bio TEXT,
  joined_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- --------------------------------------------
-- user_settings
-- --------------------------------------------
CREATE TABLE public.user_settings (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  theme TEXT DEFAULT 'light' NOT NULL,
  language TEXT DEFAULT 'en-US' NOT NULL,
  writing_tone TEXT DEFAULT 'professional' NOT NULL,
  default_ai_model TEXT DEFAULT 'gemini-2.5-pro' NOT NULL,
  byok_api_key TEXT, -- Bring Your Own Key
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT false,
  generation_alerts BOOLEAN DEFAULT true
);

-- --------------------------------------------
-- projects
-- --------------------------------------------
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  template TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('completed', 'draft', 'failed')),
  preview TEXT NOT NULL,
  word_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX projects_user_id_idx ON public.projects(user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to automatically create profile and settings on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, name, avatar)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'avatar_url', '')
  );

  -- Insert into user_settings
  INSERT INTO public.user_settings (id)
  VALUES (new.id);

  RETURN new;
END;
$$;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger for auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES
-- ============================================

-- --------------------------------------------
-- Profiles RLS policies
-- --------------------------------------------
CREATE POLICY "Users can view their own profile."
  ON public.profiles FOR SELECT
  USING ( auth.uid() = id );

CREATE POLICY "Users can update their own profile."
  ON public.profiles FOR UPDATE
  USING ( auth.uid() = id );

CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT
  WITH CHECK ( auth.uid() = id );

-- --------------------------------------------
-- User Settings RLS policies
-- --------------------------------------------
CREATE POLICY "Users can view their own settings."
  ON public.user_settings FOR SELECT
  USING ( auth.uid() = id );

CREATE POLICY "Users can update their own settings."
  ON public.user_settings FOR UPDATE
  USING ( auth.uid() = id );

CREATE POLICY "Users can insert their own settings."
  ON public.user_settings FOR INSERT
  WITH CHECK ( auth.uid() = id );

-- --------------------------------------------
-- Projects RLS policies
-- --------------------------------------------
CREATE POLICY "Users can view their own projects."
  ON public.projects FOR SELECT
  USING ( auth.uid() = user_id );

CREATE POLICY "Users can update their own projects."
  ON public.projects FOR UPDATE
  USING ( auth.uid() = user_id );

CREATE POLICY "Users can insert their own projects."
  ON public.projects FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can delete their own projects."
  ON public.projects FOR DELETE
  USING ( auth.uid() = user_id );
