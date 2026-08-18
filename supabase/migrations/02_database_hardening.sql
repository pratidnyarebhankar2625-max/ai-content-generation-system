-- ============================================================
-- MIGRATION 02: DATABASE HARDENING, INDEXES & TIMESTAMPS
-- ============================================================
-- Safe, idempotent migration to harden schema, add indexes,
-- add updated_at triggers, and prepare user_templates.

-- 1. Helper function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  new.updated_at = timezone('utc'::text, now());
  RETURN new;
END;
$$;

-- 2. Harden profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  avatar TEXT,
  bio TEXT,
  joined_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- 3. Harden user_settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  theme TEXT DEFAULT 'light' NOT NULL,
  language TEXT DEFAULT 'en-US' NOT NULL,
  writing_tone TEXT DEFAULT 'professional' NOT NULL,
  default_ai_model TEXT DEFAULT 'gemini-2.5-pro' NOT NULL,
  byok_api_key TEXT, -- Bring Your Own Key (Protected server-side)
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT false,
  generation_alerts BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_settings' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.user_settings ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- 4. Harden generations table
CREATE TABLE IF NOT EXISTS public.generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  template TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('completed', 'draft', 'failed')),
  preview TEXT NOT NULL,
  word_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'generations' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.generations ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_generations_updated_at ON public.generations;
CREATE TRIGGER update_generations_updated_at
  BEFORE UPDATE ON public.generations
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Indexes for frequently used user-scoped queries on generations
CREATE INDEX IF NOT EXISTS generations_user_id_idx ON public.generations(user_id);
CREATE INDEX IF NOT EXISTS generations_user_id_created_at_idx ON public.generations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS generations_user_id_category_idx ON public.generations(user_id, category);
CREATE INDEX IF NOT EXISTS generations_user_id_status_idx ON public.generations(user_id, status);

-- 5. Harden user_templates table
CREATE TABLE IF NOT EXISTS public.user_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  is_favorite BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_templates' AND column_name = 'content'
  ) THEN
    ALTER TABLE public.user_templates ADD COLUMN content TEXT NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_templates' AND column_name = 'is_favorite'
  ) THEN
    ALTER TABLE public.user_templates ADD COLUMN is_favorite BOOLEAN DEFAULT false NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_templates' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.user_templates ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
  END IF;
END $$;

DROP TRIGGER IF EXISTS update_user_templates_updated_at ON public.user_templates;
CREATE TRIGGER update_user_templates_updated_at
  BEFORE UPDATE ON public.user_templates
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Index for user-scoped templates query
CREATE INDEX IF NOT EXISTS user_templates_user_id_idx ON public.user_templates(user_id);

-- 6. Re-assert handle_new_user trigger on auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, name, avatar)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO NOTHING;

  -- Insert user_settings
  INSERT INTO public.user_settings (id)
  VALUES (new.id)
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 7. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_templates ENABLE ROW LEVEL SECURITY;

-- 8. Safe RLS Policies (Drop existing and recreate cleanly)

-- Profiles
DROP POLICY IF EXISTS "Users can view their own profile." ON public.profiles;
CREATE POLICY "Users can view their own profile."
  ON public.profiles FOR SELECT
  USING ( auth.uid() = id );

DROP POLICY IF EXISTS "Users can update their own profile." ON public.profiles;
CREATE POLICY "Users can update their own profile."
  ON public.profiles FOR UPDATE
  USING ( auth.uid() = id );

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT
  WITH CHECK ( auth.uid() = id );

-- User Settings
DROP POLICY IF EXISTS "Users can view their own settings." ON public.user_settings;
CREATE POLICY "Users can view their own settings."
  ON public.user_settings FOR SELECT
  USING ( auth.uid() = id );

DROP POLICY IF EXISTS "Users can update their own settings." ON public.user_settings;
CREATE POLICY "Users can update their own settings."
  ON public.user_settings FOR UPDATE
  USING ( auth.uid() = id );

DROP POLICY IF EXISTS "Users can insert their own settings." ON public.user_settings;
CREATE POLICY "Users can insert their own settings."
  ON public.user_settings FOR INSERT
  WITH CHECK ( auth.uid() = id );

-- Generations
DROP POLICY IF EXISTS "Users can view their own generations." ON public.generations;
CREATE POLICY "Users can view their own generations."
  ON public.generations FOR SELECT
  USING ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Users can update their own generations." ON public.generations;
CREATE POLICY "Users can update their own generations."
  ON public.generations FOR UPDATE
  USING ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Users can insert their own generations." ON public.generations;
CREATE POLICY "Users can insert their own generations."
  ON public.generations FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Users can delete their own generations." ON public.generations;
CREATE POLICY "Users can delete their own generations."
  ON public.generations FOR DELETE
  USING ( auth.uid() = user_id );

-- User Templates
DROP POLICY IF EXISTS "Users can view their own templates." ON public.user_templates;
CREATE POLICY "Users can view their own templates."
  ON public.user_templates FOR SELECT
  USING ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Users can update their own templates." ON public.user_templates;
CREATE POLICY "Users can update their own templates."
  ON public.user_templates FOR UPDATE
  USING ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Users can insert their own templates." ON public.user_templates;
CREATE POLICY "Users can insert their own templates."
  ON public.user_templates FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Users can delete their own templates." ON public.user_templates;
CREATE POLICY "Users can delete their own templates."
  ON public.user_templates FOR DELETE
  USING ( auth.uid() = user_id );
